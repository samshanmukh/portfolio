'use client'

import { useEffect, useRef } from 'react'

// A calm landscape that quietly drifts through the day and the seasons while
// you linger. Starts at the visitor's real local time + season, then advances
// slowly. Everything is one cheap canvas — gradients, a sun/moon arc, stars,
// layered ridges, a sparse seasonal mote field, and a daytime bird flock
// (densest in the morning). Subtle by design.

const DAY_SECONDS = 210 // one full sunrise→night→sunrise
const YEAR_SECONDS = 720 // one full spring→winter→spring (season ≈ 3 min)

// ── small math helpers ──────────────────────────────────────────────
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
type RGB = [number, number, number]
const mixRGB = (a: RGB, b: RGB, t: number): RGB => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
]
const rgb = (c: RGB, alpha = 1) =>
  `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${alpha})`

// deterministic PRNG so the ridgeline + stars stay stable across resizes
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── sky keyframes through a day (top / mid / horizon), kept dark & calm ──
type SkyKey = { p: number; top: RGB; mid: RGB; hor: RGB }
const SKY: SkyKey[] = [
  { p: 0.0, top: [11, 15, 30], mid: [16, 20, 38], hor: [26, 27, 46] }, // deep night
  { p: 0.2, top: [22, 22, 46], mid: [42, 34, 54], hor: [82, 56, 74] }, // pre-dawn
  { p: 0.27, top: [42, 48, 74], mid: [98, 76, 74], hor: [190, 130, 92] }, // sunrise
  { p: 0.37, top: [46, 60, 88], mid: [92, 88, 90], hor: [156, 122, 98] }, // morning
  { p: 0.5, top: [50, 68, 94], mid: [84, 88, 96], hor: [126, 116, 108] }, // midday (muted)
  { p: 0.63, top: [54, 60, 82], mid: [102, 86, 76], hor: [160, 112, 80] }, // afternoon
  { p: 0.73, top: [46, 42, 66], mid: [124, 74, 56], hor: [196, 100, 58] }, // sunset
  { p: 0.81, top: [35, 38, 60], mid: [80, 58, 54], hor: [150, 86, 60] }, // dusk
  { p: 0.9, top: [22, 26, 50], mid: [40, 36, 54], hor: [66, 48, 58] }, // twilight
  { p: 1.0, top: [11, 15, 30], mid: [16, 20, 38], hor: [26, 27, 46] }, // back to night
]
function skyAt(dp: number, key: 'top' | 'mid' | 'hor'): RGB {
  for (let i = 0; i < SKY.length - 1; i++) {
    if (dp >= SKY[i].p && dp <= SKY[i + 1].p) {
      const t = (dp - SKY[i].p) / (SKY[i + 1].p - SKY[i].p)
      return mixRGB(SKY[i][key], SKY[i + 1][key], t)
    }
  }
  return SKY[0][key]
}

// sun elevation curve: rises 0.25, peaks 0.5, sets 0.75
const elevation = (p: number) => Math.sin(((p - 0.25) / 0.5) * Math.PI)

// ── seasons: blended weights [spring, summer, autumn, winter] ───────────
function seasonWeights(s: number): [number, number, number, number] {
  const centers = [0, 0.25, 0.5, 0.75]
  const w = centers.map((c) => {
    let d = Math.abs(s - c)
    d = Math.min(d, 1 - d) // circular
    return Math.max(0, 1 - d / 0.25)
  })
  const sum = w[0] + w[1] + w[2] + w[3] || 1
  return [w[0] / sum, w[1] / sum, w[2] / sum, w[3] / sum]
}
// seasonal foreground tint + mote color
const SEASON_TINT: RGB[] = [
  [110, 150, 96], // spring green
  [124, 142, 84], // summer
  [156, 100, 54], // autumn amber
  [150, 166, 188], // winter cool
]
const MOTE_COLOR: RGB[] = [
  [238, 204, 214], // spring petals
  [232, 212, 130], // summer fireflies
  [202, 132, 62], // autumn leaves
  [236, 242, 250], // winter snow
]

