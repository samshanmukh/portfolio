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
  return { ok: true, start: created.start.dateTime, meet: created.hangoutLink || null }
}
