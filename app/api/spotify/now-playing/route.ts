// What Sam is listening to on Spotify right now (or last played), for the corner widget.
// Needs SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET and SPOTIFY_REFRESH_TOKEN (see
// scripts/get-spotify-token.mjs). Without them it answers { configured: false } and the
// widget stays hidden.
export const dynamic = 'force-dynamic'

const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token'
const NOW_PLAYING_ENDPOINT = 'https://api.spotify.com/v1/me/player/currently-playing'
const RECENTLY_PLAYED_ENDPOINT = 'https://api.spotify.com/v1/me/player/recently-played?limit=1'

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
// long-lived refresh token for a short-lived access token on each request.
async function getAccessToken(id: string, secret: string, refresh: string) {
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
  return ((await res.json()) as { access_token: string }).access_token
}

export async function GET() {
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

    // 204 (nothing playing), an ad or a private session: fall back to the last track played.
    const recent = await fetch(RECENTLY_PLAYED_ENDPOINT, { headers, cache: 'no-store' })
    if (recent.status === 200) {
      const item = (await recent.json())?.items?.[0]?.track
      if (item) return Response.json(mapTrack(item, false))
    }
    return Response.json({ configured: true, isPlaying: false } satisfies NowPlaying)
  } catch {
    return Response.json({ configured: true, isPlaying: false } satisfies NowPlaying)
  }
}
