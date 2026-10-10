// What Sam is listening to right now, for the corner widget. Two sources:
// - Last.fm (free): LASTFM_API_KEY and LASTFM_USERNAME. Spotify, YouTube Music (via a
//   scrobbler extension) and others report plays to Last.fm. Used when both are set.
// - Spotify: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET and SPOTIFY_REFRESH_TOKEN (see
//   scripts/get-spotify-token.mjs). Spotify's API needs the app owner to have Premium.
// With neither it answers { configured: false } and the widget stays hidden.
export const dynamic = 'force-dynamic'

const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token'
const NOW_PLAYING_ENDPOINT = 'https://api.spotify.com/v1/me/player/currently-playing'

type SpotifyTrack = {
  name?: string
  artists?: { name: string }[]
  album?: { name?: string; images?: { url: string }[] }
  external_urls?: { spotify?: string }
}

export type NowPlaying = {
  configured: boolean
  isPlaying: boolean
  title?: string
  artist?: string
  album?: string
  albumImageUrl?: string | null
  songUrl?: string
}

const mapTrack = (item: SpotifyTrack, isPlaying: boolean): NowPlaying => ({
  configured: true,
  isPlaying,
  title: item.name ?? '',
  artist: (item.artists ?? []).map((a) => a.name).join(', '),
  album: item.album?.name ?? '',
  albumImageUrl: item.album?.images?.[0]?.url ?? null,
  songUrl: item.external_urls?.spotify ?? '',
})

// Spotify only gives user-context access tokens via the refresh-token flow, so swap the
// long-lived refresh token for a short-lived access token, reused until just before it expires.
let cachedToken: { value: string; expiresAt: number } | null = null

async function getAccessToken(id: string, secret: string, refresh: string) {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refresh }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('Failed to refresh Spotify access token')
  const { access_token, expires_in } = (await res.json()) as { access_token: string; expires_in?: number }
  cachedToken = { value: access_token, expiresAt: Date.now() + ((expires_in ?? 3600) - 60) * 1000 }
  return access_token
}

const LASTFM_ENDPOINT = 'https://ws.audioscrobbler.com/2.0/'
// Last.fm's grey star stands in when it has no cover art; better to show none.
const LASTFM_PLACEHOLDER = '2a96cbd8b46e442fc41c2b86b821562f'

type LastfmTrack = {
  name?: string
  url?: string
  artist?: { '#text'?: string }
  album?: { '#text'?: string }
  image?: { '#text': string; size: string }[]
  '@attr'?: { nowplaying?: string }
}

// Last.fm marks the track being scrobbled right now with @attr.nowplaying.
async function lastfmNowPlaying(apiKey: string, user: string): Promise<NowPlaying> {
  const params = new URLSearchParams({ method: 'user.getrecenttracks', user, api_key: apiKey, format: 'json', limit: '1' })
  const res = await fetch(`${LASTFM_ENDPOINT}?${params}`, { cache: 'no-store' })
  if (!res.ok) return { configured: true, isPlaying: false }
  const recent = (await res.json())?.recenttracks?.track
  const item: LastfmTrack | undefined = Array.isArray(recent) ? recent[0] : recent
  if (!item || item['@attr']?.nowplaying !== 'true') return { configured: true, isPlaying: false }
  const image = item.image?.findLast((i) => i['#text'])?.['#text'] ?? ''
  return {
    configured: true,
    isPlaying: true,
    title: item.name ?? '',
    artist: item.artist?.['#text'] ?? '',
    album: item.album?.['#text'] ?? '',
    albumImageUrl: image && !image.includes(LASTFM_PLACEHOLDER) ? image : null,
    songUrl: item.url ?? '',
  }
}

export async function GET() {
  const { LASTFM_API_KEY: lastfmKey, LASTFM_USERNAME: lastfmUser } = process.env
  if (lastfmKey && lastfmUser) {
    try {
      return Response.json(await lastfmNowPlaying(lastfmKey, lastfmUser))
    } catch {
      return Response.json({ configured: true, isPlaying: false } satisfies NowPlaying)
    }
  }

  const { SPOTIFY_CLIENT_ID: id, SPOTIFY_CLIENT_SECRET: secret, SPOTIFY_REFRESH_TOKEN: refresh } = process.env
  if (!id || !secret || !refresh) return Response.json({ configured: false, isPlaying: false } satisfies NowPlaying)

  try {
    const token = await getAccessToken(id, secret, refresh)
    const headers = { Authorization: `Bearer ${token}` }

    const now = await fetch(NOW_PLAYING_ENDPOINT, { headers, cache: 'no-store' })
    if (now.status === 200) {
      const data = await now.json()
      if (data?.item) return Response.json(mapTrack(data.item, Boolean(data.is_playing)))
    }

    // 204 (nothing playing), an ad or a private session: the widget stays hidden.
    if (now.status === 401) cachedToken = null
    return Response.json({ configured: true, isPlaying: false } satisfies NowPlaying)
  } catch {
    return Response.json({ configured: true, isPlaying: false } satisfies NowPlaying)
  }
}
