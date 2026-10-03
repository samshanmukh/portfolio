'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef, type RefObject } from 'react'

// Launch "attention" effects around the send button while it pops in and the ask box grows out of it.
// Takes to compare on localhost via ?launch=…; each fades out as the box settles.
export const LAUNCHES = ['fluid', 'fluid-trail', 'spotlight', 'spot-tight', 'aurora', 'liquid', 'charge'] as const
export type Launch = (typeof LAUNCHES)[number]

type Phase = 'measure' | 'arrow' | 'expand' | 'settle' | 'done'
type Intro = { clip: string; ax: number; ay: number; size: number }

const EASE = [0.65, 0, 0.35, 1] as const
const OPEN = 'inset(0px 0px 0px 0px round 999px)'
const HIDDEN = 'inset(50% 0px 50% 100% round 999px)'
const STREAKS = Array.from({ length: 18 }, (_, i) => ({ angle: (360 / 18) * i + (i % 2) * 7, delay: (i * 7) % 18 / 60 }))
const DROPS = [
  { at: 0.3, size: 26, y: -2, delay: 0 },
  { at: 0.55, size: 20, y: 3, delay: 0.06 },
  { at: 0.78, size: 15, y: -3, delay: 0.12 },
  { at: 0.97, size: 11, y: 1, delay: 0.18 },
]

