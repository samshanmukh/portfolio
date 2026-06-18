'use client'

import { useEffect, useRef, useState } from 'react'
import { ask, SUGGESTIONS, type Source } from '../lib/agent'
import { profile } from '../lib/data'

type Msg = {
  role: 'user' | 'agent'
  text: string
  tool?: string
  sources?: Source[]
  status?: 'thinking' | 'typing' | 'done'
  shown?: number
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function PortfolioAgent() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'agent',
      tool: 'init()',
      text: `Hi — I'm ${profile.shortName}'s portfolio agent. Ask me anything about his work, or tap a suggestion.`,
      status: 'done',
      shown: Infinity,
    },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const patchLast = (patch: Partial<Msg>) =>
    setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 ? { ...m, ...patch } : m)))

  const run = async (raw: string) => {
    const q = raw.trim()
    if (!q || busy) return
    setBusy(true)
    setInput('')
    const reply = ask(q)
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: q },
      {
        role: 'agent',
        tool: reply.tool,
        text: reply.text,
        sources: reply.sources,
        status: 'thinking',
        shown: 0,
      },
    ])

    await sleep(600) // "thinking" on the tool call
    patchLast({ status: 'typing' })

    const total = reply.text.length
    for (let n = 2; n <= total; n += 2) {
      await sleep(12)
      patchLast({ shown: n })
    }
    patchLast({ shown: total, status: 'done' })
    setBusy(false)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface/80 shadow-2xl shadow-black/40 backdrop-blur">
      {/* header */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.02] px-4 py-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-primary to-[#dcbb8e] text-xs font-bold text-[#1c130a]">
          ◆
        </span>
        <span className="text-sm font-medium">portfolio-agent</span>
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-[#dcbb8e]" /> online
        </span>
        <span className="ml-auto font-mono text-[10px] text-muted">powered by Sam’s data</span>
      </div>

      {/* messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary/15 px-3.5 py-2 text-sm text-foreground">
                {m.text}
              </div>
            </div>
          ) : (
            <div key={i} className="flex gap-2.5">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary to-[#dcbb8e] text-[11px] font-bold text-[#1c130a]">
                ◆
              </span>
              <div className="min-w-0 max-w-[88%] space-y-2">
                {m.tool && m.tool !== 'init()' && (
                  <div className="inline-flex items-center gap-1.5 rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 font-mono text-[11px] text-primary">
                    <span>⚙</span>
                    {m.tool}
                  </div>
                )}
                <div className="rounded-2xl rounded-tl-sm bg-white/[0.04] px-3.5 py-2.5 text-sm leading-relaxed text-foreground/90">
                  {m.status === 'thinking' ? (
                    <span className="inline-flex gap-1 align-middle">
                      <span className="dot" />
                      <span className="dot [animation-delay:150ms]" />
                      <span className="dot [animation-delay:300ms]" />
                    </span>
                  ) : (
                    <>
                      {m.shown === Infinity ? m.text : m.text.slice(0, m.shown)}
                      {m.status === 'typing' && <span className="caret" />}
                    </>
                  )}
                </div>
                {m.status === 'done' && m.sources && m.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {m.sources.map((s, j) => (
                      <SourceChip key={j} source={s} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        )}
      </div>

      {/* suggestions */}
      {!busy && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => run(s)}
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-muted transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* input */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          run(input)
        }}
        className="flex items-center gap-2 border-t border-white/10 px-3 py-2.5"
      >
        <span className="pl-1 text-primary">›</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={busy}
          spellCheck={false}
          autoComplete="off"
          placeholder="ask me anything about Sam…"
          aria-label="Ask the portfolio agent"
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted/60 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-lg bg-gradient-to-r from-primary to-[#dcbb8e] px-3 py-1.5 text-xs font-semibold text-[#1c130a] transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          send
        </button>
      </form>
    </div>
  )
}

function SourceChip({ source }: { source: Source }) {
  const cls =
    'rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono text-[11px] text-muted transition-colors hover:border-primary/40 hover:text-foreground'
  if (source.href) {
    return (
      <a href={source.href} target="_blank" rel="noopener noreferrer" className={cls}>
        {source.label} ↗
      </a>
    )
  }
  return (
    <button
      onClick={() =>
        source.scrollTo &&
        document.getElementById(source.scrollTo)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      className={cls}
    >
      {source.label} ↓
    </button>
  )
}
