'use client'

import { useState } from 'react'
import { profile } from '../lib/data'

// Editorial hero: confident huge type, generous space, a staggered entrance.
// No background scene — the dark breathes; the typography carries it.
export function Hero() {
  const [q, setQ] = useState('')

  const askAgent = (text: string) => {
    const query = text.trim()
    document.getElementById('ask')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (query) window.dispatchEvent(new CustomEvent('portfolio:ask', { detail: query }))
    setQ('')
  }

  const startTour = () => window.dispatchEvent(new CustomEvent('portfolio:tour'))

  return (
    <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden py-28">
      <div className="wrap relative z-10 flex flex-col items-center text-center">
        <p className="rise mb-6 font-mono text-[11px] uppercase tracking-[0.4em] text-muted">
          {profile.role}
        </p>

        <h1
          className="rise font-display font-medium leading-[0.92] tracking-tight text-foreground"
          style={{ fontSize: 'clamp(3.25rem, 12vw, 9.5rem)', animationDelay: '90ms' }}
        >
          Sam <span className="text-muted">Karri</span>
        </h1>

        <p
          className="rise mt-7 max-w-xl text-balance text-base leading-relaxed text-muted sm:text-lg"
          style={{ animationDelay: '170ms' }}
        >
          I embed with teams and ship AI into production — from the messy data to
          the thing that actually runs.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            askAgent(q)
          }}
          className="rise mt-10 flex w-full max-w-md items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-2 py-2 pl-5 backdrop-blur-md transition-colors focus-within:border-white/35"
          style={{ animationDelay: '250ms' }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ask me anything…"
            aria-label="Ask Sam's AI anything"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted/70 sm:text-base"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-on-primary transition hover:opacity-90 active:scale-[0.97]"
          >
            Chat
          </button>
        </form>

        <button
          onClick={startTour}
          className="rise mt-6 font-mono text-xs text-muted underline-offset-4 transition-colors hover:text-foreground hover:underline"
          style={{ animationDelay: '320ms' }}
        >
          ▶ let my agent walk you through it
        </button>
      </div>

      {/* quiet scroll cue */}
      <a
        href="#ask"
        aria-label="Scroll down"
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 p-2 text-muted/50 transition-colors hover:text-foreground"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="animate-bounce">
          <path
            d="M12 5v14M5 12l7 7 7-7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </a>
    </section>
  )
}
