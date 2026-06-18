'use client'

import { useEffect, useRef } from 'react'

/**
 * Subtle monochrome "digital rain" on a canvas. Kept faint, slow, and masked
 * to the side gutters (via CSS) so it never sits behind body text.
 * Respects prefers-reduced-motion and pauses when the tab is hidden.
 */
export function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const chars =
      'アイウエオカキクケコサシスセソタチツテト0123456789<>[]{}#$%*+=/\\|'.split('')
    const fontSize = 14

    let w = 0
    let h = 0
    let cols = 0
    let drops: number[] = []

    const setup = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      cols = Math.ceil(w / fontSize)
      drops = new Array(cols)
        .fill(0)
        .map(() => Math.floor(Math.random() * -50))
      ctx.font = `${fontSize}px 'JetBrains Mono', ui-monospace, monospace`
    }
    setup()

    let raf = 0
    let last = 0
    const stepMs = 75 // slow

    const draw = (t: number) => {
      raf = requestAnimationFrame(draw)
      if (t - last < stepMs) return
      last = t

      // fade previous frame for the trailing effect
      ctx.fillStyle = 'rgba(7, 8, 10, 0.10)'
      ctx.fillRect(0, 0, w, h)

      for (let i = 0; i < cols; i++) {
        const ch = chars[(Math.random() * chars.length) | 0]
        const x = i * fontSize
        const y = drops[i] * fontSize
        // brighter head, dim everything else
        ctx.fillStyle =
          Math.random() > 0.95
            ? 'rgba(220, 228, 236, 0.55)'
            : 'rgba(194, 204, 214, 0.32)'
        if (y > 0) ctx.fillText(ch, x, y)
        if (y > h && Math.random() > 0.975) drops[i] = Math.floor(Math.random() * -20)
        drops[i]++
      }
    }

    if (reduce) {
      // single faint static frame
      ctx.fillStyle = 'rgba(194, 204, 214, 0.14)'
      for (let i = 0; i < cols; i++) {
        const ch = chars[(Math.random() * chars.length) | 0]
        ctx.fillText(ch, i * fontSize, Math.random() * h)
      }
    } else {
      raf = requestAnimationFrame(draw)
    }

    const onResize = () => setup()
    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(raf)
      else if (!reduce) raf = requestAnimationFrame(draw)
    }
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden className="matrix-canvas" />
}
