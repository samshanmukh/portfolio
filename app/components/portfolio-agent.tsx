'use client'

import { useEffect, useRef, useState } from 'react'
import { ask, SUGGESTIONS, type Source } from '../lib/agent'
import { profile } from '../lib/data'
import { systemPrompt } from '../lib/knowledge'
import {
  getEngine,
  chatStream,
  webgpuSupported,
  MODEL_LABEL,
  type ChatMsg,
} from '../lib/webllm'

type Msg = {
  role: 'user' | 'agent'
  text: string
  tool?: string
  sources?: Source[]
  status?: 'thinking' | 'typing' | 'done'
  shown?: number
}

type LlmState = 'idle' | 'loading' | 'ready' | 'error' | 'unsupported'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function PortfolioAgent() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(true)
  const [started, setStarted] = useState(false)
  const [chips, setChips] = useState<string[]>(SUGGESTIONS)
  const [mode, setMode] = useState<'keyword' | 'llm'>('keyword')
  const [llm, setLlm] = useState<LlmState>('idle')
  const [prog, setProg] = useState(0)
  const [loadText, setLoadText] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const engineRef = useRef<any>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  useEffect(() => {
    if (!webgpuSupported()) setLlm('unsupported')
  }, [])

  const patchLast = (patch: Partial<Msg>) =>
    setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 ? { ...m, ...patch } : m)))

  // typed reveal for the (instant) keyword agent
  const streamKeyword = async (reply: { tool: string; text: string; sources?: Source[] }) => {
    setMessages((prev) => [
      ...prev,
      { role: 'agent', tool: reply.tool, text: reply.text, sources: reply.sources, status: 'thinking', shown: 0 },
    ])
    await sleep(reply.tool === 'init()' ? 280 : 560)
    patchLast({ status: 'typing' })
    const total = reply.text.length
    for (let n = 2; n <= total; n += 2) {
      await sleep(11)
      patchLast({ shown: n })
    }
    patchLast({ shown: total, status: 'done' })
  }

  // proactive intro on landing (always the instant keyword agent)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setBusy(true)
      await streamKeyword({
        tool: 'init()',
        text: `Yo, I'm ${profile.shortName} 👋 forward deployed engineer — I embed with teams and ship AI into production. This is me, ask me anything. Fair warning: I run on sarcasm, dad jokes, and unpopular opinions (tabs > spaces).`,
      })
      if (cancelled) return
      await sleep(300)
      const highlight = ask('what has he built')
      await streamKeyword(highlight)
      if (cancelled) return
      setChips(highlight.followups ?? SUGGESTIONS)
      setBusy(false)
      setStarted(true)
      inputRef.current?.focus()
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const enableSmart = async () => {
    if (llm === 'ready') {
      setMode('llm')
      return
    }
    if (!webgpuSupported()) {
      setLlm('unsupported')
      return
    }
    setLlm('loading')
    setProg(0)
    setLoadText('initializing…')
    try {
      // fail fast with a clear message if there's no usable GPU adapter
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const adapter = await (navigator as any).gpu?.requestAdapter?.()
      if (!adapter) throw new Error('WebGPU is present but no GPU adapter is available')

      const engine = await getEngine((p) => {
        setProg(Math.round(p.progress * 100))
        setLoadText(p.text || '')
        console.log('[smart-mode]', Math.round(p.progress * 100) + '%', p.text)
      })
      engineRef.current = engine
      setLlm('ready')
      setMode('llm')
      setLoadText('')
      setMessages((prev) => [
        ...prev,
        {
          role: 'agent',
          tool: MODEL_LABEL,
          text: `Smart mode on — I'm now a small language model running entirely in your browser (no server, no API key). Ask me anything about Sam.`,
          status: 'done',
          shown: Infinity,
        },
      ])
    } catch (e) {
      console.error('[smart-mode] failed to load', e)
      setLlm('error')
      setMode('keyword')
      const msg = e instanceof Error ? e.message : 'unknown error'
      setMessages((prev) => [
        ...prev,
        {
          role: 'agent',
          tool: 'error',
          text: `Couldn't start the local model (${msg}). No worries — I'll keep using quick answers, which are instant and work on any device.`,
          status: 'done',
          shown: Infinity,
        },
      ])
    }
  }

  const runLLM = async (q: string) => {
    const history: ChatMsg[] = messages
      .filter((m) => m.text && m.status !== 'thinking')
      .slice(-4)
      .map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }))
    const msgs: ChatMsg[] = [
      { role: 'system', content: systemPrompt() },
      ...history,
      { role: 'user', content: q },
    ]
    setMessages((prev) => [
      ...prev,
      { role: 'agent', tool: MODEL_LABEL, text: '', status: 'thinking', shown: Infinity },
    ])
    try {
      let first = true
      await chatStream(engineRef.current, msgs, (full) => {
        if (first) {
          first = false
          patchLast({ status: 'typing' })
        }
        patchLast({ text: full })
      })
      patchLast({ status: 'done' })
    } catch {
      patchLast({ text: '(local model hiccup — back to quick answers)', status: 'done' })
      setMode('keyword')
    }
  }

  const run = async (raw: string) => {
    const q = raw.trim()
    if (!q || busy) return
    setBusy(true)
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text: q }])
    if (mode === 'llm' && llm === 'ready' && engineRef.current) {
      await runLLM(q)
    } else {
      const reply = ask(q)
      await streamKeyword(reply)
      setChips(reply.followups ?? SUGGESTIONS)
    }
    setBusy(false)
    inputRef.current?.focus()
  }

  // questions seeded from the hero's chat box (queued until the intro finishes)
  const runRef = useRef(run)
  runRef.current = run
  const pendingRef = useRef<string | null>(null)
  useEffect(() => {
    const onAsk = (e: Event) => {
      pendingRef.current = (e as CustomEvent<string>).detail
      if (!busy) {
        const q = pendingRef.current
        pendingRef.current = null
        if (q) runRef.current(q)
      }
    }
    window.addEventListener('portfolio:ask', onAsk)
    return () => window.removeEventListener('portfolio:ask', onAsk)
  }, [busy])

  useEffect(() => {
    if (!busy && pendingRef.current) {
      const q = pendingRef.current
      pendingRef.current = null
      runRef.current(q)
    }
  }, [busy])

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-transparent shadow-2xl shadow-black/30 backdrop-blur-sm">
      {/* header */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary-2 text-xs font-bold text-on-primary">
          ◆
        </span>
        <span className="text-sm font-medium">portfolio-agent</span>
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-2" />
          {busy ? 'working' : 'online'}
        </span>
        <div className="ml-auto">
          <SmartToggle
            llm={llm}
            mode={mode}
            prog={prog}
            onEnable={enableSmart}
            onDisable={() => setMode('keyword')}
          />
        </div>
      </div>

      {/* messages (bottom-anchored so there's no dead space) */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex min-h-full flex-col justify-end gap-4">
          {messages.map((m, i) =>
            m.role === 'user' ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary/15 px-3.5 py-2 text-sm text-foreground">
                  {m.text}
                </div>
              </div>
            ) : (
              <div key={i} className="flex gap-2.5">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary-2 text-[11px] font-bold text-on-primary">
                  ◆
                </span>
                <div className="min-w-0 max-w-[88%] space-y-2">
                  {m.tool && m.tool !== 'init()' && (
                    <div className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[11px] text-primary">
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
      </div>

      {/* model loading progress */}
      {llm === 'loading' && (
        <div className="border-t border-white/10 px-4 py-2.5">
          <div className="mb-1.5 flex items-center justify-between text-[11px]">
            <span className="text-muted">⚡ booting on-device LLM — one-time download, then cached</span>
            <span className="font-mono text-primary">{prog}%</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary-2 transition-all duration-300"
              style={{ width: `${prog}%` }}
            />
          </div>
          {loadText && (
            <div className="mt-1.5 truncate font-mono text-[10px] text-muted/70">{loadText}</div>
          )}
        </div>
      )}

      {/* suggestions (contextual) + smart-mode hint */}
      {started && !busy && llm !== 'loading' && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-1.5">
            {chips.map((s) => (
              <button
                key={s}
                onClick={() => run(s)}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-muted transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
          {mode === 'keyword' && (llm === 'idle' || llm === 'error') && (
            <p className="mt-2 text-[10px] text-muted/70">
              instant answers · tap{' '}
              <span className="font-mono text-primary">⚡ smart mode</span> (top right) for a
              free LLM that runs in your browser
            </p>
          )}
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
          placeholder={busy ? 'agent is talking…' : 'ask me anything about Sam…'}
          aria-label="Ask the portfolio agent"
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted/60 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-lg bg-gradient-to-r from-primary to-primary-2 px-3 py-1.5 text-xs font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          send
        </button>
      </form>
    </div>
  )
}

function SmartToggle({
  llm,
  mode,
  prog,
  onEnable,
  onDisable,
}: {
  llm: LlmState
  mode: 'keyword' | 'llm'
  prog: number
  onEnable: () => void
  onDisable: () => void
}) {
  const base =
    'flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-[10px] transition-colors'
  if (llm === 'unsupported') {
    return (
      <span
        title="On-device AI needs WebGPU (Chrome or Edge on desktop)."
        className={`${base} cursor-not-allowed border-white/10 text-muted/60`}
      >
        ⚡ no WebGPU
      </span>
    )
  }
  if (llm === 'loading') {
    return (
      <span className={`${base} border-primary/40 text-primary`}>
        ⚡ loading {prog}%
      </span>
    )
  }
  if (mode === 'llm') {
    return (
      <button onClick={onDisable} className={`${base} border-primary/50 bg-primary/10 text-primary`}>
        ⚡ smart: on
      </button>
    )
  }
  return (
    <button
      onClick={onEnable}
      title="Load a small LLM that runs free in your browser (~0.9 GB, one-time)."
      className={`${base} border-white/15 text-muted hover:border-primary/40 hover:text-foreground`}
    >
      ⚡ smart mode
    </button>
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
