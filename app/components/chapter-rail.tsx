'use client'

import { useEffect, useState } from 'react'
import { chapters } from '../lib/chapters'

// A thin top scroll-progress bar + a fixed side rail of the narrative chapters
// (desktop only). The active chapter is tracked with an IntersectionObserver on
// a center band of the viewport; links are plain anchors so it works without JS
// and stays keyboard-accessible.
export function ChapterRail() {
  const [active, setActive] = useState(chapters[0].id)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const ratios = new Map<string, number>()
    const sections = chapters
      .map((c) => document.getElementById(c.id))
      .filter((el): el is HTMLElement => !!el)

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          ratios.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0)
        }
        let best = ''
        let max = 0
        for (const [id, r] of ratios) {
          if (r > max) {
            max = r
            best = id
          }
        }
        if (best) setActive(best)
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] }
    )
    sections.forEach((s) => io.observe(s))

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <>
      {/* top scroll-progress bar */}
      <div
        aria-hidden
        className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-gradient-to-r from-primary to-primary-2"
        style={{ transform: `scaleX(${progress})` }}
      />

      {/* side chapter rail (desktop) */}
      <nav
        aria-label="Chapters"
        className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-1 lg:flex"
      >
        {chapters.map((c) => {
          const on = active === c.id
          return (
            <a
              key={c.id}
              href={`#${c.id}`}
              aria-current={on ? 'true' : undefined}
              className="group flex items-center justify-end gap-2 py-1"
            >
              <span
                className={`whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.15em] transition-all duration-300 ${
                  on
                    ? 'text-primary opacity-100'
                    : 'text-muted opacity-0 group-hover:opacity-100'
                }`}
              >
                {c.label}
              </span>
              <span
                className={`h-px transition-all duration-300 ${
                  on ? 'w-6 bg-primary' : 'w-3 bg-muted/40 group-hover:bg-muted'
                }`}
              />
            </a>
          )
        })}
      </nav>
    </>
  )
}
