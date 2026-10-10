import { bookingEnabled, createBooking, getSlots, type MeetingType } from '../../lib/booking'

// In-chat booking. GET: open slots on Sam's calendar. POST: book one, with a note on what the
// visitor asked about in the chat, so the invite lands on Sam's calendar with that context.

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!bookingEnabled()) return Response.json({ enabled: false })
  try {
    return Response.json({ enabled: true, ...(await getSlots()) })
  } catch (e) {
    console.error('[book] slots error', e)
    // the reason ("forbidden" = secrets differ, "booking-401" = script not open to Anyone…) helps setup
    const reason = e instanceof Error ? e.message.slice(0, 80) : 'unknown'
    return Response.json({ enabled: true, error: 'unavailable', reason, slots: [] }, { status: 502 })
  }
}

// A few bookings per visitor a day: invites go out from Sam's own calendar, so nobody gets
// to spam people (or Sam's calendar) through it. In-memory, best effort.
const DAY_MS = 24 * 60 * 60 * 1000
const MAX_PER_DAY = 3
const hits = new Map<string, number[]>()
function limited(key: string): boolean {
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((t) => now - t < DAY_MS)
  if (recent.length >= MAX_PER_DAY) return true
  recent.push(now)
  hits.set(key, recent)
  if (hits.size > 5000) hits.clear()
  return false
}

const TYPES: MeetingType[] = ['video', 'phone', 'inPerson']
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,255}\.[a-z]{2,}$/i
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '')

type Turn = { role: 'user' | 'assistant'; content: string }

// one or two lines on what the visitor wanted to talk about, from the chat so far
async function summarize(chat: Turn[]): Promise<string> {
  const key = process.env.GROQ_API_KEY
  if (!key || !chat.length) return ''
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 120,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content:
              "Summarize in 1 to 2 plain sentences, for Sam, what this website visitor asked about and wants to talk about in their meeting with Sam. Only what the visitor said; no greetings, no em dashes.",
          },
          { role: 'user', content: chat.map((m) => `${m.role === 'user' ? 'Visitor' : 'Sam'}: ${m.content}`).join('\n') },
        ],
      }),
    })
    if (!r.ok) return ''
    const text = (await r.json())?.choices?.[0]?.message?.content
    return typeof text === 'string' ? text.trim().slice(0, 600) : ''
  } catch {
    return ''
  }
}

export async function POST(req: Request) {
  if (!bookingEnabled()) return Response.json({ error: 'off' }, { status: 503 })
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'bad-request' }, { status: 400 })
  }

  const type = body.type as MeetingType
  const start = str(body.start, 40)
  const name = str(body.name, 80)
  const email = str(body.email, 254)
  const phone = str(body.phone, 30)
  const place = str(body.place, 160)
  const about = str(body.about, 500)
  if (!TYPES.includes(type) || !name || !EMAIL.test(email) || isNaN(Date.parse(start)))
    return Response.json({ error: 'invalid' }, { status: 400 })
  if (type === 'phone' && phone.replace(/\D/g, '').length < 7) return Response.json({ error: 'phone' }, { status: 400 })
  if (type === 'inPerson' && !place) return Response.json({ error: 'place' }, { status: 400 })

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  if (limited(`ip:${ip}`) || limited(`email:${email.toLowerCase()}`))
    return Response.json({ error: 'rate-limited' }, { status: 429 })

  const chat: Turn[] = (Array.isArray(body.chat) ? body.chat : [])
    .filter((m: Turn) => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string')
    .slice(-10)
    .map((m: Turn) => ({ role: m.role, content: m.content.slice(0, 600) }))
  const asked = chat.filter((m) => m.role === 'user').map((m) => `- ${m.content.replace(/\s+/g, ' ')}`)
  const summary = await summarize(chat)
  const description = [
    `Booked from the chat on samkarri.com by ${name} (${email}).`,
    about && `They want to talk about: ${about}`,
    type === 'phone' && `Call them at ${phone}.`,
    type === 'inPerson' && `Place they suggested: ${place}`,
    summary && `Chat summary: ${summary}`,
    asked.length && `What they asked in the chat:\n${asked.join('\n')}`,
  ]
    .filter(Boolean)
    .join('\n\n')

  try {
    const r = await createBooking({ type, start, name, email, phone, place, description })
    return Response.json(r)
  } catch (e) {
    const msg = e instanceof Error ? e.message : ''
    if (msg === 'slot-taken') return Response.json({ error: 'slot-taken' }, { status: 409 })
    console.error('[book] create error', e)
    return Response.json({ error: 'failed' }, { status: 502 })
  }
}
