'use client'

import { useRef, useState } from 'react'

/**
 * Terminal-style soundtrack toggle (fixed, bottom-right).
 * Expects an audio file at /public/theme.mp3 — drop in a track you have the
 * rights to. Browsers block autoplay, so playback starts on click.
 */
export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [missing, setMissing] = useState(false)

  const toggle = async () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
      return
    }
    try {
      await audio.play()
      setPlaying(true)
    } catch {
      setMissing(true)
    }
  }

  const label = missing
    ? 'no theme.mp3 found'
    : playing
      ? 'now playing: theme.mp3'
      : 'play_soundtrack.sh'

  return (
    <>
      <audio
        ref={audioRef}
        src="/theme.mp3"
        loop
        preload="none"
        onError={() => setMissing(true)}
      />
      <button
        onClick={toggle}
        disabled={missing}
        aria-label="Toggle soundtrack"
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-md border border-white/15 bg-surface/80 px-3 py-2 text-xs text-foreground backdrop-blur transition-colors hover:border-white/30 disabled:cursor-not-allowed disabled:text-muted"
      >
        <span className="text-muted">$</span>
        {playing ? (
          <span aria-hidden className="flex h-3 w-3 items-end gap-[2px]">
            <span className="eq-bar" style={{ animationDelay: '0ms' }} />
            <span className="eq-bar" style={{ animationDelay: '150ms' }} />
            <span className="eq-bar" style={{ animationDelay: '300ms' }} />
          </span>
        ) : (
          <span aria-hidden>{missing ? '✕' : '▶'}</span>
        )}
        <span>{label}</span>
      </button>
    </>
  )
}
