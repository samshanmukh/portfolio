// Booking backend for the site chat, running as a Google Apps Script under Sam's own Google
// account, so it can read and write Sam's calendar without any Google Cloud setup.
//
// Setup (once):
// 1. script.google.com > New project, paste this file over Code.gs.
// 2. Left sidebar "Services" > + > Google Calendar API > Add (needed for Meet links).
// 3. Put a long random string in SECRET below; the same string goes in Vercel and .env.local
//    as BOOKING_SECRET.
// 4. Deploy > New deployment > type "Web app", Execute as "Me", Who has access "Anyone".
//    Allow the calendar permission, then copy the web app URL into BOOKING_SCRIPT_URL.
//    After editing this file, use Deploy > Manage deployments > edit > New version (same URL).

const SECRET = 'PASTE_THE_SAME_STRING_AS_BOOKING_SECRET'

// When people can book: Sam's time zone, weekdays, hours, slot length, how far ahead.
const TZ = 'America/Los_Angeles'
const WEEKDAYS = [1, 2, 3, 4, 5] // 1 = Monday ... 7 = Sunday
const START_HOUR = 10 // first slot starts at 10:00
const END_HOUR = 17 // last slot ends by 17:00
const MINUTES = 30
const DAYS_AHEAD = 14
const NOTICE_HOURS = 12 // no slots sooner than this

const LABEL = { video: 'Video call', phone: 'Phone call', inPerson: 'Coffee' }

function doPost(e) {
  let req
  try {
    req = JSON.parse(e.postData.contents)
  } catch (err) {
    return out({ error: 'bad-request' })
  }
  if (!req || req.secret !== SECRET) return out({ error: 'forbidden' })
  if (req.action === 'slots') return out({ slots: freeSlots(), minutes: MINUTES, timeZone: TZ })
  if (req.action === 'book') {
    // one booking at a time, so two visitors can't take the same slot
    const lock = LockService.getScriptLock()
    lock.waitLock(20000)
    try {
      return out(book(req))
    } finally {
      lock.releaseLock()
    }
  }
  if (req.action === 'cancel') return out(cancel(req))
  if (req.action === 'place') return out(findPlace(req.q))
  if (req.action === 'lookup') return out(lookup(req.email))
  if (req.action === 'cancelCode') return out(cancelWithCode(req.email, req.code))
  return out({ error: 'unknown-action' })
}

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON)
}

// Open slots (ISO start times) inside the hours above that don't overlap anything on the calendar.
function freeSlots() {
  const step = MINUTES * 60000
  const now = Date.now()
  const from = Math.ceil((now + NOTICE_HOURS * 3600000) / step) * step
  const until = now + DAYS_AHEAD * 86400000
  const busy = CalendarApp.getDefaultCalendar()
    .getEvents(new Date(from), new Date(until + step))
    .filter((ev) => !ev.isAllDayEvent() && ev.getMyStatus() !== CalendarApp.GuestStatus.NO)
    .map((ev) => [ev.getStartTime().getTime(), ev.getEndTime().getTime()])
  const slots = []
  for (let t = from; t + step <= until; t += step) {
    const d = new Date(t)
    const day = Number(Utilities.formatDate(d, TZ, 'u'))
    const mins = Number(Utilities.formatDate(d, TZ, 'H')) * 60 + Number(Utilities.formatDate(d, TZ, 'm'))
    if (WEEKDAYS.indexOf(day) < 0) continue
    if (mins < START_HOUR * 60 || mins + MINUTES > END_HOUR * 60) continue
    if (busy.some(([s, e]) => s < t + step && e > t)) continue
    slots.push(d.toISOString())
  }
  return slots
}

function book(req) {
  const type = req.type
  if (!LABEL[type]) return { error: 'bad-type' }
  const start = new Date(req.start)
  if (isNaN(start) || freeSlots().indexOf(start.toISOString()) < 0) return { error: 'slot-taken' }
  const end = new Date(start.getTime() + MINUTES * 60000)
  const event = {
    summary: `${LABEL[type]} with ${req.name}`,
    description: req.description || '',
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
    attendees: [{ email: req.email, displayName: req.name }],
  }
  if (type === 'inPerson') event.location = req.place
  if (type === 'phone') event.location = `Call ${req.phone}`
  if (type === 'video') {
    event.conferenceData = {
      createRequest: { requestId: Utilities.getUuid(), conferenceSolutionKey: { type: 'hangoutsMeet' } },
    }
  }
  // sendUpdates: the visitor gets a normal Google Calendar invite from Sam
  const created = Calendar.Events.insert(event, 'primary', { conferenceDataVersion: 1, sendUpdates: 'all' })
  return { ok: true, id: created.id, start: created.start.dateTime, meet: created.hangoutLink || null }
}

