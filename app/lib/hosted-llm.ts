// ---------------------------------------------------------------------------
// Client side of smart mode's hosted brain (Mistral or Groq, via /api/chat). Keys never reach
// the browser; the route answers as Sam from everything on the site.
// ---------------------------------------------------------------------------
import { cleanReply } from './clean-reply'

export type ChatMsg = { role: 'user' | 'assistant'; content: string }

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
// `view`: the card already shown above the reply, so the model doesn't repeat it
export async function hostedStream(
  messages: ChatMsg[],
  onToken: (full: string) => void,
  view?: string
): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, view }),
  })
  if (!res.ok || !res.body) throw new Error(`chat-${res.status}`)
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let full = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    full += decoder.decode(value, { stream: true })
    onToken(cleanReply(full))
  }
  if (!full.trim()) throw new Error('chat-empty')
  return cleanReply(full)
}
