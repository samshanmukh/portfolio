'use client'

import { useEffect, useRef, useState } from 'react'
import { profile, socials } from '../lib/data'
import { PortfolioAgent } from './portfolio-agent'

// A friendly, chat-first "AI portfolio" landing (in the spirit of the
// memoji "ask me anything" sites): greeting + avatar + a big ask box + quick
// chips. Anything you ask opens a chat powered by Sam's existing agent.
const CHIPS: { emoji: string; label: string; q: string }[] = [
  { emoji: '👋', label: 'Me', q: 'who are you?' },
  { emoji: '🛠️', label: 'Projects', q: 'what have you built?' },
  { emoji: '🧠', label: 'Skills', q: "what's your stack?" },
  { emoji: '💼', label: 'Experience', q: 'where have you worked?' },
  { emoji: '🏋️', label: 'Fun', q: 'tell me about the gym' },
  { emoji: '✉️', label: 'Contact', q: 'how do I reach you?' },
]

export function AiPortfolio() {
  const [q, setQ] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const pending = useRef<string | null>(null)

  useEffect(() => {
    setDark(localStorage.getItem('theme') === 'dark')
  }, [])

  // once the chat (and its agent) is open, hand it the question to answer
  useEffect(() => {
    if (chatOpen && pending.current) {
      const question = pending.current
      const t = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('portfolio:ask', { detail: question }))
        pending.current = null
      }, 250)
      return () => clearTimeout(t)
    }
  }, [chatOpen])

  const openChat = (question?: string) => {
    if (question) pending.current = question
    setChatOpen(true)
  }

  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    document.documentElement.dataset.theme = next ? 'dark' : ''
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="relative flex min-h-[100svh] flex-col">
      {/* header */}
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <span className="flex items-center gap-2 font-medium">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-foreground text-sm font-bold text-background">
            S
          </span>
          <span className="hidden sm:inline">{profile.shortName} Karri</span>
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:text-foreground active:scale-95"
          >
            {dark ? '☀️' : '🌙'}
          </button>
          <button
            onClick={() => openChat('are you available for roles?')}
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90 active:scale-[0.97]"
          >
            Looking to hire? 👀
          </button>
        </div>
      </header>

      {/* hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-5 pb-16 text-center">
        <div className="relative mb-7">
          <span className="absolute -inset-2 -z-10 rounded-full bg-gradient-to-tr from-primary/40 to-primary-2/40 blur-2xl" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={profile.avatar}
            alt={profile.name}
            width={128}
            height={128}
            className="h-28 w-28 rounded-full object-cover shadow-lg ring-2 ring-surface sm:h-32 sm:w-32"
          />
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Hey, I’m {profile.shortName} <span className="inline-block">👋</span>
        </h1>
        <p className="mt-3 max-w-md text-base text-muted sm:text-lg">
          {profile.role} who ships AI into production. Ask my AI anything about
          me — work, projects, or whether I’m a fit for your team.
        </p>

        {/* ask box */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const text = q.trim()
            if (text) openChat(text)
            setQ('')
          }}
          className="mt-9 flex w-full max-w-md items-center gap-2 rounded-full border border-line bg-surface px-2 py-2 pl-5 shadow-sm transition-colors focus-within:border-primary/50"
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ask me anything…"
            aria-label="Ask Sam's AI anything"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted sm:text-base"
          />
          <button
            type="submit"
            aria-label="Send"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition hover:opacity-90 active:scale-95"
          >
            ↑
          </button>
        </form>

        {/* quick chips */}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {CHIPS.map((c) => (
            <button
              key={c.label}
              onClick={() => openChat(c.q)}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm text-foreground/80 shadow-sm transition-colors hover:border-primary/40 hover:text-foreground active:scale-[0.97]"
            >
              <span>{c.emoji}</span>
              {c.label}
            </button>
          ))}
        </div>
      </main>

      {/* footer */}
      <footer className="flex items-center justify-center gap-4 pb-6 text-xs text-muted">
        <a href={socials.github} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
          GitHub
        </a>
        <a href={socials.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
          LinkedIn
        </a>
        <a href={socials.resume} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
          Résumé
        </a>
      </footer>

      {/* chat overlay */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          <div className="flex items-center gap-3 border-b border-line px-5 py-3">
            <button
              onClick={() => setChatOpen(false)}
              aria-label="Back"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:text-foreground active:scale-95"
            >
              ←
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.avatar}
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover"
            />
            <div className="leading-tight">
              <div className="text-sm font-medium">{profile.shortName}’s AI</div>
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                online
              </div>
            </div>
          </div>
          <div className="mx-auto min-h-0 w-full max-w-2xl flex-1 p-3 sm:p-5">
            <PortfolioAgent />
          </div>
        </div>
      )}
    </div>
  )
}
