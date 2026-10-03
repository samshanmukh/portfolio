'use client'

import { useEffect, useRef } from 'react'

type Fluid = (() => void) & { burst: (x: number, y: number) => void; follow: (x: number, y: number) => void }
type Point = { x: number; y: number }

// Pages steer the liquid without a mouse (the launch arrow does this) by dispatching
// `fluid:burst` / `fluid:follow` window events with client-pixel { x, y }.
export const fluidBurst = (p: Point) => window.dispatchEvent(new CustomEvent<Point>('fluid:burst', { detail: p }))
export const fluidFollow = (p: Point) => window.dispatchEvent(new CustomEvent<Point>('fluid:follow', { detail: p }))

// Liquid colour trail behind the page that follows the cursor (or finger).
// Skipped for reduced motion, data-saver and very low-power devices.
export function FluidCursor() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } }
    const lowPower = nav.connection?.saveData || (nav.hardwareConcurrency ?? 8) <= 2
    if (!ref.current || lowPower || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let fluid: Fluid | undefined
    let cancelled = false
    // a burst sent before the simulation has loaded is replayed once it's up, if still recent
    let pending: (Point & { at: number }) | undefined
    const onBurst = (e: Event) => {
      const p = (e as CustomEvent<Point>).detail
      if (fluid) fluid.burst(p.x, p.y)
      else pending = { ...p, at: performance.now() }
    }
    const onFollow = (e: Event) => {
      const p = (e as CustomEvent<Point>).detail
      fluid?.follow(p.x, p.y)
    }
    window.addEventListener('fluid:burst', onBurst)
    window.addEventListener('fluid:follow', onFollow)
    import('../lib/fluid-cursor').then(({ default: start }) => {
      if (cancelled || !ref.current) return
      fluid = start(ref.current) as Fluid
      if (pending && performance.now() - pending.at < 700) fluid.burst?.(pending.x, pending.y)
      pending = undefined
    })
    return () => {
      cancelled = true
      window.removeEventListener('fluid:burst', onBurst)
      window.removeEventListener('fluid:follow', onFollow)
      fluid?.()
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      <canvas ref={ref} className="h-screen w-screen" />
    </div>
  )
}
