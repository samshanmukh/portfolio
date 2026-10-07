// ---------------------------------------------------------------------------
// Events Sam hosts or attends, read server-side from the secret iCal address
// of their Google Calendar (GOOGLE_CALENDAR_ICS_URL). Nothing shows unless Sam
// marks the event for the site: visibility set to Public (works on invites too),
// or "#portfolio" in the title or description of an event Sam created.
// Events count as Attending unless Sam created them with guests or wrote "#hosting".
// Only public details leave the server: name, time, place and a public event
// link. Never guests, descriptions or meeting links.
// ---------------------------------------------------------------------------
import { rrulestr } from 'rrule'

export type EventRole = 'hosting' | 'attending'

export type CalendarEvent = {
  id: string
  title: string
  start: string // ISO
  end: string | null
  allDay: boolean
  timeZone: string
  location?: string
  url?: string
  role: EventRole
}

export type EventsPayload = {
  configured: boolean
  error?: boolean // the calendar address couldn't be read
  upcoming: CalendarEvent[]
  recent: CalendarEvent[]
}

const DAY = 86_400_000
const UPCOMING_DAYS = 365
const RECENT_DAYS = 120
const MARKER = /#portfolio\b/gi
const HOSTING = /#hosting\b/gi
const tagged = (r: Raw, tag: RegExp) =>
  new RegExp(tag.source, 'i').test(`${get(r, 'SUMMARY')?.value ?? ''}\n${get(r, 'DESCRIPTION')?.value ?? ''}`)

// Hosts whose links are safe to show as "the event page".
const EVENT_HOSTS = [
  'lu.ma',
  'luma.com',
  'eventbrite.com',
  'meetup.com',
  'partiful.com',
  'devpost.com',
  'posh.vip',
  'cerebralvalley.ai',
  'ti.to',
  'tito.io',
  'splashthat.com',
  'ra.co',
  'dice.fm',
  'mlh.io',
  'events.mlh.io',
  'rsvp.withgoogle.com',
  'events.withgoogle.com',
  'gdg.community.dev',
]
const MEETING_HOSTS = ['meet.google.com', 'zoom.us', 'teams.microsoft.com', 'teams.live.com', 'webex.com', 'whereby.com', 'gotomeeting.com']

