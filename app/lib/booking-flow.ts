// ---------------------------------------------------------------------------
// In-chat booking as a soft conversation: one question at a time, with tap-to-answer chips,
// typed answers welcome too. Pure logic; the chat shows the questions and does the booking.
// The model never confirms anything: only the visitor's "Yes, book it" books, through /api/book.
// ---------------------------------------------------------------------------
import type { MeetingType } from './booking'

export type Stage = 'type' | 'day' | 'time' | 'place' | 'placeCheck' | 'phone' | 'name' | 'email' | 'confirm'
export type Flow = {
  stage: Stage
  slots: string[]
  type?: MeetingType
  day?: string // yyyy-mm-dd in the visitor's time zone
  start?: string
  place?: string
  found?: string // the address Google Maps found for `place`, waiting for the visitor's ok
  phone?: string
  name?: string
  email?: string
}
export type Say = { text: string; chips?: string[] }
// what the visitor's answer leads to: the next question, a place to look up, a confirmed booking,
// or leaving the flow
export type Step = { flow: Flow; say: Say } | { lookup: Flow } | { book: Flow } | { done: Say }

export const NEVER_MIND = 'Never mind'
const YES = 'Yes, book it'
const CHANGE = 'Change the time'
const THAT_ONE = 'Yes, that one'
const ELSEWHERE = 'Somewhere else'

const TYPES: { type: MeetingType; chip: string; words: RegExp; label: string }[] = [
  { type: 'video', chip: 'Video call', words: /video|google meet|zoom|online|virtual/, label: 'a video call' },
  { type: 'phone', chip: 'Phone call', words: /phone|call me|ring|number/, label: 'a phone call' },
  { type: 'inPerson', chip: 'In person', words: /person|coffee|caf|irl|meet up|lunch|face/, label: 'coffee in person' },
]

const dayKey = (iso: string) => new Date(iso).toLocaleDateString('en-CA')
export const dayLabel = (iso: string) => new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
const longDay = (iso: string) => new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
export const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
const EMAIL = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()

function days(slots: string[]): [string, string][] {
  return [...new Map(slots.map((s) => [dayKey(s), s])).entries()]
}

export function question(f: Flow): Say {
  const first = f.name?.split(' ')[0]
  switch (f.stage) {
    case 'type':
      return { text: 'How would you like to meet: a video call, a phone call, or coffee in person?', chips: [...TYPES.map((t) => t.chip), NEVER_MIND] }
    case 'day':
      return { text: 'Which day works for you?', chips: [...days(f.slots).slice(0, 6).map(([, s]) => dayLabel(s)), NEVER_MIND] }
    case 'time': {
      const times = f.slots.filter((s) => dayKey(s) === f.day)
      return { text: `What time on ${longDay(times[0])}? Times are in your time zone.`, chips: [...times.map(timeLabel), 'Another day'] }
    }
    case 'place':
      return { text: 'Where should we meet? A café you like, your office, anywhere easy for you.' }
    case 'placeCheck':
      return { text: `I found ${f.place} at ${f.found}. Is that the right place?`, chips: [THAT_ONE, ELSEWHERE] }
    case 'phone':
      return { text: "What's the best number to call you on?" }
    case 'name':
      return { text: "Perfect. And what's your name?" }
    case 'email':
      return { text: `Nice to meet you${first ? `, ${first}` : ''}! What email should I send the invite to?` }
    case 'confirm': {
      const t = TYPES.find((x) => x.type === f.type)!
      const where = f.type === 'inPerson' ? ` at ${f.place}` : f.type === 'phone' ? `, I'll call ${f.phone}` : ''
      return {
        text: `Just to check: ${t.label}${where}, ${longDay(f.start!)} at ${timeLabel(f.start!)}, and the invite goes to ${f.email}. Should I book it?`,
        chips: [YES, CHANGE, NEVER_MIND],
      }
    }
  }
}

// after the place is settled: their name, or straight to the recap if we have it
export const afterPlace = (f: Flow): Step => next({ ...f, found: undefined }, f.name ? 'confirm' : 'name')

const next = (f: Flow, stage: Stage): Step => {
  const flow = { ...f, stage }
  return { flow, say: question(flow) }
}
// gently ask again, with the same chips
const again = (f: Flow, hint: string): Step => {
  const q = question(f)
  return { flow: f, say: { ...q, text: `${hint} ${q.text}`.trim() } }
}

