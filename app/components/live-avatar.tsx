'use client'

import { useReducedMotion } from 'framer-motion'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import type { AvatarConfig, AvatarHandle, Mood } from './avatar3d/scene'

export type { AvatarConfig, Mood }

// Live 3D avatar. three.js loads lazily after hydration; until the first frame is drawn
// (or if WebGL isn't available) a fallback image stands in.
export function LiveAvatar({
  looking,
  keystrokes,
  mood = 'idle',
  config,
  fallback = '/memoji.png',
  alt,
  sizes,
  priority,
  onReady,
}: {
  looking: boolean
  keystrokes: number
  mood?: Mood
  config?: AvatarConfig
  fallback?: string | null
  alt: string
  sizes: string
  priority?: boolean
  onReady?: (h: AvatarHandle) => void
}) {
  const reduced = !!useReducedMotion()
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const handle = useRef<AvatarHandle | null>(null)
  const latest = useRef({ looking, mood, reduced, config, onReady })
  latest.current = { looking, mood, reduced, config, onReady }
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const cleanups: (() => void)[] = []
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    import('./avatar3d/scene')
      .then(({ createAvatar }) => {
        if (cancelled) return
        let h: AvatarHandle
        const { config: cfg, onReady: ready, ...state } = latest.current
        try {
          h = createAvatar(canvas, state, cfg)
        } catch (err) {
          console.warn('[avatar] WebGL unavailable, keeping the image', err)
          return
        }
        handle.current = h
        const size = () => h.resize(wrap.clientWidth, wrap.clientHeight)
        size()
        const ro = new ResizeObserver(size)
        ro.observe(wrap)

        // only animate while on screen and the tab is visible
        let onScreen = true
        const sync = () => h.setRunning(onScreen && document.visibilityState === 'visible')
        const io = new IntersectionObserver(([e]) => {
          onScreen = e.isIntersecting
          sync()
        })
        io.observe(wrap)
        document.addEventListener('visibilitychange', sync)

        requestAnimationFrame(() => !cancelled && setReady(true))
        ready?.(h)
        cleanups.push(() => {
          ro.disconnect()
          io.disconnect()
          document.removeEventListener('visibilitychange', sync)
          h.destroy()
          handle.current = null
        })
      })
      .catch((err) => console.warn('[avatar] failed to load 3D scene', err))

    return () => {
      cancelled = true
      cleanups.forEach((f) => f())
    }
  }, [])

  useEffect(() => {
    handle.current?.set({ looking, mood, reduced })
  }, [looking, mood, reduced])

  const configKey = config ? JSON.stringify(config) : ''
  useEffect(() => {
    if (config) handle.current?.setConfig(config)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey])

  useEffect(() => {
    if (keystrokes > 0) handle.current?.nod()
  }, [keystrokes])

  return (
    <div ref={wrapRef} role="img" aria-label={alt} className="relative h-full w-full">
      {fallback && (
        <Image
          src={fallback}
          alt=""
          aria-hidden
          fill
          sizes={sizes}
          priority={priority}
          className={`object-contain transition-opacity duration-500 ${ready ? 'opacity-0' : 'opacity-100'}`}
        />
      )}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${ready ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  )
}
