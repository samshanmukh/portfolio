'use client'

import { useEffect, useState } from 'react'

type Theme = 'mono' | 'gold'

// Flip the whole site between the two editorial palettes. Persisted to
// localStorage; applied to <html data-theme> (gold) or cleared (mono default).
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('mono')

  useEffect(() => {
    const saved = (localStorage.getItem('theme') as Theme) || 'mono'
    setTheme(saved)
  }, [])

  const toggle = () => {
    const next: Theme = theme === 'mono' ? 'gold' : 'mono'
    setTheme(next)
    document.documentElement.dataset.theme = next === 'gold' ? 'gold' : ''
    try {
      localStorage.setItem('theme', next)
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === 'mono' ? 'warm gold' : 'cool mono'} theme`}
      title="Switch palette"
      className="inline-flex items-center gap-2 rounded-full border border-white/12 px-3 py-1.5 text-xs text-muted transition-colors hover:border-white/25 hover:text-foreground active:scale-[0.97]"
    >
      <span
        className="h-3 w-3 rounded-full ring-1 ring-white/20"
        style={{ background: 'var(--primary)' }}
      />
      <span className="hidden font-mono sm:inline">
        {theme === 'mono' ? 'Mono' : 'Gold'}
      </span>
    </button>
  )
}
