import { eventsContext, getEvents } from '../../lib/calendar'
import { cleanReply } from '../../lib/clean-reply'
import { bookingEnabled } from '../../lib/booking'
import { socials } from '../../lib/data'
import { fullContext } from '../../lib/full-context'
import { systemPrompt } from '../../lib/knowledge'

// Smart mode brain: a hosted LLM answering as Sam from everything on the site.
// Keys stay server-side (Vercel env / .env.local). Providers are tried in order
// (Groq's free models, then Mistral), so a rate limit on one falls through to the
// next. The reply is streamed back as plain text. If none answers, a non-200
// goes back and the chat quietly falls back to the instant answers.

type Provider = { name: string; url: string; key?: string; model: string; extra?: Record<string, unknown> }
// Groq's free tier limits each model separately (about 8k tokens a minute), and every
// question carries ~4k tokens of context, so back-to-back questions overflow one model.
// Falling through to sibling Groq models on the same key triples the headroom.
const groq = (model: string, extra: Record<string, unknown>): Provider => ({
  name: `groq ${model}`,
  url: 'https://api.groq.com/openai/v1/chat/completions',
  key: process.env.GROQ_API_KEY,
  model,
  extra,
})
// gpt-oss reasons before answering; keep it brief and leave room for the reply
const GPT_OSS = { max_completion_tokens: 700, reasoning_effort: 'low' }
const PROVIDERS: Provider[] = [
  groq(process.env.GROQ_MODEL || 'openai/gpt-oss-120b', GPT_OSS),
  groq('openai/gpt-oss-20b', GPT_OSS),
  groq('llama-3.1-8b-instant', { max_tokens: 400 }),
  {
    name: 'mistral',
    url: 'https://api.mistral.ai/v1/chat/completions',
    key: process.env.MISTRAL_API_KEY,
    model: process.env.MISTRAL_MODEL || 'mistral-small-latest',
    extra: { max_tokens: 400 },
  },
]
const configured = () => PROVIDERS.filter((p) => p.key)
// a model that just rate-limited is skipped until its retry-after passes, so the next
// question goes straight to one with room instead of paying for a doomed call
const coolUntil = new Map<string, number>()

const SYSTEM = `${systemPrompt(fullContext())}\nFormatting: chat-style plain text. You may use **bold** for names and short "- " bullet lists, nothing else (no headings, tables or code). Put a colon after a bolded name, never a dash, and never use em dashes. Don't paste raw URLs; when a link helps, write it as [short label](url). Keep lists to the few items that matter.\nThis is an ongoing chat: read the earlier messages to work out what "it" or "that" refers to. If asked what you think about something, give a short honest take grounded in how you actually used it in the facts above, and don't invent experiences, benchmarks or numbers.\nMeetings: you can't see or book your calendar from this chat, so never agree to, confirm or suggest a time, date or place, never say where you hang out, and don't invite visitors to meet unprompted. When the visitor wants to meet, call, video chat or grab coffee (or says yes to it), ${bookingEnabled() ? 'say in one short sentence that they can pick video, phone or in person, a time (and a place if in person) and confirm it in the booking card below, which puts it on your calendar' : `say in one short sentence that they can email you at ${socials.email} to set up a time`}, then end the reply with [[book]] (the chat turns that into the booking card; never write a booking link yourself, and never say a meeting is booked or confirmed, only the card does that).`

// Best-effort per-visitor limit so nobody can run up the Mistral bill. In-memory,
// so it resets when the serverless instance does; Mistral's own limit backs it up.
const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 30
const hits = new Map<string, number[]>()
function limited(ip: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 5000) hits.clear()
  return recent.length > MAX_PER_WINDOW
}

type Msg = { role: 'user' | 'assistant'; content: string }

// GET tells the chat whether smart mode has a hosted model (some key present), without exposing it.
export function GET() {
  return Response.json({ enabled: configured().length > 0 })
}

