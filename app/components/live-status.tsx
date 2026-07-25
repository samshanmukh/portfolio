'use client'

import { useEffect, useState } from 'react'

// Ambient "I'm a live system" telemetry: where I am + local time, my latest
// GitHub push, and what I'm listening to. Time + music update client-side;
// the last push is passed in from the server (already fetched for the repo grid).
export function LiveStatus({
  lastPush,
}: {
  lastPush?: { name: string; url: string; ago: string }
}) {
  const [clock, setClock] = useState<string | null>(null)
  const [track, setTrack] = useState<{
    isPlaying: boolean
    title?: string
    artist?: string
  }>({ isPlaying: false })

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const time = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles',
        hour: 'numeric',
        minute: '2-digit',
      }).format(now)
      const hour = Number(
        new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/Los_Angeles',
          hour: 'numeric',
          hour12: false,
        }).format(now)
      )
      const glyph = hour >= 6 && hour < 18 ? '☀' : '☾'
      setClock(`${time} ${glyph}`)
    }
    tick()
    const id = setInterval(tick, 30000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const res = await fetch('/api/now-playing')
        if (!res.ok) return
        const data = await res.json()
        if (active) setTrack(data)
      } catch {
        /* keep last state */
      }
    }
    load()
    const id = setInterval(load, 30000)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [])

  const tiles: {
    label: string
    value: string
    href?: string
    live?: boolean
  }[] = [
    {
      label: 'Based in',
      value: clock ? `San Francisco · ${clock}` : 'San Francisco',
    },
    {
      label: 'Last push',
      value: lastPush ? `${lastPush.name} · ${lastPush.ago}` : '—',
      href: lastPush?.url,
    },
    {
      label: 'Listening',
      value: track.isPlaying ? `${track.title} — ${track.artist}` : 'not right now',
      live: track.isPlaying,
    },
  ]

  return (
    <div className="mb-8 grid gap-3 sm:grid-cols-3">
      {tiles.map((t) => {
        const body = (
          <>
            <div className="flex items-center gap-1.5">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  t.live ? 'animate-pulse bg-primary-2' : 'bg-primary/60'
                }`}
              />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                {t.label}
              </span>
            </div>
            <div className="mt-1.5 truncate text-sm text-foreground/90">
              {t.value}
            </div>
          </>
        )
        const cls =
          'rounded-xl border border-white/10 bg-surface p-4 transition-colors'
        return t.href ? (
          <a
            key={t.label}
            href={t.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`${cls} hover:border-primary/40`}
          >
            {body}
          </a>
        ) : (
          <div key={t.label} className={cls}>
            {body}
          </div>
        )
      })}
    </div>
  )
}
