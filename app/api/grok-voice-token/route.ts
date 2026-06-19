// Mints a short-lived ephemeral token so the BROWSER can open a WebSocket to
// xAI Realtime without ever seeing the API key. Key stays server-side.
// Spec: POST /v1/realtime/client_secrets → { value, expires_at }

export async function POST() {
  const apiKey = process.env.XAI_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'XAI_API_KEY is not configured' }, { status: 500 })
  }
  try {
    const res = await fetch('https://api.x.ai/v1/realtime/client_secrets', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ expires_after: { seconds: 600 } }),
    })
    const data = await res.json()
    if (!res.ok || !data?.value) {
      return Response.json({ error: 'Failed to mint token', detail: data }, { status: res.status || 500 })
    }
    return Response.json({ token: data.value, expiresAt: data.expires_at })
  } catch {
    return Response.json({ error: 'Network error contacting xAI' }, { status: 500 })
  }
}