export async function POST(req: Request) {
  if (!configured().length) return Response.json({ error: 'no-key' }, { status: 503 })

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  if (limited(ip)) return Response.json({ error: 'rate-limited' }, { status: 429 })

  let messages: Msg[] = []
  // events change, so they're read per question (getEvents caches the calendar for 15 minutes)
  let system = SYSTEM + eventsContext(await getEvents())
  try {
    const body = await req.json()
    // the chat shows a card for this question already (projects, skills…); don't repeat it
    if (typeof body?.view === 'string' && /^[a-z]{2,20}$/.test(body.view)) {
      system += `\nA "${body.view}" card with the full details is already on screen right above your reply. Don't list or repeat what it shows; answer in 1 to 2 sentences that add something, then ask a short question.`
    }
    messages = (Array.isArray(body?.messages) ? body.messages : [])
      // only the visitor's turns and earlier replies; the system prompt is always ours
      .filter((m: Msg) => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string')
      .slice(-6)
      .map((m: Msg) => ({ role: m.role, content: m.content.slice(0, 1500) }))
  } catch {
    return Response.json({ error: 'bad-request' }, { status: 400 })
  }
  if (messages.at(-1)?.role !== 'user') return Response.json({ error: 'empty' }, { status: 400 })

  let res: Response | null = null
  for (const p of configured()) {
    if ((coolUntil.get(p.name) ?? 0) > Date.now()) continue
    try {
      const r = await fetch(p.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p.key}` },
        body: JSON.stringify({
          model: p.model,
          stream: true,
          temperature: 0.5,
          ...p.extra,
          messages: [{ role: 'system', content: system }, ...messages],
        }),
      })
      if (r.ok && r.body) {
        res = r
        break
      }
      if (r.status === 429) {
        const wait = Number(r.headers.get('retry-after')) || 20
        coolUntil.set(p.name, Date.now() + Math.min(wait, 120) * 1000)
      }
      const detail = await r.text().catch(() => '')
      console.error(`[chat] ${p.name} error`, r.status, detail.slice(0, 300))
    } catch (e) {
      console.error(`[chat] ${p.name} network error`, e)
    }
  }
  if (!res?.body) return Response.json({ error: 'no-provider' }, { status: 502 })

  // Both stream OpenAI-style SSE; pass just the answer's text deltas through.
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  let buf = ''
  // the reply goes out cleaned (no speaker label, no em dashes). Text is held back until a
  // possible label at the start is settled, and trailing spaces wait for the next word so
  // an em dash arriving next can still swallow them.
  let raw = ''
  let sent = 0
  const ready = () => {
    const clean = cleanReply(raw)
    if (raw.length < 40 && !raw.includes('\n')) return ''
    // hold back trailing spaces and a dash that may still turn into a comma
    const upto = clean.replace(/\s*[—–]?\s*$/, '').length - 1
    if (upto <= sent) return ''
    const out = clean.slice(sent, upto)
    sent = upto
    return out
  }
  const stream = new ReadableStream({
    // keep reading until some answer text goes out: a pull that enqueues nothing is never
    // called again, and gpt-oss sends reasoning-only chunks (no content) before the answer
    async pull(controller) {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) {
          const rest = cleanReply(raw).slice(sent)
          if (rest) controller.enqueue(encoder.encode(rest))
          return controller.close()
        }
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''
        const before = sent
        for (const line of lines) {
          const data = line.startsWith('data:') ? line.slice(5).trim() : ''
          if (!data || data === '[DONE]') continue
          try {
            const delta = JSON.parse(data)?.choices?.[0]?.delta?.content
            if (typeof delta === 'string' && delta) raw += delta
          } catch {
            // partial or non-JSON line; skip
          }
        }
        const out = ready()
        if (out) controller.enqueue(encoder.encode(out))
        if (sent > before) return
      }
    },
    cancel() {
      reader.cancel()
    },
  })
  return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } })
}
