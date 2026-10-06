// ---------------------------------------------------------------------------
// Client side of smart mode's Mistral brain (/api/chat). The key never reaches
// the browser; the route answers as Sam from everything on the site.
// ---------------------------------------------------------------------------
import type { ChatMsg } from './webllm'

export const MISTRAL_LABEL = 'mistral'

// true when the server has a Mistral key configured
export async function mistralAvailable(): Promise<boolean> {
  try {
    const res = await fetch('/api/chat', { cache: 'no-store' })
    return res.ok && (await res.json())?.enabled === true
  } catch {
    return false
  }
}

// Streams the reply via onToken(fullTextSoFar); throws on any error (rate limit,
// Mistral down, no key) so the caller can fall back to the instant answers.
export async function mistralStream(messages: ChatMsg[], onToken: (full: string) => void): Promise<string> {
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
    onToken(full)
  }
  if (!full.trim()) throw new Error('chat-empty')
  return full
}
