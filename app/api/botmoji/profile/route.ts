import { publicProfileMetadata } from '../../../lib/botmoji-profile'
import { inferBotmojiRole, normalizeProfileUrl, type BotmojiProfile } from '../../../lib/botmoji'

export const maxDuration = 20
const MAX_BYTES = 750_000
const hits = new Map<string, { at: number; count: number }>()

async function readLimited(response: Response) {
  if (!response.ok || !response.body) throw new Error('unavailable')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let bytes = 0
  let text = ''
  try {
    for (;;) {
      const next = await reader.read()
      if (next.done) break
      bytes += next.value.byteLength
      if (bytes > MAX_BYTES) throw new Error('too-large')
      text += decoder.decode(next.value, { stream: true })
    }
    return text + decoder.decode()
  } finally { await reader.cancel().catch(() => {}) }
}

export async function POST(request: Request) {
  if (Number(request.headers.get('content-length')) > 16_000) return Response.json({ error: 'Please keep the profile text under 4,000 characters.' }, { status: 413 })
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  const now = Date.now()
  const recent = hits.get(ip)
  if (recent && now - recent.at < 600_000 && recent.count >= 20) return Response.json({ error: 'A few too many requests. Please try again in a little while.' }, { status: 429 })
  if (hits.size > 5000) hits.clear()
  hits.set(ip, recent && now - recent.at < 600_000 ? { ...recent, count: recent.count + 1 } : { at: now, count: 1 })
  let body: Record<string, unknown>
  try {
    const raw = await request.text()
    if (raw.length > 16_000) return Response.json({ error: 'Profile text is too long.' }, { status: 413 })
    body = JSON.parse(raw)
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('invalid')
  } catch { return Response.json({ error: 'Please send a profile URL or headline.' }, { status: 400 }) }
  const rawUrl = typeof body.url === 'string' ? body.url.trim() : ''
  const text = typeof body.text === 'string' ? body.text.trim().slice(0, 4000) : ''
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 70) : ''
  const link = rawUrl ? normalizeProfileUrl(rawUrl) : null
  if (rawUrl && !link) return Response.json({ error: 'Use a LinkedIn /in/ profile URL or a GitHub profile URL.' }, { status: 400 })
  if (text.length >= 3) {
    const profile: BotmojiProfile = { name: name || 'Your', headline: text, role: inferBotmojiRole(text), source: 'pasted', profileUrl: link?.url }
    return Response.json({ profile }, { headers: { 'Cache-Control': 'no-store' } })
  }
  if (!link) return Response.json({ error: 'Share a profile URL, or paste your headline and a little about your work.' }, { status: 400 })
  try {
    // Fixed allowlisted hosts only; redirects are deliberately refused. No arbitrary
    // visitor-supplied URL is ever fetched, including LinkedIn tracking redirects.
    const endpoint = link.source === 'github' ? `https://api.github.com/users/${link.slug}` : link.url
    const response = await fetch(endpoint, {
      headers: {
        Accept: link.source === 'github' ? 'application/vnd.github+json' : 'text/html',
        'User-Agent': 'PortfolioBotmoji/1.0',
        ...(link.source === 'github' && process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
      },
      signal: AbortSignal.timeout(10_000), redirect: 'error', cache: 'no-store',
    })
    const raw = await readLimited(response)
    const data = link.source === 'github' ? JSON.parse(raw) : null
    const details = data ? (data.type === 'User' && data.bio ? { name: data.name || data.login, headline: data.bio } : null) : publicProfileMetadata(raw)
    if (details) {
      const profile: BotmojiProfile = { name: String(details.name).slice(0, 70), headline: String(details.headline).slice(0, 4000), role: inferBotmojiRole(String(details.headline)), source: link.source, profileUrl: link.url }
      return Response.json({ profile }, { headers: { 'Cache-Control': 'no-store' } })
    }
  } catch { /* Private pages and login walls use the explicit paste fallback. */ }
  return Response.json({ needsText: true, message: link.source === 'linkedin' ? 'Your LinkedIn link is valid, but the profile could not be read. LinkedIn may block automated access even when a profile is public. Enter your name and headline or bio above to continue.' : 'Your GitHub link is valid, but public profile details could not be read. Enter your name and headline or bio above to continue.' }, { headers: { 'Cache-Control': 'no-store' } })
}
