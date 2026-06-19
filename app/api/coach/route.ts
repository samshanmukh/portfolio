import { NextResponse } from 'next/server'

// Grok (xAI) coaching brain. The API key stays server-side (env var) and is
// never exposed to the browser. Falls back gracefully (client uses its built-in
// coach) if the key is missing or the call fails.

const SYSTEM = [
  'You are an energetic, supportive personal gym coach speaking OUT LOUD to someone mid-workout.',
  'Reply in 1–2 short, punchy, motivating sentences with practical cues (form, rest, effort, breathing, hydration).',
  'Be warm and hype but never cheesy. No markdown, no emojis, no lists — it is read aloud by a voice.',
  'If they mention sharp pain or injury, tell them to stop and check their form safely.',
].join(' ')

export async function POST(req: Request) {
  const key = process.env.XAI_API_KEY
  if (!key) return NextResponse.json({ reply: null, error: 'no-key' })

  let message = ''
  try {
    const body = await req.json()
    message = String(body?.message ?? '').slice(0, 500)
  } catch {
    return NextResponse.json({ reply: null, error: 'bad-request' })
  }
  if (!message) return NextResponse.json({ reply: null, error: 'empty' })

  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: process.env.XAI_MODEL || 'grok-4.20-0309-non-reasoning',
        max_tokens: 90,
        temperature: 0.85,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: message },
        ],
      }),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error('[coach] xAI error', res.status, detail)
      return NextResponse.json({ reply: null, error: `xai-${res.status}`, detail: detail.slice(0, 300) })
    }
    const data = await res.json()
    const reply = data?.choices?.[0]?.message?.content?.trim() || null
    return NextResponse.json({ reply })
  } catch {
    return NextResponse.json({ reply: null, error: 'fetch-failed' })
  }
}
