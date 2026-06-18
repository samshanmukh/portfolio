'use client'

import { useEffect, useRef } from 'react'

/**
 * Fixed, full-viewport backdrop that reacts to the cursor:
 *  - an amber glow that follows the mouse
 *  - two ambient blobs that parallax (move at different depths)
 * Driven by CSS custom properties, updated inside a rAF for smoothness.
 */
export function InteractiveBackground() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    const el = ref.current
    if (!el) return

    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const w = window.innerWidth
        const h = window.innerHeight
        // glow position (as %)
        el.style.setProperty('--mx', `${(e.clientX / w) * 100}%`)
        el.style.setProperty('--my', `${(e.clientY / h) * 100}%`)
        // parallax offsets — opposite directions for a depth effect
        const dx = e.clientX / w - 0.5
        const dy = e.clientY / h - 0.5
        el.style.setProperty('--px', `${dx * 45}px`)
        el.style.setProperty('--py', `${dy * 45}px`)
        el.style.setProperty('--px2', `${dx * -65}px`)
        el.style.setProperty('--py2', `${dy * -65}px`)
      })
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div ref={ref} aria-hidden className="bg-interactive">
      <div className="bg-grid" />
      <div className="bg-blob bg-blob-1" />
      <div className="bg-blob bg-blob-2" />
      <div className="bg-glow" />
    </div>
  )
}