const hostOf = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}
const matches = (host: string, list: string[]) => list.some((h) => host === h || host.endsWith(`.${h}`))
const isEventLink = (u: string) => {
  const host = hostOf(u)
  if (!host) return false
  if (matches(host, EVENT_HOSTS)) return true
  return host === 'linkedin.com' && new URL(u).pathname.startsWith('/events/')
}
const isMeetingLink = (u: string) => matches(hostOf(u), MEETING_HOSTS)
const URL_RE = /https?:\/\/[^\s<>"')\]]+/g

// ---------- iCal parsing ----------

type Prop = { name: string; params: Record<string, string>; value: string }

function parseLine(line: string): Prop | null {
  // NAME;PARAM=V;PARAM="a:b":value  (colons inside quotes are not the separator)
  let i = 0
  let quoted = false
  for (; i < line.length; i++) {
    const c = line[i]
    if (c === '"') quoted = !quoted
    else if (c === ':' && !quoted) break
  }
  if (i >= line.length) return null
  const head = line.slice(0, i)
  const value = line.slice(i + 1)
  const parts = head.match(/(?:[^;"]|"[^"]*")+/g) ?? []
  const params: Record<string, string> = {}
  for (const p of parts.slice(1)) {
    const eq = p.indexOf('=')
    if (eq > 0) params[p.slice(0, eq).toUpperCase()] = p.slice(eq + 1).replace(/^"|"$/g, '')
  }
  return { name: (parts[0] ?? '').toUpperCase(), params, value }
}

const unescapeText = (s: string) =>
  s.replace(/\\(n|N|,|;|\\)/g, (_, c: string) => (c === 'n' || c === 'N' ? '\n' : c))

type Raw = { props: Prop[] }
type Calendar = { timeZone: string; owner?: string; events: Raw[] }

function parseCalendar(text: string): Calendar {
  const lines = text.replace(/\r?\n[ \t]/g, '').split(/\r?\n/)
  const events: Raw[] = []
  let cur: Raw | null = null
  let depth = 0 // nested components inside a VEVENT (VALARM)
  let timeZone = 'UTC'
  let owner: string | undefined
  for (const line of lines) {
    if (!line) continue
    if (line === 'BEGIN:VEVENT') {
      cur = { props: [] }
      depth = 0
      continue
    }
    if (line === 'END:VEVENT') {
      if (cur) events.push(cur)
      cur = null
      continue
    }
    if (cur) {
      if (line.startsWith('BEGIN:')) depth++
      else if (line.startsWith('END:')) depth--
      else if (depth === 0) {
        const p = parseLine(line)
        if (p) cur.props.push(p)
      }
      continue
    }
    const p = parseLine(line)
    if (p?.name === 'X-WR-TIMEZONE') timeZone = p.value.trim()
    if (p?.name === 'X-WR-CALNAME' && p.value.includes('@')) owner = p.value.trim().toLowerCase()
  }
  return { timeZone, owner, events }
}

// ---------- time ----------

// A wall-clock time stored as if it were UTC ("floating"), plus how to pin it down.
type When = { floating: number; utc: boolean; allDay: boolean; tz: string }

function parseWhen(p: Prop | undefined, calTz: string): When | null {
  if (!p) return null
  const m = p.value.trim().match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/)
  if (!m) return null
  const [, y, mo, d, h, mi, s, z] = m
  const allDay = h === undefined
  const floating = Date.UTC(+y, +mo - 1, +d, allDay ? 0 : +h, allDay ? 0 : +mi, allDay ? 0 : +s)
  return { floating, utc: !!z, allDay, tz: p.params.TZID ?? calTz }
}

function tzOffset(ms: number, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(ms))
  const get = (t: string) => Number(parts.find((x) => x.type === t)?.value)
  return Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second')) - ms
}

// floating wall time in `tz` -> real UTC milliseconds
function toUtc(floating: number, tz: string): number {
  try {
    let ms = floating - tzOffset(floating, tz)
    ms = floating - tzOffset(ms, tz)
    return ms
  } catch {
    return floating // unknown zone name: treat as UTC
  }
}

const realMs = (w: When, floating = w.floating) => (w.utc || w.allDay ? floating : toUtc(floating, w.tz))

// ---------- events ----------

const get = (r: Raw, name: string) => r.props.find((p) => p.name === name)
const all = (r: Raw, name: string) => r.props.filter((p) => p.name === name)
const email = (p: Prop | undefined) => p?.value.replace(/^mailto:/i, '').trim().toLowerCase()

// Sam often adds events they're going to by hand (and Luma invites come from Luma),
// so an event Sam created only counts as hosting when it has guests or says #hosting.
function roleOf(r: Raw, owner: string | undefined): EventRole | null {
  const attendees = all(r, 'ATTENDEE')
  const me = owner ? attendees.find((a) => email(a) === owner) : undefined
  const rsvp = me?.params.PARTSTAT?.toUpperCase()
  if (rsvp === 'DECLINED') return null
  if (isOwn(r, owner)) {
    return tagged(r, HOSTING) || attendees.some((a) => email(a) !== owner) ? 'hosting' : 'attending'
  }
  return rsvp === 'ACCEPTED' ? 'attending' : null
}

// Tags are only trusted in events Sam wrote; anyone else's title or description can't publish or relabel.
function isOwn(r: Raw, owner: string | undefined): boolean {
  const organizer = email(get(r, 'ORGANIZER'))
  return !organizer || (!!owner && organizer === owner)
}

const isMarked = (r: Raw, owner: string | undefined) =>
  get(r, 'CLASS')?.value.trim().toUpperCase() === 'PUBLIC' || (isOwn(r, owner) && tagged(r, MARKER))

// Event pages without query or fragment: Luma's ?pk= is a personal ticket key.
const cleanLink = (u: string) => {
  const url = new URL(u)
  url.search = ''
  url.hash = ''
  return url.toString()
}

function publicDetails(r: Raw): { title: string; location?: string; url?: string } {
  const title = unescapeText(get(r, 'SUMMARY')?.value ?? 'Untitled event').replace(MARKER, '').replace(HOSTING, '').replace(/\s{2,}/g, ' ').trim()
  let location = unescapeText(get(r, 'LOCATION')?.value ?? '').trim() || undefined
  const own = get(r, 'URL')?.value.trim()
  let url = own && isEventLink(own) ? own : undefined

  if (location && /^https?:\/\//i.test(location)) {
    if (!url && isEventLink(location)) url = location
    location = isMeetingLink(location) ? 'Online' : undefined
  }
  if (!url) {
    const desc = unescapeText(get(r, 'DESCRIPTION')?.value ?? '')
    url = (desc.match(URL_RE) ?? []).map((u) => u.replace(/[.,;]+$/, '')).find(isEventLink)
  }
  if (!location && get(r, 'X-GOOGLE-CONFERENCE')) location = 'Online'
  return { title: title || 'Untitled event', location, url: url && cleanLink(url) }
}

function occurrences(r: Raw, start: When, from: number, to: number, overridden: Set<number>): number[] {
  const rule = get(r, 'RRULE')?.value
  if (!rule) return [start.floating]
  const excluded = new Set<number>(overridden)
  for (const ex of all(r, 'EXDATE')) {
    for (const v of ex.value.split(',')) {
      const w = parseWhen({ ...ex, value: v }, start.tz)
      if (w) excluded.add(w.floating)
    }
  }
  try {
    // expand in floating wall time so DST shifts keep the same local hour
    const set = rrulestr(`RRULE:${rule}`, { dtstart: new Date(start.floating) })
    return set
      .between(new Date(from - 2 * DAY), new Date(to + 2 * DAY), true)
      .map((d) => d.getTime())
      .filter((f) => !excluded.has(f))
  } catch {
    return [start.floating]
  }
}

export function eventsFromIcs(text: string, ownerHint?: string, now = Date.now()): Omit<EventsPayload, 'configured'> {
  const cal = parseCalendar(text)
  const owner = ownerHint?.toLowerCase() ?? cal.owner
  const from = now - RECENT_DAYS * DAY
  const to = now + UPCOMING_DAYS * DAY

  // moved or edited single occurrences of a recurring event: UID -> floating recurrence ids
  const overrides = new Map<string, Set<number>>()
  for (const r of cal.events) {
    const rid = parseWhen(get(r, 'RECURRENCE-ID'), cal.timeZone)
    const uid = get(r, 'UID')?.value
    if (rid && uid) {
      if (!overrides.has(uid)) overrides.set(uid, new Set())
      overrides.get(uid)!.add(rid.floating)
    }
  }

  const out: (CalendarEvent & { uid: string })[] = []
  for (const r of cal.events) {
    if (get(r, 'STATUS')?.value.trim().toUpperCase() === 'CANCELLED') continue
    const start = parseWhen(get(r, 'DTSTART'), cal.timeZone)
    if (!start) continue
    const role = roleOf(r, owner)
    if (!role || !isMarked(r, owner)) continue

    const endW = parseWhen(get(r, 'DTEND'), start.tz)
    const length = endW ? endW.floating - start.floating : start.allDay ? DAY : 0
    const uid = get(r, 'UID')?.value ?? `${start.floating}`
    const isOverride = !!get(r, 'RECURRENCE-ID')
    const details = publicDetails(r)

    for (const f of occurrences(r, start, from, to, isOverride ? new Set() : overrides.get(uid) ?? new Set())) {
      const s = realMs(start, f)
      const e = length ? realMs(start, f + length) : null
      if ((e ?? s) < from || s > to) continue
      out.push({
        id: `${uid}-${f}`,
        uid,
        ...details,
        start: new Date(s).toISOString(),
        end: e ? new Date(e).toISOString() : null,
        allDay: start.allDay,
        timeZone: start.utc ? cal.timeZone : start.tz,
        role,
      })
    }
  }

  out.sort((a, b) => a.start.localeCompare(b.start))
  // one card per series: the next date of a recurring event, or its latest if none is coming up
  const seen = new Set<string>()
  const pick = (xs: typeof out, n: number) =>
    xs
      .filter((e) => !seen.has(e.uid) && !!seen.add(e.uid))
      .slice(0, n)
      .map(({ uid: _uid, ...e }) => e)
  // still running counts as upcoming
  const upcoming = pick(out.filter((e) => new Date(e.end ?? e.start).getTime() >= now), 8)
  const recent = pick(out.filter((e) => new Date(e.end ?? e.start).getTime() < now).reverse(), 4)
  return { upcoming, recent }
}

// The calendar's owner, from the secret address itself (…/ical/<email>/private-…/basic.ics).
function ownerFromUrl(url: string): string | undefined {
  const m = url.match(/\/ical\/([^/]+)\//)
  if (!m) return undefined
  const id = decodeURIComponent(m[1])
  return id.includes('@') && !id.endsWith('calendar.google.com') ? id : undefined
}

export async function getEvents(): Promise<EventsPayload> {
  const url = process.env.GOOGLE_CALENDAR_ICS_URL
  if (!url) return { configured: false, upcoming: [], recent: [] }
  try {
    const res = await fetch(url, { next: { revalidate: 900 } })
    if (!res.ok) throw new Error(`calendar ${res.status}`)
    const owner = process.env.GOOGLE_CALENDAR_EMAIL || ownerFromUrl(url)
    return { configured: true, ...eventsFromIcs(await res.text(), owner) }
  } catch (e) {
    console.error('[events] calendar fetch failed', e instanceof Error ? e.message : e)
    return { configured: true, error: true, upcoming: [], recent: [] }
  }
}

// ---------- smart mode ----------

function when(e: CalendarEvent): string {
  const opts: Intl.DateTimeFormatOptions = e.allDay
    ? { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }
    : { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: e.timeZone, timeZoneName: 'short' }
  try {
    return new Intl.DateTimeFormat('en-US', opts).format(new Date(e.start))
  } catch {
    return e.start
  }
}

const line = (e: CalendarEvent) =>
  `- ${e.role === 'hosting' ? 'Hosting' : 'Attending'}: ${e.title}, ${when(e)}${e.location ? `, ${e.location}` : ''}${e.url ? `, page ${e.url}` : ''}`

// The same public events the Events card shows, as a short block for smart mode's prompt.
// Empty when no calendar is connected or it couldn't be read, so smart mode never claims Sam has no plans.
export function eventsContext({ configured, error, upcoming, recent }: EventsPayload & { error?: boolean }, now = Date.now()): string {
  if (!configured || error) return ''
  const today = new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeZone: 'America/Los_Angeles' }).format(new Date(now))
  return [
    `\nMY EVENTS (from my calendar, public ones only; today is ${today}):`,
    'Upcoming:',
    ...(upcoming.length ? upcoming.map(line) : ['- none on my calendar right now']),
    ...(recent.length ? ['Recent:', ...recent.map(line)] : []),
  ].join('\n')
}
