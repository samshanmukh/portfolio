import { fullContext } from '../../lib/full-context'
import { systemPrompt } from '../../lib/knowledge'

// Smart mode brain: a hosted LLM answering as Sam from everything on the site.
// Keys stay server-side (Vercel env / .env.local). Providers are tried in order
// (Mistral, then Groq's free tier), so a rate limit on one falls through to the
// next. The reply is streamed back as plain text. If none answers, a non-200
// goes back and the chat quietly falls back to the instant answers.

type Provider = { name: string; url: string; key?: string; model: string; extra?: Record<string, unknown> }
const PROVIDERS: Provider[] = [
  {
    name: 'mistral',
    url: 'https://api.mistral.ai/v1/chat/completions',
    key: process.env.MISTRAL_API_KEY,
    model: process.env.MISTRAL_MODEL || 'mistral-small-latest',
    extra: { max_tokens: 400 },
  },
  {
    name: 'groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    key: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
    // gpt-oss reasons before answering; keep it brief and leave room for the reply
    extra: { max_completion_tokens: 1000, reasoning_effort: 'low' },
  },
]
const configured = () => PROVIDERS.filter((p) => p.key)

const SYSTEM = systemPrompt(fullContext())

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
  try {
    const body = await req.json()
    messages = (Array.isArray(body?.messages) ? body.messages : [])
      // only the visitor's turns and earlier replies; the system prompt is always ours
      .filter((m: Msg) => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string')
      .slice(-8)
      .map((m: Msg) => ({ role: m.role, content: m.content.slice(0, 1500) }))
  } catch {
    return Response.json({ error: 'bad-request' }, { status: 400 })
  }
  if (messages.at(-1)?.role !== 'user') return Response.json({ error: 'empty' }, { status: 400 })

  let res: Response | null = null
  for (const p of configured()) {
    try {
      const r = await fetch(p.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p.key}` },
        body: JSON.stringify({
          model: p.model,
          stream: true,
          temperature: 0.5,
          ...p.extra,
          messages: [{ role: 'system', content: SYSTEM }, ...messages],
        }),
      })
      if (r.ok && r.body) {
        res = r
        break
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
  const stream = new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read()
      if (done) return controller.close()
      buf += decoder.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() ?? ''
      for (const line of lines) {
        const data = line.startsWith('data:') ? line.slice(5).trim() : ''
        if (!data || data === '[DONE]') continue
        try {
          const delta = JSON.parse(data)?.choices?.[0]?.delta?.content
          if (typeof delta === 'string' && delta) controller.enqueue(encoder.encode(delta))
        } catch {
          // partial or non-JSON line; skip
        }
      }
    },
    cancel() {
      reader.cancel()
    },
  })
  return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } })
}
