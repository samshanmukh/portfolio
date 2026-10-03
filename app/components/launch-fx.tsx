'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'

// Launch "attention" effect: the background's liquid cursor colours, run on a tiny canvas inside the
// round send button while it pops in and slides, then faded out so the settled button is plain glass.
// ?launch=fluid-slow plays it even slower, to compare on localhost.
export const LAUNCHES = ['fluid', 'fluid-slow'] as const
export type Launch = (typeof LAUNCHES)[number]

type Phase = 'measure' | 'arrow' | 'expand' | 'settle' | 'done'

export function LaunchFluid({ phase, launch }: { phase: Phase; launch: Launch }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const speed = launch === 'fluid-slow' ? 0.3 : 0.5
    let stop: (() => void) | undefined
    let cancelled = false
    import('../lib/fluid-cursor').then(({ default: start }) => {
      const el = ref.current
      if (cancelled || !el) return
      stop = start(el, {
        // the "cursor" loops around inside the button instead of following the mouse
        path: (t: number) => {
          const w = el.clientWidth
          const h = el.clientHeight
          return { x: w / 2 + w * 0.3 * Math.sin(t * 6.1 * speed), y: h / 2 + h * 0.3 * Math.sin(t * 8.3 * speed + 1.2) }
        },
        sim: 32,
        dye: 128,
        radius: 1.6,
        force: 2500 * speed,
        fade: 0.8 * speed,
        brightness: 0.35,
        colorSpeed: 10 * speed,
      })
    })
    return () => {
      cancelled = true
      stop?.()
    }
  }, [launch])

  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: phase === 'arrow' || phase === 'expand' ? 1 : 0 }}
      transition={{ duration: phase === 'arrow' ? 0.35 : 0.7, ease: 'easeOut' }}
    >
      <canvas ref={ref} className="h-full w-full" />
    </motion.span>
  )
}