// the background's liquid cursor colours, run on a tiny canvas that follows a path instead of the mouse
function useFluid(canvas: RefObject<HTMLCanvasElement | null>, path: (t: number, el: HTMLCanvasElement) => { x: number; y: number } | null, opts: object) {
  useEffect(() => {
    let stop: (() => void) | undefined
    let cancelled = false
    import('../lib/fluid-cursor').then(({ default: start }) => {
      const el = canvas.current
      if (!cancelled && el) stop = start(el, { ...opts, path: (t: number) => path(t, el) })
    })
    return () => {
      cancelled = true
      stop?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

// fluid: the liquid swirls around inside the round button while it pops in and slides
export function LaunchFluid({ phase }: { phase: Phase }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useFluid(
    ref,
    (t, el) => {
      const w = el.clientWidth
      const h = el.clientHeight
      return { x: w / 2 + w * 0.3 * Math.sin(t * 6.1), y: h / 2 + h * 0.3 * Math.sin(t * 8.3 + 1.2) }
    },
    { sim: 32, dye: 128, radius: 1.6, force: 2500, fade: 0.8, brightness: 0.35 },
  )
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

// fluid-trail (rendered at page level, under the ask box): the button leaves a small liquid trail behind it, like the cursor does on the page
export function FluidTrail({ phase, anchor }: { phase: Phase; anchor: RefObject<HTMLElement | null> }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useFluid(
    ref,
    (t) => {
      const r = anchor.current?.getBoundingClientRect()
      if (!r) return null
      const wobble = Math.max(0, 1 - t / 1.4) * 14 // a little swirl while it pops in, then it just follows
      return { x: r.left + r.width / 2 + wobble * Math.cos(t * 9), y: r.top + r.height / 2 + wobble * Math.sin(t * 9) }
    },
    { sim: 64, dye: 512, radius: 0.03, force: 4000, fade: 0.9, brightness: 0.3 },
  )
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[5]"
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === 'arrow' || phase === 'expand' ? 1 : 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <canvas ref={ref} className="h-screen w-screen" />
    </motion.div>
  )
}

export function LaunchFx({
  launch,
  phase,
  intro,
  expandMs,
}: {
  launch: Launch
  phase: Phase
  intro: Intro
  expandMs: number
}) {
  if (phase === 'done' || phase === 'measure' || launch === 'fluid' || launch === 'fluid-trail') return null
  const launching = phase === 'arrow' || phase === 'expand'
  // a layer that follows the box's own button-to-pill reveal (the same clip on a slightly larger box)
  const clip = {
    initial: { clipPath: HIDDEN },
    animate: { clipPath: phase === 'arrow' ? intro.clip : OPEN },
    transition: phase === 'expand' ? { duration: expandMs / 1000, ease: EASE } : { duration: 0 },
  }
  const fade = {
    initial: { opacity: 0 },
    animate: { opacity: launching ? 1 : 0 },
    transition: { duration: launching ? 0.35 : 0.8, ease: 'easeOut' as const },
  }

  if (launch === 'spotlight' || launch === 'spot-tight') {
    // a small pool of light on the button with a soft dim ring around it; it grows only a little as the box opens
    const [start, end] = launch === 'spotlight' ? [44, 80] : [32, 52]
    const glow = document.documentElement.classList.contains('dark') ? 0.3 : 0.12
    const pool = (r: number) =>
      `radial-gradient(circle at center, rgba(255,255,255,${glow}) 0px, rgba(255,255,255,0) ${r}px, rgba(0,0,0,0) ${r}px, rgba(0,0,0,0.26) ${Math.round(r * 1.8)}px, rgba(0,0,0,0) ${Math.round(r * 3.2)}px)`
    return (
      <motion.span
        aria-hidden
        className="pointer-events-none absolute h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2"
        style={{ left: intro.ax, top: intro.ay }}
        initial={{ opacity: 0, background: pool(start) }}
        animate={{ opacity: launching ? 1 : 0, background: pool(phase === 'arrow' ? start : end) }}
        transition={{
          opacity: { duration: launching ? 0.4 : 0.6, ease: 'easeOut' },
          background: { duration: expandMs / 1000, ease: EASE },
        }}
      />
    )
  }

  if (launch === 'aurora') {
    // an Apple Intelligence style glow: colours flow around the button, then pour along the box as it opens
    return (
      <motion.div aria-hidden className="pointer-events-none absolute -inset-3 blur-lg" {...fade}>
        <motion.div className="absolute inset-0 overflow-hidden" {...clip}>
          <motion.span
            className="launch-aurora absolute"
            style={{ left: intro.ax + 12, top: intro.ay + 12 }}
            animate={{ opacity: phase === 'arrow' ? 1 : 0 }}
            transition={{ duration: 0.7 }}
          />
          <motion.span
            className="launch-aurora-flow absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 'arrow' ? 0 : 1 }}
            transition={{ duration: 0.7 }}
          />
        </motion.div>
      </motion.div>
    )
  }

  if (launch === 'liquid') {
    // liquid metal: the button wobbles like a drop, then the box pours out of it with droplets running ahead
    return (
      <motion.div aria-hidden className="pointer-events-none absolute -inset-6" style={{ filter: 'url(#launch-goo)' }} {...fade}>
        <svg width="0" height="0" className="absolute">
          <filter id="launch-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b" />
            <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -11" />
          </filter>
        </svg>
        <motion.div className="launch-metal absolute inset-5" {...clip} />
        {[-50, 70, 190].map((deg, i) => (
          <motion.span
            key={deg}
            className="launch-metal absolute rounded-full"
            style={{ left: intro.ax + 24 - 9, top: intro.ay + 24 - 9, width: 18, height: 18 }}
            initial={{ x: 0, y: 0 }}
            animate={
              phase === 'arrow'
                ? { x: [0, Math.cos((deg * Math.PI) / 180) * 26, 0], y: [0, Math.sin((deg * Math.PI) / 180) * 26, 0] }
                : { x: 0, y: 0 }
            }
            transition={{ duration: 0.7, delay: 0.1 + i * 0.08, ease: 'easeInOut' }}
          />
        ))}
        {DROPS.map((d) => (
          <motion.span
            key={d.at}
            className="launch-metal absolute rounded-full"
            style={{ left: intro.ax + 24 - d.size / 2, top: intro.ay + 24 - d.size / 2, width: d.size, height: d.size }}
            initial={{ x: 0, y: 0 }}
            animate={phase === 'arrow' ? { x: 0, y: 0 } : { x: -(intro.ax - 20) * d.at, y: d.y }}
            transition={{ duration: (expandMs / 1000) * 0.85, delay: d.delay, ease: [0.3, 0.7, 0.4, 1] }}
          />
        ))}
      </motion.div>
    )
  }

  // charge: streaks of light rush into the button, it flashes, and a shockwave rolls out
  return (
    <motion.div aria-hidden className="pointer-events-none absolute inset-0" {...fade}>
      <span className="launch-bloom absolute rounded-full" style={{ left: intro.ax, top: intro.ay }} />
      {STREAKS.map((s) => (
        <span key={s.angle} className="absolute" style={{ left: intro.ax, top: intro.ay, transform: `rotate(${s.angle}deg)` }}>
          <span className="launch-streak absolute" style={{ animationDelay: `${s.delay}s` }} />
        </span>
      ))}
      <span
        className="launch-shock absolute rounded-full"
        style={{ left: intro.ax, top: intro.ay, width: intro.size, height: intro.size }}
      />
    </motion.div>
  )
}
