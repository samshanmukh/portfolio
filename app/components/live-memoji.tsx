'use client'

import { useReducedMotion } from 'framer-motion'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import type { MemojiHandle, Mood } from './memoji3d/scene'

export type { Mood }

// Live 3D Memoji. three.js loads lazily after hydration; until the first frame is
// drawn (or if WebGL isn't available) the flat Memoji image stands in.
export function LiveMemoji({
  looking,
  keystrokes,
  mood = 'idle',
  alt,
  sizes,
  priority,
}: {
  looking: boolean
  keystrokes: number
  mood?: Mood
  alt: string
  sizes: string
  priority?: boolean
}) {
  const reduced = !!useReducedMotion()
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const handle = useRef<MemojiHandle | null>(null)
  const latest = useRef({ looking, mood, reduced })
  latest.current = { looking, mood, reduced }
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const cleanups: (() => void)[] = []
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    import('./memoji3d/scene')
      .then(({ createMemoji }) => {
        if (cancelled) return
        let h: MemojiHandle
        try {
          h = createMemoji(canvas, latest.current)
        } catch (err) {
          console.warn('[memoji] WebGL unavailable, keeping the image', err)
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
        cleanups.push(() => {
          ro.disconnect()
          io.disconnect()
          document.removeEventListener('visibilitychange', sync)
          h.destroy()
          handle.current = null
        })
      })
      .catch((err) => console.warn('[memoji] failed to load 3D scene', err))

    return () => {
      cancelled = true
      cleanups.forEach((f) => f())
    }
  }, [])

  useEffect(() => {
    handle.current?.set({ looking, mood, reduced })
  }, [looking, mood, reduced])

  useEffect(() => {
    if (keystrokes > 0) handle.current?.nod()
  }, [keystrokes])

  return (
    <div ref={wrapRef} role="img" aria-label={alt} className="relative h-full w-full">
      <Image
        src="/memoji.png"
        alt=""
        aria-hidden
        fill
        sizes={sizes}
        priority={priority}
        className={`object-contain transition-opacity duration-500 ${ready ? 'opacity-0' : 'opacity-100'}`}
      />
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${ready ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  )
}
