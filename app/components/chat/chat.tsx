'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp, Info, Square } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ask, type Source, type View } from '../../lib/agent'
import { profile } from '../../lib/data'
import { systemPrompt } from '../../lib/knowledge'
import type { PostMeta } from '../../lib/posts'
import { chatStream, getEngine, MODEL_LABEL, webgpuSupported, type ChatMsg } from '../../lib/webllm'
import { SocialLinks } from '../social-links'
import { ThemeToggle } from '../theme-toggle'
import { ViewRenderer } from '../views/view-renderer'
import { WelcomeModal } from '../welcome-modal'
import { ChatLanding } from './chat-landing'
import { HelperBoost } from './helper-boost'

type Msg = {
  role: 'user' | 'agent'
  text: string
  tool?: string
  view?: View
  sources?: Source[]
  followups?: string[]
  status?: 'thinking' | 'typing' | 'done'
  shown?: number
}

type LlmState = 'idle' | 'loading' | 'ready' | 'error' | 'unsupported'

const MOTION = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: 0.3, ease: 'easeOut' as const },
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function Chat({ posts }: { posts: PostMeta[] }) {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('query')

  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState<'keyword' | 'llm'>('keyword')
  const [llm, setLlm] = useState<LlmState>('idle')
  const [prog, setProg] = useState(0)
  const [loadText, setLoadText] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const engineRef = useRef<any>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const autoSubmitted = useRef(false)

  useEffect(() => {
    if (!webgpuSupported()) setLlm('unsupported')
  }, [])

  const patchLast = (patch: Partial<Msg>) =>
    setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 ? { ...m, ...patch } : m)))

  // typed reveal for the (instant) keyword agent
  const streamKeyword = async (reply: ReturnType<typeof ask>) => {
    setMessages((prev) => [
      ...prev,
      {
        role: 'agent',
        tool: reply.tool,
        view: reply.view,
        text: reply.text,
        sources: reply.sources,
        followups: reply.followups,
        status: 'thinking',
        shown: 0,
      },
    ])
    await sleep(560)
    patchLast({ status: 'typing' })
    const total = reply.text.length
    for (let n = 2; n <= total; n += 2) {
      await sleep(11)
      patchLast({ shown: n })
    }
    patchLast({ shown: total, status: 'done' })
  }

  const runLLM = async (q: string) => {
    const history: ChatMsg[] = messages
      .filter((m) => m.text && m.status !== 'thinking')
      .slice(-4)
      .map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }))
    const msgs: ChatMsg[] = [{ role: 'system', content: systemPrompt() }, ...history, { role: 'user', content: q }]
    // still show the matching card; the local model writes the words
    const routed = ask(q)
    setMessages((prev) => [
      ...prev,
      { role: 'agent', tool: MODEL_LABEL, view: routed.view, text: '', status: 'thinking', shown: Infinity },
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
    scrollRef.current?.scrollTo({ top: 0 })
    if (mode === 'llm' && llm === 'ready' && engineRef.current) {
      await runLLM(q)
    } else {
      await streamKeyword(ask(q))
    }
    setBusy(false)
    inputRef.current?.focus()
  }

  useEffect(() => {
    if (initialQuery && !autoSubmitted.current) {
      autoSubmitted.current = true
      run(initialQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery])

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

  // Like the reference, the screen shows only the latest exchange.
  const lastUser = messages.findLastIndex((m) => m.role === 'user')
  const lastAgent = messages.findLastIndex((m) => m.role === 'agent')
  const userMsg = lastUser >= 0 ? messages[lastUser] : null
  const agentMsg = lastAgent > lastUser || (lastAgent >= 0 && lastUser < 0) ? messages[lastAgent] : null
  const hasView = !!agentMsg?.view
  const isEmpty = !userMsg && !agentMsg
  const headerHeight = hasView ? 110 : 170

  return (
    <div className="relative h-dvh overflow-hidden">
      {/* top-left: open to chat & connect */}
      {profile.available && (
        <button
          onClick={() => run('How can I reach you?')}
          className="absolute top-6 left-4 z-[51] flex cursor-pointer items-center gap-2 rounded-full border border-border bg-white/30 px-3 py-1 text-xs font-medium whitespace-nowrap shadow-md backdrop-blur-lg transition hover:bg-white/60 sm:left-6 sm:px-4 sm:py-1.5 sm:text-sm dark:bg-neutral-900/60 dark:hover:bg-neutral-800"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          <span className="hidden sm:inline">Open to chat &amp; connect</span>
          <span className="sm:hidden">Let&apos;s connect</span>
        </button>
      )}

      {/* top-right: social links (wide screens; narrower ones get them above the input) + controls */}
      <div className="absolute top-5 right-4 z-[51] flex items-center gap-1.5 sm:right-8 sm:gap-2">
        <SocialLinks size="sm" className="mr-1 hidden xl:flex" />
        <SmartToggle llm={llm} mode={mode} prog={prog} onEnable={enableSmart} onDisable={() => setMode('keyword')} />
        <WelcomeModal
          trigger={
            <button aria-label="About this portfolio" className="flex h-9 w-8 md:w-9 cursor-pointer items-center justify-center rounded-full hover:bg-accent">
              <Info className="h-5 w-5" />
            </button>
          }
        />
        <ThemeToggle />
      </div>

      {/* fixed avatar header */}
      <div className="fixed inset-x-0 top-0 z-50 bg-gradient-to-b from-background via-background/95 via-50% to-transparent">
        <div className={`transition-all duration-300 ease-in-out ${hasView ? 'pt-5 pb-0' : 'py-6'}`}>
          <div className="flex justify-center">
            <Link
              href="/"
              aria-label="Back to home"
              className={`relative block transition-all duration-300 ${hasView ? 'h-20 w-20' : 'h-28 w-28'}`}
            >
              <motion.div
                className="relative h-full w-full"
                animate={busy ? { y: [0, -4, 0], rotate: [0, -3, 3, 0] } : { y: 0, rotate: 0 }}
                transition={busy ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
              >
                <Image src="/memoji.png" alt={`${profile.name} memoji`} fill sizes="112px" priority className="object-contain" />
              </motion.div>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto flex h-full max-w-3xl flex-col">
        {/* scrollable answer */}
        <div ref={scrollRef} className="custom-scrollbar flex-1 overflow-y-auto px-2" style={{ paddingTop: headerHeight }}>
          <AnimatePresence mode="wait">
            {isEmpty ? (
              <motion.div key="landing" className="flex min-h-full items-center justify-center" {...MOTION}>
                <ChatLanding onAsk={run} />
              </motion.div>
            ) : (
              <motion.div key={lastUser + ':' + lastAgent} {...MOTION} className="flex w-full flex-col px-4 pb-6">
                {userMsg && (
                  <div className="mx-auto mb-2 max-w-[85%] rounded-3xl bg-bubble px-5 py-2 text-white">{userMsg.text}</div>
                )}

                {agentMsg?.view && (
                  <div className="mb-4 w-full">
                    <ViewRenderer view={agentMsg.view} posts={posts} onAsk={run} />
                  </div>
                )}

                {agentMsg ? (
                  <AgentText msg={agentMsg} onAsk={run} busy={busy} />
                ) : (
                  <div className="pt-4">
                    <Dots />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* bottom bar */}
        <div className="sticky bottom-0 bg-background px-2 pt-3 transition-colors duration-300 md:px-0 md:pb-4">
          {llm === 'loading' && (
            <div className="mx-auto mb-3 w-full max-w-xl px-2">
              <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted">
                <span>⚡ booting on-device LLM — one-time download, then cached</span>
                <span className="font-medium text-primary">{prog}%</span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-accent">
                <div className="h-full rounded-full bg-[#0171E3] transition-all duration-300" style={{ width: `${prog}%` }} />
              </div>
              {loadText && <div className="mt-1 truncate text-[10px] text-muted">{loadText}</div>}
            </div>
          )}
          <div className="relative flex flex-col items-center gap-3">
            <HelperBoost onAsk={run} disabled={busy} />
            <SocialLinks size="sm" className="xl:hidden" />
            <form
              onSubmit={(e) => {
                e.preventDefault()
                run(input)
              }}
              className="w-full pb-2 md:px-4 md:pb-6"
            >
              <div className="mx-auto flex items-center rounded-full border border-[#E5E5E9] bg-input py-2 pr-2 pl-6 dark:border-neutral-700">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={busy}
                  spellCheck={false}
                  autoComplete="off"
                  placeholder={busy ? `${profile.shortName} is typing…` : 'Ask me anything'}
                  aria-label="Ask me anything"
                  className="w-full border-none bg-transparent text-base placeholder:text-neutral-500 focus:outline-none disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  aria-label="Send"
                  className="flex cursor-pointer items-center justify-center rounded-full bg-[#0171E3] p-2 text-white disabled:cursor-default disabled:opacity-50"
                >
                  {busy ? <Square className="h-6 w-6 p-1" /> : <ArrowUp className="h-6 w-6" />}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <p className="fixed right-3 bottom-0 z-10 mb-4 hidden px-4 py-2 text-sm text-muted md:block">
        © {new Date().getFullYear()} {profile.shortName} Karri
      </p>
    </div>
  )
}

function Dots() {
  return (
    <span className="inline-flex gap-1.5 align-middle">
      <span className="dot" />
      <span className="dot [animation-delay:150ms]" />
      <span className="dot [animation-delay:300ms]" />
    </span>
  )
}

function AgentText({ msg, onAsk, busy }: { msg: Msg; onAsk: (q: string) => void; busy: boolean }) {
  return (
    <div className="w-full">
      {msg.tool && msg.tool !== 'init()' && (
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-0.5 font-mono text-[11px] text-muted">
          ⚙ {msg.tool}
        </div>
      )}
      <div className="py-2 leading-relaxed break-words whitespace-pre-wrap">
        {msg.status === 'thinking' ? (
          <Dots />
        ) : (
          <>
            {msg.shown === Infinity ? msg.text : msg.text.slice(0, msg.shown)}
            {msg.status === 'typing' && <span className="caret" />}
          </>
        )}
      </div>
      {msg.status === 'done' && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {msg.sources
            ?.filter((s) => s.href)
            .map((s) => (
              <a
                key={s.label}
                href={s.href}
                target={s.href!.startsWith('http') || s.href!.endsWith('.pdf') ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="rounded-full border border-border px-3 py-1 text-xs text-muted transition-colors hover:text-foreground"
              >
                {s.label} ↗
              </a>
            ))}
          {msg.followups?.map((f) => (
            <button
              key={f}
              disabled={busy}
              onClick={() => onAsk(f)}
              className="cursor-pointer rounded-full bg-accent px-3 py-1 text-xs transition-colors hover:bg-neutral-200 dark:hover:bg-neutral-700"
            >
              {f}
            </button>
          ))}
        </div>
      )}
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
  const base = 'flex h-9 items-center gap-1 rounded-full border px-2.5 text-xs font-medium transition-colors md:px-3'
  if (llm === 'unsupported') {
    return (
      <span
        title="On-device AI needs WebGPU (Chrome or Edge on desktop)."
        className={`${base} cursor-not-allowed border-border text-muted`}
      >
        ⚡ <span className="hidden md:inline">no WebGPU</span>
      </span>
    )
  }
  if (llm === 'loading') return <span className={`${base} border-[#0171E3]/40 text-primary`}>⚡ {prog}%</span>
  if (mode === 'llm') {
    return (
      <button onClick={onDisable} className={`${base} cursor-pointer border-[#0171E3]/50 bg-[#0171E3]/10 text-primary`}>
        ⚡ <span className="hidden md:inline">smart: on</span>
      </button>
    )
  }
  return (
    <button
      onClick={onEnable}
      aria-label="Smart mode"
      title="Load a small LLM that runs free in your browser (~0.4 GB, one-time)."
      className={`${base} cursor-pointer border-border text-muted hover:text-foreground`}
    >
      ⚡ <span className="hidden md:inline">smart mode</span>
    </button>
  )
}