// the visitor's typed or tapped answer to the current question
export function answer(f: Flow, raw: string): Step {
  const a = norm(raw)
  if (a === norm(NEVER_MIND) || /^(cancel|stop|nevermind|no thanks|forget it)\b/.test(a))
    return { done: { text: "No worries! If you change your mind, just say you'd like to meet. What else can I tell you?" } }

  switch (f.stage) {
    case 'type': {
      const t = TYPES.find((x) => a === norm(x.chip)) ?? [...TYPES].reverse().find((x) => x.words.test(a))
      return t ? next({ ...f, type: t.type }, 'day') : again(f, 'Sorry, I missed that.')
    }
    case 'day': {
      const all = days(f.slots)
      // a whole word or date only, so "no" or "may" never quietly picks the first day
      const word = (w: string) => new RegExp(`\\b${w}\\b`).test(a.replace(/,/g, ''))
      const hit = all.find(([, s]) => {
        const d = new Date(s)
        const label = norm(dayLabel(s))
        const weekday = d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
        const month = d.toLocaleDateString('en-US', { month: 'short' }).toLowerCase()
        return a === label || word(weekday) || word(weekday.slice(0, 3)) || word(`${month}[a-z]* ${d.getDate()}(st|nd|rd|th)?`)
      })
      return hit ? next({ ...f, day: hit[0] }, 'time') : again(f, "I don't have an opening then.")
    }
    case 'time': {
      if (a === 'another day') return next({ ...f, day: undefined }, 'day')
      const times = f.slots.filter((s) => dayKey(s) === f.day)
      // a whole time like "2", "2pm", "2:30 pm" or "1430", never a stray number in a sentence ("2 weeks")
      const m = a.match(/^(?:(?:at|around|how about|maybe|ok|okay)\s+)?(\d{1,2})(?::?(\d{2}))?\s*(am|pm|a\.?m\.?|p\.?m\.?)?\s*(?:works|is good|please)?[.!?]?$/)
      const hit = times.find((s) => {
        if (a === norm(timeLabel(s))) return true
        if (!m) return false
        const d = new Date(s)
        let h = Number(m[1])
        const pm = m[3]?.startsWith('p')
        if (pm && h < 12) h += 12
        if (m[3] && !pm && h === 12) h = 0 // 12am is midnight
        if (!m[3] && h < 8) h += 12 // "at 2" means the afternoon
        return d.getHours() === h && d.getMinutes() === Number(m[2] ?? 0)
      })
      if (!hit) return again(f, "That time isn't open.")
      const flow = { ...f, start: hit }
      return next(flow, f.type === 'inPerson' ? 'place' : f.type === 'phone' ? 'phone' : f.name ? 'confirm' : 'name')
    }
    case 'place':
      return raw.trim().length < 2 ? again(f, '') : { lookup: { ...f, place: raw.trim().slice(0, 160) } }
    case 'placeCheck':
      if (a === norm(THAT_ONE) || /^(yes|yep|yeah|yup|correct|right|that'?s it|sure|ok|okay|perfect)\b/.test(a))
        return afterPlace({ ...f, place: f.found!.toLowerCase().includes(f.place!.toLowerCase()) ? f.found : `${f.place}, ${f.found}` })
      if (a === norm(ELSEWHERE) || /^(no|nope|nah|wrong|not that)\b/.test(a))
        return { flow: { ...f, found: undefined, stage: 'place' }, say: { text: 'No problem. What is the name of the place and the area or street?' } }
      // they typed another place instead: look that one up
      return { lookup: { ...f, found: undefined, place: raw.trim().slice(0, 160) } }
    case 'phone':
      return raw.replace(/\D/g, '').length < 7
        ? again(f, "Hmm, that doesn't look like a phone number.")
        : next({ ...f, phone: raw.trim().slice(0, 30) }, f.name ? 'confirm' : 'name')
    case 'name': {
      const name = raw.trim().replace(/^(i'?m|my name is|it'?s|this is)\s+/i, '').slice(0, 80)
      return name ? next({ ...f, name }, 'email') : again(f, '')
    }
    case 'email': {
      const email = raw.match(EMAIL)?.[0]
      return email ? next({ ...f, email }, 'confirm') : again(f, "Hmm, that doesn't look like an email.")
    }
    case 'confirm':
      if (a === norm(YES) || /^(yes|yep|yeah|sure|ok|okay|book|confirm|sounds good|perfect)\b/.test(a)) return { book: f }
      if (a === norm(CHANGE) || /change|different|another|other/.test(a)) return next({ ...f, start: undefined, day: undefined }, 'day')
      if (/^(no|nope|nah)\b/.test(a)) return { done: { text: "No worries, I won't book it. If you'd like to pick another time later, just say so. What else can I tell you?" } }
      return again(f, '')
  }
}
