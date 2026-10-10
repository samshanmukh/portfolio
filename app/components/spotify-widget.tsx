'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Gamepad2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { NowPlaying } from '../api/spotify/now-playing/route'
import { GooeyDrag } from './gooey-drag'

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
// button. It only shows while Sam is playing something (music from Discord, Last.fm or
// Spotify, or a game / show from Discord) and shrinks away when it stops. Phones get the cover and equalizer; wider screens
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
  const music = playing?.kind !== 'activity'
  // "Listening to X by Y" for music; "Playing Valorant" (or Watching, Streaming) from Discord
  const label = playing
    ? music
      ? `Sam is listening to ${playing.title}${playing.artist ? ` by ${playing.artist}` : ''}`
      : `Sam is ${(playing.verb ?? 'Playing').toLowerCase()} ${playing.title}`
    : ''

  return (
    <AnimatePresence>
      {playing && (
        <motion.div
          key="now-playing"
          className={`min-w-0 ${className}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 320, damping: 24 }}
        >
          {/* draggable with the same liquid bend as the theme button and social icons */}
          <GooeyDrag radius={18}>
            <a
              href={playing.songUrl || undefined}
              target="_blank"
              rel="noopener noreferrer"
              draggable={false}
              aria-label={label}
              title={playing.artist ? `${label} · ${playing.artist}` : label}
              className="glass tap flex h-9 min-w-0 items-center gap-2 overflow-hidden rounded-full p-1 pr-3"
            >
              {playing.albumImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- remote cover art
                <img src={playing.albumImageUrl} alt="" draggable={false} className={`h-7 w-7 shrink-0 object-cover ${music ? 'record-spin rounded-full' : 'rounded-lg'}`} />
              ) : (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground/10" aria-hidden>
                  {!music && <Gamepad2 className="h-4 w-4 text-foreground/70" />}
                </span>
              )}
              {music ? <Equalizer /> : <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-foreground/60" aria-hidden />}
              <span className="hidden max-w-[160px] min-w-0 truncate text-xs leading-tight sm:block lg:max-w-[220px]">
                {!music && <span className="text-muted">{playing.verb ?? 'Playing'} </span>}
                <span className="font-semibold text-foreground">{playing.title}</span>
                {playing.artist && <span className="text-muted"> · {playing.artist}</span>}
              </span>
            </a>
          </GooeyDrag>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
