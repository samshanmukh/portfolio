'use client'

import { useEffect, useState } from 'react'
import { profile, socials } from '../lib/data'

const links = [
  { href: '#projects', label: 'Work' },
  { href: '#trainer', label: 'Proof' },
  { href: '#experience', label: 'Field log' },
  { href: '/blog', label: 'Writing' },
  { href: '#ask', label: 'Ask AI' },
]

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled || open
          ? 'border-b border-white/5 bg-background/70 backdrop-blur-lg'
          : 'border-b border-transparent'
      }`}
    >
      <nav className="wrap relative flex items-center justify-between py-4">
        {/* left: desktop links / mobile menu button */}
        <div className="flex items-center">
          <ul className="hidden items-center gap-1 text-sm text-foreground/70 sm:flex">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="rounded-md px-3 py-1.5 transition-colors hover:bg-white/10 hover:text-foreground"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="-ml-2 flex h-11 w-11 items-center justify-center rounded-md text-foreground/80 transition-colors hover:bg-white/10 sm:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <>
                  <path d="M3 6h18" />
                  <path d="M3 12h18" />
                  <path d="M3 18h18" />
                </>
              )}
            </svg>
          </button>
        </div>

        {/* center wordmark (absolute-centered on desktop, in-flow on mobile) */}
        <a
          href="#"
          className="text-sm font-semibold tracking-tight sm:absolute sm:left-1/2 sm:-translate-x-1/2"
        >
          {profile.shortName} <span className="text-muted">Karri</span>
        </a>

        {/* right: get in touch */}
        <a
          href="#contact"
          className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-on-primary transition-opacity hover:opacity-90"
        >
          Get in touch
          <span aria-hidden>→</span>
        </a>
      </nav>

      {/* mobile dropdown */}
      {open && (
        <div className="border-t border-white/5 sm:hidden">
          <ul className="wrap flex flex-col py-2 text-sm text-foreground/80">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-2 py-2.5 transition-colors hover:bg-white/10 hover:text-foreground"
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href={socials.resume}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="block rounded-md px-2 py-2.5 text-primary transition-colors hover:bg-white/10"
              >
                Résumé ↗
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}
