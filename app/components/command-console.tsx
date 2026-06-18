'use client'

import { useEffect, useRef, useState } from 'react'
import { runCommand, suggest } from '../lib/commands'
import { socials } from '../lib/data'

type Entry = { cmd: string; lines: string[]; error?: boolean }

export function CommandConsole() {
  const [input, setInput] = useState('')
  const [entries, setEntries] = useState<Entry[]>([])
  const [history, setHistory] = useState<string[]>([])
  const [histIdx, setHistIdx] = useState(-1)
  const [open, setOpen] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const outRef = useRef<HTMLDivElement>(null)

  // auto-scroll output to the newest entry
  useEffect(() => {
    if (outRef.current) outRef.current.scrollTop = outRef.current.scrollHeight
  }, [entries, open])

  // "/" focuses the command bar from anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const run = (raw: string) => {
    const cmd = raw.trim()
    if (!cmd) return
    setHistory((h) => [...h, cmd])
    setHistIdx(-1)

    const res = runCommand(cmd)

    // side effects
    if (res.action === 'clear') {
      setEntries([])
      setInput('')
      return
    }
    if (res.action === 'resume') window.open(socials.resume, '_blank')
    if (res.action === 'email') window.location.href = `mailto:${socials.email}`
    if (res.action === 'music')
      window.dispatchEvent(new CustomEvent('portfolio:toggle-music'))
    if (res.scrollTo) {
      document
        .getElementById(res.scrollTo)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    setEntries((e) => [...e, { cmd, lines: res.lines, error: res.error }])
    setOpen(true)
    setInput('')
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      run(input)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!history.length) return
      const i = histIdx < 0 ? history.length - 1 : Math.max(0, histIdx - 1)
      setHistIdx(i)
      setInput(history[i])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (histIdx < 0) return
      const i = histIdx + 1
      if (i >= history.length) {
        setHistIdx(-1)
        setInput('')
      } else {
        setHistIdx(i)
        setInput(history[i])
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const s = suggest(input)[0]
      if (s) setInput(s)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const hints = suggest(input)

  return (
    <>
      {/* live output — fixed near the top of the screen */}
      {open && entries.length > 0 && (
        <div className="fixed inset-x-0 top-[49px] z-40">
          <div className="wrap">
            <div className="term overflow-hidden">
              <div className="term-bar">
                <span className="term-dot" />
                <span className="term-dot" />
                <span className="term-dot" />
                <span className="ml-2 text-xs text-muted">output — stdout</span>
                <button
                  onClick={() => setEntries([])}
                  className="ml-auto text-xs text-muted hover:text-foreground"
                  aria-label="Clear output"
                >
                  clear ✕
                </button>
              </div>
              <div
                ref={outRef}
                className="max-h-[45vh] overflow-y-auto px-4 py-3 text-xs leading-relaxed sm:text-sm"
              >
                {entries.map((en, i) => (
                  <div key={i} className="mb-3 last:mb-0">
                    <div>
                      <span className="text-primary">sam@portfolio</span>
                      <span className="text-muted">:</span>
                      <span className="text-foreground/60">~</span>
                      <span className="text-muted">$ </span>
                      <span className="text-foreground">{en.cmd}</span>
                    </div>
                    {en.lines.map((line, j) => (
                      <div
                        key={j}
                        className={`whitespace-pre-wrap break-words ${
                          en.error
                            ? 'text-foreground/80'
                            : line.startsWith('#')
                              ? 'text-muted'
                              : 'text-foreground/80'
                        }`}
                      >
                        {line || ' '}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* command input — pinned to the bottom of the screen */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-background/90 backdrop-blur">
        <div className="wrap">
          <div className="flex items-center gap-2 py-2.5 text-sm">
            <span className="shrink-0 select-none">
              <span className="text-primary">sam@portfolio</span>
              <span className="text-muted">:</span>
              <span className="text-foreground/60">~</span>
              <span className="text-muted">$</span>
            </span>
            <div className="relative flex-1">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                spellCheck={false}
                autoComplete="off"
                placeholder="type a command — e.g. help, projects, ./gym.sh --status"
                aria-label="Terminal command input"
                className="w-full bg-transparent text-foreground caret-transparent outline-none placeholder:text-muted/60"
              />
              {/* fake blinking caret right after the text */}
              <span
                aria-hidden
                className="pointer-events-none absolute top-1/2 -translate-y-1/2"
                style={{ left: `${input.length}ch` }}
              >
                <span className="cursor cursor-green" />
              </span>
            </div>
            {hints.length > 0 && (
              <button
                onMouseDown={(e) => {
                  e.preventDefault()
                  setInput(hints[0])
                  inputRef.current?.focus()
                }}
                className="hidden shrink-0 text-xs text-muted hover:text-foreground sm:block"
              >
                ⇥ {hints[0]}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
