'use client'

import { useEffect, useRef } from 'react'

/**
 * Faint, dynamic zodiac constellations. Stars fade in, lines connect them into
 * a sign, it holds, fades out, and a new sign appears elsewhere. Plus a sparse
 * static starfield. Kept very subtle (low opacity) so it stays a backdrop.
 */

// Simplified connect-the-dots figures (normalized 0..1) + edges between points.
const SIGNS: { name: string; pts: [number, number][]; edges: [number, number][] }[] = [
  {
    name: 'aries',
    pts: [[0.05, 0.55], [0.35, 0.32], [0.65, 0.42], [0.95, 0.18]],
    edges: [[0, 1], [1, 2], [2, 3]],
  },
  {
    name: 'taurus',
    pts: [[0.5, 0.55], [0.34, 0.4], [0.08, 0.1], [0.66, 0.4], [0.92, 0.12], [0.5, 0.88]],
    edges: [[0, 1], [1, 2], [0, 3], [3, 4], [0, 5]],
  },
  {
    name: 'gemini',
    pts: [[0.22, 0.1], [0.2, 0.88], [0.78, 0.1], [0.8, 0.88]],
    edges: [[0, 1], [2, 3], [0, 2], [1, 3]],
  },
  {
    name: 'leo',
    pts: [[0.12, 0.28], [0.28, 0.12], [0.46, 0.2], [0.52, 0.4], [0.62, 0.64], [0.9, 0.72], [0.76, 0.44]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]],
  },
  {
    name: 'scorpio',
    pts: [[0.08, 0.2], [0.24, 0.32], [0.4, 0.46], [0.5, 0.62], [0.56, 0.78], [0.72, 0.84], [0.86, 0.74], [0.84, 0.58]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7]],
  },
  {
    name: 'sagittarius',
    pts: [[0.1, 0.74], [0.42, 0.52], [0.72, 0.3], [0.92, 0.14], [0.62, 0.2], [0.86, 0.46]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5]],
  },
  {
    name: 'libra',
    pts: [[0.5, 0.12], [0.5, 0.46], [0.2, 0.6], [0.8, 0.6], [0.18, 0.82], [0.82, 0.82]],
    edges: [[0, 1], [1, 2], [1, 3], [2, 4], [3, 5]],
  },
  {
    name: 'pisces',
    pts: [[0.08, 0.2], [0.34, 0.4], [0.5, 0.56], [0.7, 0.4], [0.92, 0.24], [0.5, 0.84]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5]],
  },
]

export function ZodiacStars() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let w = 0
    let h = 0
    let dpr = 1
    let field: { x: number; y: number; r: number; tw: number }[] = []

    const setup = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // sparse static starfield
      const n = Math.round((w * h) / 26000)
      field = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.1 + 0.3,
        tw: Math.random() * Math.PI * 2,
      }))
    }
    setup()

    // a placed constellation instance
    type Placed = { sign: (typeof SIGNS)[number]; cx: number; cy: number; scale: number }
    let idx = Math.floor(Math.random() * SIGNS.length)
    const place = (): Placed => {
      const sign = SIGNS[idx % SIGNS.length]
      idx++
      const scale = Math.min(w, h) * (0.26 + Math.random() * 0.12)
      const cx = w * (0.12 + Math.random() * 0.76) - scale / 2
      const cy = h * (0.1 + Math.random() * 0.62) - scale / 2
      return { sign, cx, cy, scale }
    }
    let cur = place()

    // lifecycle timing (ms)
    const FADE = 2600
    const HOLD = 5200
    const cycle = FADE + HOLD + FADE
    let start = 0

    const STAR = '244, 239, 230' // warm white
    const LINE = '185, 137, 90' // brown

    const draw = (t: number) => {
      raf = requestAnimationFrame(draw)
      if (t - lastFrame < 33) return // ~30fps
      lastFrame = t
      if (!start) start = t
      const elapsed = t - start
      // place a fresh sign at the start of each cycle
      const cycleIndex = Math.floor(elapsed / cycle)
      if (cycleIndex !== lastCycle) {
        lastCycle = cycleIndex
        cur = place()
      }
      const p = elapsed % cycle

      // constellation alpha (fade in / hold / fade out)
      let a: number
      if (p < FADE) a = p / FADE
      else if (p < FADE + HOLD) a = 1
      else a = 1 - (p - FADE - HOLD) / FADE

      ctx.clearRect(0, 0, w, h)

      // static starfield with gentle twinkle
      for (const s of field) {
        const tw = 0.5 + 0.5 * Math.sin(t / 900 + s.tw)
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${STAR}, ${0.12 + 0.12 * tw})`
        ctx.fill()
      }

      // current constellation
      const { sign, cx, cy, scale } = cur
      const P = sign.pts.map(([px, py]) => [cx + px * scale, cy + py * scale] as const)

      ctx.lineWidth = 1
      ctx.strokeStyle = `rgba(${LINE}, ${0.26 * a})`
      for (const [i, j] of sign.edges) {
        ctx.beginPath()
        ctx.moveTo(P[i][0], P[i][1])
        ctx.lineTo(P[j][0], P[j][1])
        ctx.stroke()
      }
      for (let i = 0; i < P.length; i++) {
        const tw = 0.6 + 0.4 * Math.sin(t / 600 + i)
        ctx.beginPath()
        ctx.arc(P[i][0], P[i][1], 1.6, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${STAR}, ${0.85 * a * tw})`
        ctx.fill()
        // soft glow
        ctx.beginPath()
        ctx.arc(P[i][0], P[i][1], 3.4, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${STAR}, ${0.12 * a})`
        ctx.fill()
      }
    }

    let raf = 0
    let lastFrame = 0
    let lastCycle = 0

    if (reduce) {
      // static single faint frame
      ctx.clearRect(0, 0, w, h)
      const { sign, cx, cy, scale } = cur
      const P = sign.pts.map(([px, py]) => [cx + px * scale, cy + py * scale] as const)
      ctx.strokeStyle = `rgba(${LINE}, 0.2)`
      for (const [i, j] of sign.edges) {
        ctx.beginPath()
        ctx.moveTo(P[i][0], P[i][1])
        ctx.lineTo(P[j][0], P[j][1])
        ctx.stroke()
      }
    } else {
      raf = requestAnimationFrame(draw)
    }

    const onResize = () => setup()
    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf)
      else if (!reduce) raf = requestAnimationFrame(draw)
    }
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  return <canvas ref={ref} aria-hidden className="zodiac-canvas" />
}