// Looks up a place the visitor named ("corgi cafe SF") with Google Maps, so the chat can check
// it with them and the invite carries a real address. Leans toward the Bay Area.
function findPlace(q) {
  q = String(q || '').slice(0, 160)
  if (!q) return { address: null }
  const r = Maps.newGeocoder().setRegion('us').setBounds(37.0, -122.7, 38.1, -121.6).geocode(q)
  const hit = r && r.status === 'OK' && r.results[0]
  return { address: hit ? hit.formatted_address : null }
}

const MARK = 'Booked from the chat on samkarri.com'
const WHAT = { 'Video call': 'video call', 'Phone call': 'call', Coffee: 'coffee' }

// The visitor's next meeting booked from the chat, by the email it was booked with.
function nextBooking(email) {
  email = String(email || '').toLowerCase()
  const items = Calendar.Events.list('primary', {
    timeMin: new Date().toISOString(),
    timeMax: new Date(Date.now() + 60 * 86400000).toISOString(),
    q: email,
    singleEvents: true,
    orderBy: 'startTime',
  }).items || []
  return items.find(
    (ev) => String(ev.description || '').indexOf(MARK) === 0 && (ev.attendees || []).some((a) => String(a.email).toLowerCase() === email)
  )
}

// Cancelling from another browser: email the visitor a code, so only the inbox owner can cancel.
function lookup(email) {
  const ev = nextBooking(email)
  if (!ev) return { found: 0 }
  // from a random UUID's hash, not Math.random
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid())
  const n = bytes.slice(0, 4).reduce((acc, b) => acc * 256 + (b & 255), 0)
  const code = String(100000 + (n % 900000))
  const kind = String(ev.summary).split(' with ')[0]
  CacheService.getScriptCache().put(
    'code:' + String(email).toLowerCase(),
    JSON.stringify({ code, id: ev.id, tries: 0, start: ev.start.dateTime, what: WHAT[kind] || 'meeting' }),
    600
  )
  const when = Utilities.formatDate(new Date(ev.start.dateTime), TZ, "EEE, MMM d 'at' h:mm a z")
  MailApp.sendEmail(
    email,
    `Your code to cancel ${ev.summary}`,
    `Your code is ${code}\n\nType it in the chat on samkarri.com to cancel "${ev.summary}" on ${when}. It works for 10 minutes.\n\nIf you didn't ask for this, you can ignore this email and nothing changes.`
  )
  // nothing about the meeting until the code proves it's them
  return { found: 1 }
}

function cancelWithCode(email, code) {
  const cache = CacheService.getScriptCache()
  const key = 'code:' + String(email || '').toLowerCase()
  const saved = JSON.parse(cache.get(key) || 'null')
  if (!saved) return { error: 'expired' }
  if (saved.code !== String(code)) {
    saved.tries += 1
    if (saved.tries >= 5) cache.remove(key)
    else cache.put(key, JSON.stringify(saved), 600)
    return { error: saved.tries >= 5 ? 'expired' : 'bad-code' }
  }
  try {
    Calendar.Events.remove('primary', saved.id, { sendUpdates: 'all' })
  } catch (err) {
    // already gone counts as cancelled; anything else keeps the code for another try
    if (!/not ?found|deleted|410|404/i.test(String(err))) return { error: 'failed' }
  }
  cache.remove(key)
  return { ok: true, start: saved.start, what: saved.what }
}

// Cancel a meeting booked from the chat: only one this script made, and only for the email it
// was booked with. The visitor gets Google's normal cancellation email.
function cancel(req) {
  let ev
  try {
    ev = Calendar.Events.get('primary', String(req.id || ''))
  } catch (err) {
    return { error: 'not-found' }
  }
  if (ev.status === 'cancelled') return { ok: true }
  const email = String(req.email || '').toLowerCase()
  const guest = (ev.attendees || []).some((a) => String(a.email).toLowerCase() === email)
  if (!guest || String(ev.description || '').indexOf('Booked from the chat on samkarri.com') !== 0) return { error: 'not-found' }
  Calendar.Events.remove('primary', ev.id, { sendUpdates: 'all' })
  return { ok: true }
}
