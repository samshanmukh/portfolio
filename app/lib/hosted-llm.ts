// ---------------------------------------------------------------------------
// Client side of smart mode's hosted brain (Mistral or Groq, via /api/chat). Keys never reach
// the browser; the route answers as Sam from everything on the site.
// ---------------------------------------------------------------------------
import type { ChatMsg } from './webllm'

export const HOSTED_LABEL = 'smart · hosted'

// true when the server has a Mistral or Groq key configured
export async function hostedAvailable(): Promise<boolean> {
  try {
    const res = await fetch('/api/chat', { cache: 'no-store' })
    return res.ok && (await res.json())?.enabled === true
  } catch {
    return false
  }
}

// Streams the reply via onToken(fullTextSoFar); throws on any error (every provider
// rate-limited or down, no key) so the caller can fall back to the instant answers.
export async function hostedStream(messages: ChatMsg[], onToken: (full: string) => void): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: messages.filter((m) => m.role !== 'system') }),
  })
  if (!res.ok || !res.body) throw new Error(`chat-${res.status}`)
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let full = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    full += decoder.decode(value, { stream: true })
    onToken(noEmDash(full))
  }
  if (!full.trim()) throw new Error('chat-empty')
  return noEmDash(full)
}

// the site never shows em dashes to visitors; models love them, so swap any for a comma
const noEmDash = (t: string) => t.replace(/\s*—\s*/g, ', ')
