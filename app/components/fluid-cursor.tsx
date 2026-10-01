'use client'

import { useEffect, useRef } from 'react'

// Liquid colour trail behind the page that follows the cursor (or finger).
// Skipped for visitors who prefer reduced motion.
export function FluidCursor() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!ref.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let stop: (() => void) | undefined
    let cancelled = false
    import('../lib/fluid-cursor').then(({ default: start }) => {
      if (!cancelled && ref.current) stop = start(ref.current)
    })
    return () => {
      cancelled = true
      stop?.()
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      <canvas ref={ref} className="h-screen w-screen" />
    </div>
  )
}
