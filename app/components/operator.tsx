'use client'

import { useEffect, useState } from 'react'
import { profile, socials, projects, experience } from '../lib/data'
import { PortfolioAgent } from './portfolio-agent'

// A calm, present-tense "operator" homepage: who I am, what I'm doing RIGHT NOW
// (live signals), one thing I'm proud of, and how to reach me. Reads in seconds,
// no jargon — and it literally embodies "forward deployed": me, live, in the field.
export function Operator({
  lastPush,
}: {
  lastPush?: { name: string; url: string; ago: string }
}) {
  const featured = projects.find((p) => p.featured) ?? projects[0]
  const current = experience[0]

  const [clock, setClock] = useState<string | null>(null)
  const [track, setTrack] = useState<{ isPlaying: boolean; title?: string; artist?: string }>({
    isPlaying: false,
  })
  const [agentOpen, setAgentOpen] = useState(false)
  const [theme, setTheme] = useState<'mono' | 'gold'>('mono')

  useEffect(() => {
    setTheme((localStorage.getItem('theme') as 'mono' | 'gold') || 'mono')
    const tick = () =>
      setClock(
        new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/Los_Angeles',
          hour: 'numeric',
          minute: '2-digit',
        }).format(new Date())
      )
    tick()
    const id = setInterval(tick, 30000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    let on = true
    const load = async () => {
      try {
        const r = await fetch('/api/now-playing')
        if (r.ok && on) setTrack(await r.json())
      } catch {
        /* ignore */
      }
    }
    load()
    const id = setInterval(load, 30000)
    return () => {
      on = false
      clearInterval(id)
    }
  }, [])

  useEffect(() => {
    if (!agentOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setAgentOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [agentOpen])

  const flipTheme = () => {
    const next = theme === 'mono' ? 'gold' : 'mono'
    setTheme(next)
    document.documentElement.dataset.theme = next === 'gold' ? 'gold' : ''
    try {
      localStorage.setItem('theme', next)
    } catch {
      /* ignore */
    }
  }

  const rows = [
    {
      label: 'Working on',
      node: (
        <>
          {current.role} at {current.company} —{' '}
          <span className="text-foreground/60">healthcare AI in production</span>
        </>
      ),
      live: true,
    },
    {
      label: 'Last shipped',
      node: lastPush ? (
        <a
          href={lastPush.url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-4 hover:text-primary hover:underline"
        >
          {lastPush.name} <span className="text-foreground/50">· {lastPush.ago}</span>
        </a>
      ) : (
        <span className="text-foreground/60">code, most days</span>
      ),
      live: !!lastPush,
    },
    {
      label: 'Listening',
      node: track.isPlaying ? (
        <span>
          {track.title} <span className="text-foreground/50">— {track.artist}</span>
        </span>
      ) : (
        <span className="text-foreground/50">nothing right now</span>
      ),
      live: track.isPlaying,
    },
    {
      label: 'Based in',
      node: (
        <span>
          San Francisco{clock ? <span className="text-foreground/50"> · {clock} local</span> : null}
        </span>
      ),
      live: false,
    },
  ]

  return (
    <main className="relative mx-auto flex min-h-[100svh] max-w-3xl flex-col px-6 sm:px-8">
      {/* top bar */}
      <header className="flex items-center justify-between py-6">
        <span className="font-mono text-xs tracking-wide text-muted">{profile.name}</span>
        {profile.available && (
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-muted">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Open to FDE roles
          </span>
        )}
      </header>

      {/* center */}
      <section className="flex flex-1 flex-col justify-center gap-12 py-12">
        <div>
          <p className="rise mb-5 font-mono text-[11px] uppercase tracking-[0.35em] text-muted">
            {profile.role} · {profile.location}
          </p>
          <h1
            className="rise font-display font-medium leading-[1.04] tracking-tight text-foreground"
            style={{ fontSize: 'clamp(2.25rem, 6vw, 4.25rem)', animationDelay: '80ms' }}
          >
            Right now, I’m embedding with teams and shipping{' '}
            <span className="text-primary">AI into production.</span>
          </h1>
          <p
            className="rise mt-6 max-w-xl text-lg leading-relaxed text-muted"
            style={{ animationDelay: '150ms' }}
          >
            I own the whole loop — the messy data, the model, the deployment, and
            the iteration after launch.
          </p>
        </div>

        {/* RIGHT NOW — live panel */}
        <div className="rise" style={{ animationDelay: '230ms' }}>
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.3em] text-muted/70">
            Right now
          </p>
          <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {rows.map((r) => (
              <div key={r.label} className="flex items-baseline gap-3 border-t border-line pt-3">
                <dt className="flex w-28 shrink-0 items-center gap-1.5 font-mono text-xs text-muted">
                  {r.live && <span className="h-1.5 w-1.5 rounded-full bg-primary-2" />}
                  {r.label}
                </dt>
                <dd className="min-w-0 flex-1 text-sm text-foreground/85">{r.node}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* one thing I'm proud of */}
        <div className="rise" style={{ animationDelay: '300ms' }}>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.3em] text-muted/70">
            One thing I’m proud of
          </p>
          <a
            href={featured.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-2xl border border-white/10 bg-surface/60 p-5 transition-colors hover:border-primary/40"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-xl text-foreground group-hover:text-primary">
                {featured.name}
              </h2>
              <span className="font-mono text-xs text-muted">code ↗</span>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              {featured.outcome ?? featured.blurb}
            </p>
          </a>
          <p className="mt-3 text-sm text-muted">
            Also shipped{' '}
            {projects
              .filter((p) => p.featured && p.name !== featured.name)
              .map((p, i, a) => (
                <span key={p.name}>
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground/80 underline-offset-4 hover:text-primary hover:underline"
                  >
                    {p.name}
                  </a>
                  {i < a.length - 1 ? ', ' : ''}
                </span>
              ))}{' '}
            — or just ask my AI.
          </p>
        </div>

        {/* CTAs */}
        <div className="rise flex flex-wrap items-center gap-3" style={{ animationDelay: '370ms' }}>
          <button
            onClick={() => setAgentOpen(true)}
            className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-on-primary transition hover:opacity-90 active:scale-[0.97]"
          >
            Talk to my AI
          </button>
          <a
            href={`mailto:${socials.email}`}
            className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-foreground transition-colors hover:border-white/35 active:scale-[0.97]"
          >
            Get in touch
          </a>
          <a
            href={socials.resume}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 text-sm text-muted underline-offset-4 hover:text-foreground hover:underline"
          >
            Résumé
          </a>
        </div>
      </section>

      {/* footer */}
      <footer className="flex items-center justify-between gap-4 py-6 text-xs text-muted">
        <div className="flex items-center gap-4">
          <a href={socials.github} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
            GitHub
          </a>
          <a href={socials.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
            LinkedIn
          </a>
          <a href={socials.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
            X
          </a>
        </div>
        <button
          onClick={flipTheme}
          className="inline-flex items-center gap-1.5 text-muted hover:text-foreground"
          title="Switch palette"
        >
          <span className="h-2.5 w-2.5 rounded-full ring-1 ring-white/20" style={{ background: 'var(--primary)' }} />
          {theme === 'mono' ? 'mono' : 'gold'}
        </button>
      </footer>

      {/* agent modal */}
      {agentOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setAgentOpen(false)}
        >
          <div
            className="flex h-[560px] w-full max-w-2xl flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex justify-end">
              <button
                onClick={() => setAgentOpen(false)}
                aria-label="Close"
                className="rounded-full border border-white/15 px-3 py-1 text-xs text-muted transition-colors hover:text-foreground"
              >
                close ✕
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <PortfolioAgent />
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
