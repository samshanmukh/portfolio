'use client'

import { useEffect, useState } from 'react'

type Track = {
  isPlaying: boolean
  title?: string
  artist?: string
  albumImageUrl?: string
  songUrl?: string
}

// A small sticky that appears in the bottom-right ONLY while Sam is actively
// listening (Spotify scrobbled via Last.fm). Polls the server route every 30s
// (and whenever the tab regains focus). Hidden when nothing's playing/dismissed.
export function NowPlaying() {
  const [track, setTrack] = useState<Track>({ isPlaying: false })
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const res = await fetch('/api/now-playing')
        if (!res.ok) return
        const data = (await res.json()) as Track
        if (active) setTrack(data)
      } catch {
        /* offline / route down — just keep it hidden */
      }
    }
    load()
    const id = setInterval(load, 30000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') load()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      active = false
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  if (!track.isPlaying || dismissed) return null

  const card =
    'flex items-center gap-3 rounded-xl border border-white/10 bg-surface/90 p-2.5 shadow-2xl shadow-black/40 backdrop-blur-md transition-colors hover:border-primary/40'

  const inner = (
    <>
      {track.albumImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={track.albumImageUrl}
          alt=""
          width={44}
          height={44}
          className="h-11 w-11 shrink-0 rounded-md object-cover"
        />
      )}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <Equalizer />
          <span className="font-mono text-[10px] uppercase tracking-wider text-primary">
            now playing
          </span>
        </div>
        <div className="truncate text-sm font-medium text-foreground">
          {track.title}
        </div>
        <div className="truncate text-xs text-muted">{track.artist}</div>
      </div>
    </>
  )

  return (
    <div className="now-playing fixed bottom-4 right-4 z-40 w-[15rem] max-w-[calc(100vw-2rem)]">
      {track.songUrl ? (
        <a
          href={track.songUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={card}
          title={`${track.title} — ${track.artist} (open in Spotify)`}
        >
          {inner}
        </a>
      ) : (
        <div className={card}>{inner}</div>
      )}
      <button
        onClick={() => setDismissed(true)}
        aria-label="Hide now playing"
        className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-surface text-muted shadow-md transition-colors hover:text-foreground"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  )
}

function Equalizer() {
  return (
    <span className="flex h-3 items-end gap-[2px]" aria-hidden>
      <span className="eq-bar h-full w-[2px] rounded-full bg-primary" />
      <span className="eq-bar h-full w-[2px] rounded-full bg-primary [animation-delay:0.18s]" />
      <span className="eq-bar h-full w-[2px] rounded-full bg-primary [animation-delay:0.36s]" />
    </span>
  )
}
