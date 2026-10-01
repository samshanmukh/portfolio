'use client'

import { useEffect, useRef } from 'react'

// Liquid colour trail behind the page that follows the cursor (or finger).
// Skipped for reduced motion, data-saver and very low-power devices.
export function FluidCursor() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } }
    const lowPower = nav.connection?.saveData || (nav.hardwareConcurrency ?? 8) <= 2
    if (!ref.current || lowPower || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
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