export function LivingScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // ── starting phase: real local time + real season ──
    const now = new Date()
    let startDay = (now.getHours() + now.getMinutes() / 60) / 24
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
    )
    let startSeason = (((dayOfYear - 80) % 365) + 365) / 365 // ~Mar 21 = spring 0
    startSeason = startSeason % 1

    // ── debug overrides: ?scene=0.5&season=0.75&freeze=1 ──
    const params = new URLSearchParams(window.location.search)
    const freeze = params.has('freeze')
    if (params.has('scene')) startDay = parseFloat(params.get('scene')!)
    if (params.has('season')) startSeason = parseFloat(params.get('season')!)

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // ── geometry, regenerated on resize (deterministic) ──
    let W = 0,
      H = 0,
      dpr = 1
    type Ridge = { pts: number[]; nightCol: RGB; dayCol: RGB; haze: number; snow: number }
    let ridges: Ridge[] = []
    let stars: { x: number; y: number; r: number; ph: number }[] = []
    let motes: { x: number; speed: number; sway: number; ph: number; size: number }[] = []
    let birds: { x: number; y: number; speed: number; ph: number; size: number; flap: number }[] = []

    const buildGeometry = () => {
      const rnd = mulberry32(20260625)
      // three ridges, back (high/hazy) → front (low/dark)
      const defs = [
        { base: 0.52, amp: 0.1, freq: 5, nightCol: [38, 44, 62] as RGB, dayCol: [104, 112, 124] as RGB, haze: 0.5, snow: 0.4 },
        { base: 0.66, amp: 0.12, freq: 7, nightCol: [26, 28, 42] as RGB, dayCol: [70, 70, 70] as RGB, haze: 0.28, snow: 0.7 },
        { base: 0.82, amp: 0.14, freq: 9, nightCol: [14, 14, 22] as RGB, dayCol: [40, 34, 28] as RGB, haze: 0.1, snow: 1 },
      ]
      ridges = defs.map((d) => {
        const ph1 = rnd() * 10,
          ph2 = rnd() * 10,
          ph3 = rnd() * 10
        const pts: number[] = []
        const steps = 48
        for (let i = 0; i <= steps; i++) {
          const x = i / steps
          const n =
            0.5 * Math.sin(x * d.freq + ph1) +
            0.3 * Math.sin(x * d.freq * 2.3 + ph2) +
            0.2 * Math.sin(x * d.freq * 4.7 + ph3)
          pts.push(x, d.base + d.amp * n * 0.5)
        }
        return { pts, nightCol: d.nightCol, dayCol: d.dayCol, haze: d.haze, snow: d.snow }
      })
      // stars in the upper sky
      stars = Array.from({ length: 90 }, () => ({
        x: rnd(),
        y: rnd() * 0.6,
        r: 0.4 + rnd() * 1.1,
        ph: rnd() * Math.PI * 2,
      }))
      // sparse seasonal motes
      motes = Array.from({ length: 22 }, () => ({
        x: rnd(),
        speed: 0.4 + rnd() * 1.2,
        sway: 0.3 + rnd() * 1.4,
        ph: rnd() * Math.PI * 2,
        size: 0.8 + rnd() * 1.8,
      }))
      // a flock that crosses the daytime sky — densest in the morning (see draw)
      birds = Array.from({ length: 7 }, () => ({
        x: rnd(),
        y: 0.3 + rnd() * 0.3, // mid sky: above the name, in the brighter band
        speed: 0.01 + rnd() * 0.008, // fraction of width per second
        ph: rnd() * Math.PI * 2,
        size: 8 + rnd() * 7,
        flap: 6 + rnd() * 4, // wingbeats/sec-ish
      }))
    }

    const start = performance.now()
    let raf = 0

    const draw = (nowMs: number) => {
      const elapsed = freeze ? 0 : (nowMs - start) / 1000
      const dp = (startDay + elapsed / DAY_SECONDS) % 1
      const sp = (startSeason + elapsed / YEAR_SECONDS) % 1

      const sunEl = elevation(dp)
      const daylight = clamp(sunEl)
      const sw = seasonWeights(sp)
      const tint = sw.reduce<RGB>(
        (acc, w, i) => [acc[0] + SEASON_TINT[i][0] * w, acc[1] + SEASON_TINT[i][1] * w, acc[2] + SEASON_TINT[i][2] * w],
        [0, 0, 0]
      )
      const moteCol = sw.reduce<RGB>(
        (acc, w, i) => [acc[0] + MOTE_COLOR[i][0] * w, acc[1] + MOTE_COLOR[i][1] * w, acc[2] + MOTE_COLOR[i][2] * w],
        [0, 0, 0]
      )
      const winter = sw[3]
      const summer = sw[1]

      // ── sky gradient ──
      const top = skyAt(dp, 'top')
      const mid = skyAt(dp, 'mid')
      const hor = skyAt(dp, 'hor')
      const horizonY = H * 0.62
      const sky = ctx.createLinearGradient(0, 0, 0, H)
      sky.addColorStop(0, rgb(top))
      sky.addColorStop(0.42, rgb(mid))
      sky.addColorStop(0.62, rgb(hor))
      sky.addColorStop(0.78, rgb(mixRGB(hor, [21, 16, 11], 0.6)))
      sky.addColorStop(1, rgb([21, 16, 11]))
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, W, H)

      // ── stars ──
      const starA = clamp((0.12 - sunEl) / 0.4)
      if (starA > 0.01) {
        for (const s of stars) {
          const tw = reduce ? 1 : 0.6 + 0.4 * Math.sin(elapsed * 1.5 + s.ph)
          ctx.fillStyle = rgb([230, 232, 245], starA * tw * 0.9)
          ctx.beginPath()
          ctx.arc(s.x * W, s.y * horizonY, s.r, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // ── celestial body: sun by day, moon by night ──
      const drawBody = (p: number, isSun: boolean) => {
        const el = elevation(p)
        if (el < -0.06) return
        const a = (p - 0.25) / 0.5
        const bx = lerp(0.16, 0.84, clamp(a, -0.3, 1.3)) * W
        // keep the arc high so the sun/moon clears the headline band below it
        const by = horizonY - clamp(el) * (horizonY * 0.92) - 6
        const vis = clamp((el + 0.06) / 0.18)
        const r = isSun ? 26 : 20
        const core: RGB = isSun ? mixRGB([255, 222, 168], [255, 176, 110], 1 - clamp(el + 0.3)) : [232, 234, 244]
        const glow = ctx.createRadialGradient(bx, by, 0, bx, by, r * 5)
        glow.addColorStop(0, rgb(core, 0.55 * vis))
        glow.addColorStop(0.18, rgb(core, 0.22 * vis))
        glow.addColorStop(1, rgb(core, 0))
        ctx.fillStyle = glow
        ctx.fillRect(bx - r * 5, by - r * 5, r * 10, r * 10)
        ctx.fillStyle = rgb(core, vis)
        ctx.beginPath()
        ctx.arc(bx, by, r, 0, Math.PI * 2)
        ctx.fill()
        if (!isSun) {
          // subtle crescent shading on the moon
          ctx.fillStyle = rgb(mixRGB(hor, [20, 22, 40], 0.5), vis * 0.55)
          ctx.beginPath()
          ctx.arc(bx + r * 0.42, by - r * 0.18, r * 0.92, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      drawBody(dp, true)
      drawBody((dp + 0.5) % 1, false)

      // ── birds: silhouettes drift across the daytime sky, densest in the
      //    morning, fading out with the daylight so the night sky stays empty ──
      const morningBoost = clamp(1 - Math.abs(dp - 0.34) / 0.18)
      const birdA = clamp(daylight * 1.3) * (0.45 + 0.55 * morningBoost)
      if (birdA > 0.03) {
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.strokeStyle = rgb([24, 20, 24], birdA)
        for (const b of birds) {
          const bx = (((b.x + elapsed * b.speed) % 1.25) - 0.125) * W
          const by = b.y * horizonY + Math.sin(elapsed * 0.6 + b.ph) * 6
          const up = b.size * (0.55 + 0.45 * Math.sin(elapsed * b.flap + b.ph)) // flap
          ctx.lineWidth = Math.max(1.5, b.size * 0.26)
          ctx.beginPath()
          ctx.moveTo(bx - b.size, by - up * 0.35)
          ctx.quadraticCurveTo(bx - b.size * 0.4, by - up, bx, by)
          ctx.quadraticCurveTo(bx + b.size * 0.4, by - up, bx + b.size, by - up * 0.35)
          ctx.stroke()
        }
      }

      // ── mountain ridges ──
      ridges.forEach((rg) => {
        let col = mixRGB(rg.nightCol, rg.dayCol, daylight)
        col = mixRGB(col, hor, rg.haze * (0.25 + 0.3 * daylight)) // atmospheric haze
        col = mixRGB(col, tint, 0.1) // faint seasonal cast
        ctx.fillStyle = rgb(col)
        ctx.beginPath()
        ctx.moveTo(0, H)
        for (let i = 0; i < rg.pts.length; i += 2) {
          ctx.lineTo(rg.pts[i] * W, rg.pts[i + 1] * H)
        }
        ctx.lineTo(W, H)
        ctx.closePath()
        ctx.fill()

        // winter snow caps near each crest
        if (winter > 0.05 && rg.snow > 0.3) {
          ctx.fillStyle = rgb([238, 242, 250], winter * rg.snow * 0.5)
          ctx.beginPath()
          let started = false
          for (let i = 0; i < rg.pts.length; i += 2) {
            const x = rg.pts[i] * W
            const y = rg.pts[i + 1] * H
            if (!started) {
              ctx.moveTo(x, y)
              started = true
            } else ctx.lineTo(x, y)
          }
          for (let i = rg.pts.length - 2; i >= 0; i -= 2) {
            ctx.lineTo(rg.pts[i] * W, rg.pts[i + 1] * H + 12)
          }
          ctx.closePath()
          ctx.fill()
        }
      })

      // ── seasonal motes (sparse, blended) ──
      const fall = lerp(1, 0.2, summer) // summer fireflies float instead of fall
      const moteA = lerp(0.5, 0.7, winter) * clamp(0.5 + 0.5 * (1 - daylight) + winter)
      const fireflyNight = summer * clamp((0.1 - sunEl) / 0.3)
      for (const m of motes) {
        const range = H + 40
        const y = ((m.ph * (range / (Math.PI * 2)) + elapsed * (10 + m.speed * 16) * fall) % range) - 20
        const fy = fireflyNight > 0.2 ? y + Math.sin(elapsed * 0.8 + m.ph) * 16 : y
        const x = m.x * W + Math.sin(elapsed * m.sway * 0.5 + m.ph) * 22
        const sz = m.size * lerp(1, 1.3, winter)
        const a = moteA * (fireflyNight > 0.2 ? clamp(0.3 + fireflyNight * (0.6 + 0.4 * Math.sin(elapsed * 2 + m.ph))) : 1)
        if (fireflyNight > 0.3) {
          const g = ctx.createRadialGradient(x, fy, 0, x, fy, sz * 4)
          g.addColorStop(0, rgb(moteCol, a * 0.5))
          g.addColorStop(1, rgb(moteCol, 0))
          ctx.fillStyle = g
          ctx.fillRect(x - sz * 4, fy - sz * 4, sz * 8, sz * 8)
        }
        ctx.fillStyle = rgb(moteCol, a)
        ctx.beginPath()
        ctx.ellipse(x, fy, sz, sz * (winter > 0.4 ? 1 : 0.7), elapsed + m.ph, 0, Math.PI * 2)
        ctx.fill()
      }

      // ── vignette for depth ──
      const vig = ctx.createRadialGradient(W / 2, H * 0.34, H * 0.2, W / 2, H * 0.5, H * 0.9)
      vig.addColorStop(0, 'rgba(0,0,0,0)')
      vig.addColorStop(1, 'rgba(0,0,0,0.34)')
      ctx.fillStyle = vig
      ctx.fillRect(0, 0, W, H)
    }

    const loop = (nowMs: number) => {
      draw(nowMs)
      raf = requestAnimationFrame(loop)
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = rect.width
      H = rect.height
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      buildGeometry()
      draw(performance.now()) // repaint right away (survives the resize clear)
    }
    resize()

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    if (!reduce && !freeze) raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
    />
  )
}
