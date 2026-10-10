'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { NowPlaying } from '../api/spotify/now-playing/route'

const POLL_MS = 15_000

// Three-bar equalizer, neutral like the rest of the glass controls.
function Equalizer({ still }: { still: boolean }) {
  return (
    <span className="flex h-3 items-end gap-[2px]" aria-hidden>
      {[0, 0.2, 0.4].map((delay) => (
        <motion.span
          key={delay}
          className="w-[2px] rounded-full bg-foreground/70"
          style={{ height: still ? '60%' : undefined }}
          animate={still ? undefined : { height: ['25%', '100%', '25%'] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay }}
        />
      ))}
    </span>
  )
}

// Frosted-glass "now playing" card in the bottom-right corner. It only shows while a
// track is actually playing (Spotify or Last.fm) and slides away when playback stops.
export function SpotifyWidget({ className = 'bottom-4 right-4' }: { className?: string }) {
  const [track, setTrack] = useState<NowPlaying | null>(null)
  const reduced = useReducedMotion() ?? false

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
          href={playing.songUrl || 'https://open.spotify.com'}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Sam is listening to ${playing.title} by ${playing.artist}`}
          title={`${playing.title} · ${playing.artist}`}
          className={`glass fixed z-50 flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-2xl p-2 pr-3 sm:pr-4 ${className}`}
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          whileHover={reduced ? undefined : { y: -2 }}
        >
          {playing.albumImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- remote Spotify CDN art
            <img
              src={playing.albumImageUrl}
              alt=""
              className="h-10 w-10 shrink-0 rounded-lg object-cover sm:h-12 sm:w-12"
            />
          )}
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="flex items-center gap-1.5 text-[10px] font-medium tracking-wide text-muted uppercase">
              <Equalizer still={reduced} />
              Now playing
            </span>
            <span className="mt-1 max-w-[150px] truncate text-xs font-semibold text-foreground sm:max-w-[200px] sm:text-sm">
              {playing.title}
            </span>
            <span className="max-w-[150px] truncate text-[11px] text-muted sm:max-w-[200px] sm:text-xs">
              {playing.artist}
            </span>
          </span>
        </motion.a>
      )}
    </AnimatePresence>
  )
}
