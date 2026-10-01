'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { NowPlaying } from '../api/spotify/now-playing/route'

// Three-bar equalizer shown while a track is actually playing.
function Equalizer() {
  return (
    <span className="flex h-3 items-end gap-[2px]">
      {[0, 0.2, 0.4].map((delay) => (
        <motion.span
          key={delay}
          className="w-[2px] rounded-full bg-[#1DB954]"
          animate={{ height: ['20%', '100%', '20%'] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay }}
        />
      ))}
    </span>
  )
}

function SpotifyLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-[#1DB954]" aria-hidden>
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.52 17.34c-.24.36-.66.48-1.02.24-2.82-1.74-6.36-2.1-10.56-1.14-.42.12-.78-.18-.9-.54-.12-.42.18-.78.54-.9 4.56-1.02 8.52-.6 11.64 1.32.42.18.48.66.3 1.02zm1.44-3.3c-.3.42-.84.6-1.26.3-3.24-1.98-8.16-2.58-11.94-1.38-.48.12-1.02-.12-1.14-.6-.12-.48.12-1.02.6-1.14 4.38-1.32 9.78-.66 13.5 1.62.36.18.54.78.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.1 9.3c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.32-1.32 11.4-1.02 15.9 1.62.54.3.72 1.02.42 1.56-.3.42-1.02.66-1.56.36z" />
    </svg>
  )
}

// Spinning album cover in a corner showing what Sam is listening to; hover (or focus)
// slides out the track name. Hidden until Spotify is configured and returns a track.
export function SpotifyWidget({ className = 'bottom-4 right-4' }: { className?: string }) {
  const [track, setTrack] = useState<NowPlaying | null>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    let active = true
    let interval: ReturnType<typeof setInterval> | undefined
    const load = async () => {
      try {
        const data: NowPlaying = await (await fetch('/api/spotify/now-playing')).json()
        if (!active) return
        setTrack(data)
        if (!data.configured) clearInterval(interval) // nothing to poll for
      } catch {
        // keep the last known state on transient errors
      }
    }
    load()
    interval = setInterval(load, 30_000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  if (!track?.albumImageUrl) return null
  const spinning = track.isPlaying && !reduced

  return (
    <motion.a
      href={track.songUrl || 'https://open.spotify.com'}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${track.isPlaying ? 'Listening to' : 'Last played'} ${track.title} by ${track.artist} on Spotify`}
      title={`${track.isPlaying ? 'Listening to' : 'Last played'}: ${track.title} · ${track.artist}`}
      className={`group fixed z-50 flex items-center overflow-hidden rounded-full border border-black/5 bg-white/90 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-neutral-900/90 ${className}`}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      whileHover={{ x: -8 }}
    >
      <div className="flex max-w-0 min-w-0 items-center gap-2 overflow-hidden opacity-0 transition-[max-width,opacity,padding] duration-300 ease-out group-hover:max-w-[200px] group-hover:pl-3 group-hover:opacity-100 group-focus-visible:max-w-[200px] group-focus-visible:pl-3 group-focus-visible:opacity-100">
        <span className="shrink-0">{track.isPlaying ? <Equalizer /> : <SpotifyLogo />}</span>
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-xs font-semibold">{track.title}</span>
          <span className="truncate text-[11px] text-muted">{track.artist}</span>
        </span>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- remote Spotify CDN art */}
      <motion.img
        src={track.albumImageUrl}
        alt={track.album || track.title || 'Album cover'}
        className="h-12 w-12 shrink-0 rounded-full object-cover md:h-14 md:w-14"
        animate={spinning ? { rotate: 360 } : { rotate: 0 }}
        transition={spinning ? { duration: 8, repeat: Infinity, ease: 'linear' } : { duration: 0.3 }}
      />
    </motion.a>
  )
}
