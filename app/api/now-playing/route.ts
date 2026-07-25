// What Sam is listening to RIGHT NOW, via Last.fm (works with a free Spotify
// account — connect Spotify → Last.fm for scrobbling). Last.fm flags the live
// track with @attr.nowplaying; we only report that one. Unconfigured or nothing
// playing → { isPlaying: false }, so the widget stays hidden.

export const dynamic = 'force-dynamic' // never cache — playback changes constantly

const API = 'https://ws.audioscrobbler.com/2.0/'

type NowPlaying = {
  isPlaying: boolean
  title?: string
  artist?: string
  albumImageUrl?: string
  songUrl?: string
}

const NOT_PLAYING: NowPlaying = { isPlaying: false }

// Last.fm's default "no image" placeholder (a grey star) — treat as missing.
const LASTFM_PLACEHOLDER = '2a96cbd8b46e442fc41c2b86b821562f'

// Last.fm usually omits cover art for Spotify scrobbles, so fall back to the
// free iTunes Search API (no key). Cached a day per query since art is stable.
async function itunesArtwork(artist?: string, title?: string) {
  if (!artist || !title) return undefined
  try {
    const term = encodeURIComponent(`${artist} ${title}`)
    const res = await fetch(
      `https://itunes.apple.com/search?media=music&entity=song&limit=1&term=${term}`,
      { next: { revalidate: 86400 } }
    )
    if (!res.ok) return undefined
    const data = await res.json()
    const art: string | undefined = data?.results?.[0]?.artworkUrl100
    return art ? art.replace('100x100bb', '300x300bb') : undefined
  } catch {
    return undefined
  }
}

export async function GET() {
  const key = process.env.LASTFM_API_KEY
  const user = process.env.LASTFM_USERNAME
  // Not wired up yet → widget hides itself.
  if (!key || !user) return Response.json(NOT_PLAYING)

  try {
    const url =
      `${API}?method=user.getrecenttracks&limit=1&format=json` +
      `&user=${encodeURIComponent(user)}&api_key=${encodeURIComponent(key)}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return Response.json(NOT_PLAYING)

    const data = await res.json()
    const track = data?.recenttracks?.track?.[0]
    // nowplaying flag is only present while a track is actively playing
    if (!track || track['@attr']?.nowplaying !== 'true') {
      return Response.json(NOT_PLAYING)
    }

    const title: string = track.name
    const artist: string = track.artist?.['#text'] ?? track.artist?.name

    const images: { '#text': string }[] = track.image ?? []
    let albumImageUrl = images[images.length - 1]?.['#text'] || undefined
    if (!albumImageUrl || albumImageUrl.includes(LASTFM_PLACEHOLDER)) {
      albumImageUrl = await itunesArtwork(artist, title)
    }

    const payload: NowPlaying = {
      isPlaying: true,
      title,
      artist,
      albumImageUrl,
      songUrl: track.url,
    }
    return Response.json(payload)
  } catch {
    return Response.json(NOT_PLAYING)
  }
}
