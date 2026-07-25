'use client'

import { useEffect, useRef, useState } from 'react'
import { chapters } from '../lib/chapters'
import { TourVoice, type VoiceMode } from '../lib/tour-voice'

const TYPE_MS = 24 // per-character typing speed
const READ_MS = 2000 // read pause when there's no voice

// Autonomous, agent-driven walkthrough. Dispatch `portfolio:tour` to start:
// the agent bubble appears, the page scrolls itself chapter-to-chapter, a
// spotlight dims everything but the active section, and each line is SPOKEN in
// Grok's voice (male) — advancing when the audio finishes. Falls back to the
// browser voice, then to a silent typewriter. Escape / "end" stops it.
export function GuidedTour() {
  const [active, setActive] = useState(false)
  const [i, setI] = useState(0)
  const [shown, setShown] = useState('')
  const [typing, setTyping] = useState(false)
  const [mode, setMode] = useState<VoiceMode>('none')

  const voiceRef = useRef<TourVoice | null>(null)
  const initRef = useRef<Promise<VoiceMode> | null>(null)
  const spotRef = useRef<HTMLDivElement>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  const end = () => {
    clearTimers()
    voiceRef.current?.stop()
    voiceRef.current = null
    setActive(false)
  }

  // start (created inside the user gesture so audio is allowed to play)
  useEffect(() => {
    const onStart = () => {
      clearTimers()
      voiceRef.current?.stop()
      const v = new TourVoice()
      voiceRef.current = v
      setMode('none')
      initRef.current = v.init().then((m) => {
        setMode(m)
        return m
      })
      setI(0)
      setActive(true)
    }
    window.addEventListener('portfolio:tour', onStart)
    return () => window.removeEventListener('portfolio:tour', onStart)
  }, [])

  // drive each chapter: scroll → type → speak → advance
  useEffect(() => {
    if (!active) return
    let cancelled = false
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const line = chapters[i].narration

    document.getElementById(chapters[i].id)?.scrollIntoView({
      behavior: reduce ? 'auto' : 'smooth',
      block: 'start',
    })

    // typewriter (visual)
    setShown(reduce ? line : '')
    setTyping(!reduce)
    if (!reduce) {
      let n = 0
      const type = () => {
        if (cancelled) return
        n += 1
        setShown(line.slice(0, n))
        if (n < line.length) timers.current.push(setTimeout(type, TYPE_MS))
        else setTyping(false)
      }
      timers.current.push(setTimeout(type, 450))
    }

    const advance = () => {
      if (cancelled) return
      if (i >= chapters.length - 1) end()
      else setI((p) => p + 1)
    }

    const run = async () => {
      const m = (await initRef.current) ?? 'none'
      if (cancelled) return
      if (m === 'grok' || m === 'speech') {
        await voiceRef.current?.speak(line)
        if (!cancelled) timers.current.push(setTimeout(advance, 450))
      } else {
        const typeDur = reduce ? 0 : line.length * TYPE_MS + 450
        timers.current.push(setTimeout(advance, typeDur + (reduce ? 3200 : READ_MS)))
      }
    }
    run()

    return () => {
      cancelled = true
      clearTimers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, i])

  // spotlight: follow the active section every frame (tracks smooth scroll)
  useEffect(() => {
    if (!active) return
    let raf = 0
    const tick = () => {
      const el = document.getElementById(chapters[i].id)
      const sp = spotRef.current
      if (el && sp) {
        const r = el.getBoundingClientRect()
        const pad = 10
        const top = Math.max(8, r.top - pad)
        const left = Math.max(6, r.left - pad)
        sp.style.top = `${top}px`
        sp.style.left = `${left}px`
        sp.style.width = `${Math.min(window.innerWidth - left - 6, r.width + pad * 2)}px`
        sp.style.height = `${Math.max(0, Math.min(window.innerHeight - top - 8, r.height + pad * 2))}px`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, i])

  // Escape ends the tour
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && end()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  // unmount cleanup
  useEffect(
    () => () => {
      clearTimers()
      voiceRef.current?.stop()
    },
    []
  )

  if (!active) return null
  const c = chapters[i]
  const status = mode === 'grok' ? 'speaking' : mode === 'speech' ? 'speaking' : 'narrating'

  return (
    <>
      {/* spotlight: dim everything but the active section */}
      <div
        ref={spotRef}
        aria-hidden
        className="pointer-events-none fixed z-[54] rounded-2xl ring-1 ring-primary/25"
        style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.62)' }}
      />

      {/* agent bubble */}
      <div
        role="dialog"
        aria-label="Guided tour by Sam’s agent"
        className="now-playing fixed bottom-5 left-5 z-[60] w-[min(92vw,24rem)] rounded-2xl border border-white/10 bg-surface/95 p-4 shadow-2xl shadow-black/40 backdrop-blur-md"
      >
        <div className="mb-2.5 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary-2 text-xs font-bold text-on-primary">
            ◆
          </span>
          <span className="text-sm font-medium text-foreground">Sam</span>
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-2" />
            {status} · {c.no} {c.label}
          </span>
          <button
            onClick={end}
            className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted transition-colors hover:text-foreground"
          >
            end ✕
          </button>
        </div>

        <p aria-live="polite" className="min-h-[3rem] text-sm leading-relaxed text-foreground/90">
          {shown}
          {typing && <span className="caret" />}
        </p>

        <div aria-hidden className="mt-3 flex items-center gap-1.5">
          {chapters.map((ch, idx) => (
            <span
              key={ch.id}
              className={`h-1 rounded-full transition-all duration-300 ${
                idx === i
                  ? 'w-5 bg-primary'
                  : idx < i
                    ? 'w-1.5 bg-primary/40'
                    : 'w-1.5 bg-muted/30'
              }`}
            />
          ))}
        </div>
      </div>
    </>
  )
}
