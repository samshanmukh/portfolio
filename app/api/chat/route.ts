import { fullContext } from '../../lib/full-context'
import { systemPrompt } from '../../lib/knowledge'

// Smart mode brain: Mistral, answering as Sam from everything on the site.
// MISTRAL_API_KEY stays server-side (Vercel env / .env.local). The reply is
// streamed back as plain text. Any problem (no key, rate limit, Mistral down)
// returns a non-200 and the chat quietly falls back to the instant answers.

const MODEL = process.env.MISTRAL_MODEL || 'mistral-small-latest'
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

// GET tells the chat whether smart mode can use Mistral (key present), without exposing it.
export function GET() {
  return Response.json({ enabled: !!process.env.MISTRAL_API_KEY, model: MODEL })
}

export async function POST(req: Request) {
  const key = process.env.MISTRAL_API_KEY
  if (!key) return Response.json({ error: 'no-key' }, { status: 503 })

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

  let res: Response
  try {
    res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        stream: true,
        temperature: 0.5,
        max_tokens: 400,
        messages: [{ role: 'system', content: SYSTEM }, ...messages],
      }),
    })
  } catch {
    return Response.json({ error: 'network' }, { status: 502 })
  }
  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => '')
    console.error('[chat] Mistral error', res.status, detail.slice(0, 300))
    return Response.json({ error: `mistral-${res.status}` }, { status: res.status === 429 ? 429 : 502 })
  }

  // Mistral streams OpenAI-style SSE; pass just the text deltas through.
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
