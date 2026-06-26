'use client'

import { useState } from 'react'
import { profile } from '../lib/data'
import { LivingScene } from './living-scene'

// Calm, near-wordless first screen: a living landscape, the name, and one
// invitation to chat. Everything else lives below the fold.
export function Hero() {
  const [q, setQ] = useState('')

  const askAgent = (text: string) => {
    const query = text.trim()
    document.getElementById('ask')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (query) window.dispatchEvent(new CustomEvent('portfolio:ask', { detail: query }))
    setQ('')
  }

  return (
    <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden">
      <LivingScene />

      {/* soft scrim so the name always reads, whatever the sky is doing behind it */}
      <div
        className="pointer-events-none absolute inset-0 z-[5]"
        style={{
          background:
            'radial-gradient(70% 52% at 50% 44%, rgba(0,0,0,0.28), transparent 78%)',
        }}
      />

      <div className="wrap relative z-10 flex flex-col items-center text-center">
        <p className="mb-5 text-xs font-medium uppercase tracking-[0.3em] text-foreground/70">
          {profile.role}
        </p>

        <h1 className="text-balance font-display text-6xl text-foreground drop-shadow-sm sm:text-7xl lg:text-8xl">
          Sam <span className="text-foreground/55">Karri</span>
        </h1>

        <p className="mt-5 max-w-sm text-balance text-sm text-foreground/75 sm:max-w-md sm:text-base">
          I embed with teams and ship AI into production — from the messy data
          to the thing that actually runs.
        </p>

        {/* the one invitation */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            askAgent(q)
          }}
          className="mt-8 flex w-full max-w-md items-center gap-2 rounded-full border border-white/20 bg-black/25 px-2 py-2 pl-5 backdrop-blur-md transition-colors focus-within:border-white/40"
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ask me anything…"
            aria-label="Ask Sam's AI anything"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/50 sm:text-base"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-on-primary transition-opacity hover:opacity-90"
          >
            Chat
          </button>
        </form>
      </div>

      {/* quiet scroll cue */}
      <a
        href="#ask"
        aria-label="Scroll down"
        className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 p-2 text-foreground/40 transition-colors hover:text-foreground/80"
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
