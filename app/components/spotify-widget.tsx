'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { NowPlaying } from '../api/spotify/now-playing/route'

const POLL_MS = 15_000

// Three-bar equalizer, neutral like the rest of the glass controls; bounces via .eq-bar.
function Equalizer() {
  return (
    <span className="flex h-3 items-end gap-[2px]" aria-hidden>
      {[0, 0.25, 0.5].map((delay) => (
        <span
          key={delay}
          className="eq-bar h-full w-[2px] rounded-full bg-foreground/70"
          style={{ animationDelay: `-${delay}s` }}
        />
      ))}
    </span>
  )
}

// Small frosted-glass "now playing" pill for the top-right corner, beside the theme
// button. It only shows while a track is actually playing (Spotify or Last.fm) and
// shrinks away when playback stops. Phones get the cover and equalizer; wider screens
// add the song and artist.
export function SpotifyWidget({ className = '' }: { className?: string }) {
  const [track, setTrack] = useState<NowPlaying | null>(null)

  useEffect(() => {
    let active = true
    let interval: ReturnType<typeof setInterval> | undefined
    const load = async () => {
      if (document.hidden) return // no need to poll a background tab
      try {
        const data: NowPlaying = await (await fetch('/api/spotify/now-playing', { cache: 'no-store' })).json()
        if (!active) return
        setTrack(data)
        if (!data.configured && interval) {
          clearInterval(interval) // nothing to poll for
          interval = undefined
        }
      } catch {
        // keep the last known state on transient errors
      }
    }
    interval = setInterval(load, POLL_MS)
    load()
    // refresh straight away when the visitor comes back to the tab
    const onVisible = () => !document.hidden && interval && load()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      active = false
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  const playing = track?.isPlaying && track.title ? track : null

  return (
    <AnimatePresence>
      {playing && (
        <motion.a
          key="now-playing"
          href={playing.songUrl || 'https://www.last.fm'}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Sam is listening to ${playing.title} by ${playing.artist}`}
          title={`Now playing: ${playing.title} · ${playing.artist}`}
          className={`glass tap flex h-9 min-w-0 items-center gap-2 overflow-hidden rounded-full p-1 pr-3 ${className}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 320, damping: 24 }}
        >
          {playing.albumImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote cover art
            <img src={playing.albumImageUrl} alt="" className="record-spin h-7 w-7 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="h-7 w-7 shrink-0 rounded-full bg-foreground/10" aria-hidden />
          )}
          <Equalizer />
          <span className="hidden max-w-[160px] min-w-0 truncate text-xs leading-tight sm:block lg:max-w-[220px]">
            <span className="font-semibold text-foreground">{playing.title}</span>
            <span className="text-muted"> · {playing.artist}</span>
          </span>
        </motion.a>
      )}
    </AnimatePresence>
  )
}
