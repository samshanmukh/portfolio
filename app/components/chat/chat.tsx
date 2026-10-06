'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Image from 'next/image'
import { ArrowUp, Sparkles, Square } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { openSmsOnPhone } from '../../lib/open-sms'
import { ask, type Source, type View } from '../../lib/agent'
import { profile } from '../../lib/data'
import { isPresetQuestion } from '../../lib/questions'
import { systemPrompt } from '../../lib/knowledge'
import type { PostMeta } from '../../lib/posts'
import { chatStream, getEngine, MODEL_LABEL, webgpuSupported, type ChatMsg } from '../../lib/webllm'
import { HOSTED_LABEL, hostedAvailable, hostedStream } from '../../lib/hosted-llm'
import { SocialLinks } from '../social-links'
import { SpotifyWidget } from '../spotify-widget'
import { ThemeToggle } from '../theme-toggle'
import { ViewRenderer } from '../views/view-renderer'
import { WelcomeModal } from '../welcome-modal'
import { ChatLanding } from './chat-landing'
import { HelperBoost } from './helper-boost'
import { RichText } from './rich-text'
import { morphArrived, morphing } from '../../lib/morph'

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
  const reduced = useReducedMotion()
  // arriving from home by the morph: the avatar, ask box and socials glide in already, so skip their entrances
  const [morphed] = useState(morphing)
  const [mounted, setMounted] = useState(morphed)
  useEffect(() => setMounted(true), []) // start the input's bubble entrance once hydrated
  // chat is in the DOM now: let the browser take its "after" snapshot (rAF is paused during the swap)
  useEffect(() => morphArrived(), [])

  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  // questions sent while an answer is still coming; each goes out, in order, once the one before finishes
  const [queued, setQueued] = useState<{ q: string; typed: boolean }[]>([])
  const [mode, setMode] = useState<'keyword' | 'llm'>('keyword')
  const [llm, setLlm] = useState<LlmState>('idle')
  const [prog, setProg] = useState(0)
  const [loadText, setLoadText] = useState('')
  // smart mode's brain: a hosted model (Mistral or Groq) when a key is set, else the in-browser model
  const [brain, setBrain] = useState<'hosted' | 'local' | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const engineRef = useRef<any>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const autoSubmitted = useRef(false)

  useEffect(() => {
    hostedAvailable().then((ok) => {
      setBrain(ok ? 'hosted' : 'local')
      if (ok) {
        // a hosted model needs no download, so smart mode starts on
        setLlm('ready')
        setMode('llm')
      } else if (!webgpuSupported()) setLlm('unsupported')
    })
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
    // still show the matching card; the model writes the words
    const routed = ask(q)
    const remote = brain === 'hosted'
    setMessages((prev) => [
      ...prev,
      { role: 'agent', tool: remote ? HOSTED_LABEL : MODEL_LABEL, view: routed.view, text: '', status: 'thinking', shown: Infinity },
    ])
    let first = true
    const onToken = (full: string) => {
      if (first) {
        first = false
        patchLast({ status: 'typing' })
      }
      patchLast({ text: full })
    }
    try {
      if (remote) await hostedStream(msgs, onToken)
      else await chatStream(engineRef.current, msgs, onToken)
      patchLast({ status: 'done' })
    } catch {
      if (remote) {
        // every provider rate-limited or down: answer this one instantly instead, smart mode stays on
        setMessages((prev) => prev.slice(0, -1))
        await streamKeyword(routed)
        return
      }
      patchLast({ text: '(local model hiccup, back to quick answers)', status: 'done' })
      setMode('keyword')
    }
  }

  // `typed`: the visitor wrote it. Pills, follow-ups and cards keep their instant answers;
  // only typed questions go to smart mode.
  const run = async (raw: string, typed = false) => {
    const q = raw.trim()
    if (!q) return
    if (busy) {
      setQueued((prev) => [...prev, { q, typed }])
      setInput('')
      return
    }
    setBusy(true)
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text: q }])
    scrollRef.current?.scrollTo({ top: 0 })
    if (typed && mode === 'llm' && llm === 'ready' && (brain === 'hosted' || engineRef.current)) {
      await runLLM(q)
    } else {
      await streamKeyword(ask(q))
    }
    setBusy(false)
    inputRef.current?.focus()
  }

  useEffect(() => {
    if (busy || !queued.length) return
    const [next, ...rest] = queued
    setQueued(rest)
    run(next.q, next.typed)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy, queued])

  useEffect(() => {
    // wait to learn whether smart mode is on, so a question asked from home gets the smart answer
    if (initialQuery && brain && !autoSubmitted.current) {
      autoSubmitted.current = true
      run(initialQuery, !isPresetQuestion(initialQuery))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery, brain])

  const enableSmart = async () => {
    if (llm === 'ready') {
      setMode('llm')
      return
    }
    if (brain === 'hosted') {
      setLlm('ready')
      setMode('llm')
      setMessages((prev) => [
        ...prev,
        {
          role: 'agent',
          tool: HOSTED_LABEL,
          text: `Smart mode on: I'm now a full AI model that knows everything on this site, from my projects and jobs to my blog posts. Ask me anything!`,
          status: 'done',
          shown: Infinity,
        },
      ])
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
          text: `Smart mode on: I'm now a small language model running entirely in your browser (no server, no API key). Ask me anything about Sam.`,
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
          text: `Couldn't start the local model (${msg}). No worries, I'll keep using quick answers, which are instant and work on any device.`,
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
      {/* now-playing corner widget; only on wide screens where it clears the input */}
      <div className="hidden xl:block">
        <SpotifyWidget className="right-6 bottom-12" />
      </div>

      {/* top-left: open to chat & connect */}
      {profile.available && (
        <button
          onClick={() => openSmsOnPhone() || run('How can I reach you?')}
          className="glass tap absolute top-6 left-4 z-[51] flex cursor-pointer items-center gap-2 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap sm:left-6 sm:px-4 sm:py-1.5 sm:text-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          <span className="hidden sm:inline">Open to chat &amp; connect</span>
          <span className="sm:hidden">Let&apos;s connect</span>
        </button>
      )}

      {/* top-right: controls */}
      <div className="absolute top-5 right-4 z-[51] flex items-center gap-1.5 sm:right-8 sm:gap-2">
        {/* clicking Smart mode toggles it and opens the "about this portfolio" popup */}
        <WelcomeModal
          trigger={
            <SmartToggle llm={llm} mode={mode} prog={prog} remote={brain === 'hosted'} onEnable={enableSmart} onDisable={() => setMode('keyword')} />
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
              style={{ viewTransitionName: 'avatar' }}
            >
              {/* holds still while visitors type and while answers load */}
              <Image src="/memoji.png" alt={`${profile.name} memoji`} fill sizes="112px" priority className="object-contain" />
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
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" /> booting on-device LLM: one-time download, then cached
                </span>
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
            <form
              onSubmit={(e) => {
                e.preventDefault()
                run(input, true)
              }}
              className="w-full md:px-4"
            >
              <div
                className={`${morphed ? '' : mounted ? 'bubble-in' : 'invisible'} shimmer-border glass-field mx-auto flex items-center rounded-full border border-[#E5E5E9] bg-input py-2 pr-2 pl-6`}
                style={{ animationDelay: '0.1s', viewTransitionName: 'askbox' }}
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  spellCheck={false}
                  autoComplete="off"
                  placeholder={queued.length ? `Up next: ${queued[0]}${queued.length > 1 ? ` (+${queued.length - 1} more)` : ''}` : busy ? `${profile.shortName} is typing…` : 'Ask me anything'}
                  aria-label="Ask me anything"
                  className="w-full border-none bg-transparent text-base placeholder:text-neutral-500 focus:outline-none disabled:opacity-60"
                />
                <motion.span
                  className="flex"
                  initial={reduced || morphed ? false : { scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 14, delay: reduced ? 0 : 0.7 }}
                >
                  <motion.button
                    type="submit"
                    disabled={!input.trim()}
                    aria-label="Send"
                    whileHover={{ scale: 1.08, y: -1 }}
                    whileTap={{ scale: 0.88 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                    className="glass-primary flex cursor-pointer items-center justify-center rounded-full p-2 disabled:cursor-default disabled:opacity-50"
                  >
                    {busy && !input.trim() ? <Square className="h-6 w-6 p-1" /> : <ArrowUp className="h-6 w-6" />}
                  </motion.button>
                </motion.span>
              </div>
            </form>
            {/* socials pop in just under the input */}
            <SocialLinks size="sm" pop={!morphed} delay={0.85} style={{ viewTransitionName: 'socials' }} className="pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-5" />
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
        <div className="glass mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[11px] text-muted">
          ⚙ {msg.tool}
        </div>
      )}
      <div className="py-2 leading-relaxed break-words whitespace-pre-wrap">
        {msg.status === 'thinking' ? (
          <Dots />
        ) : (
          <>
            {msg.shown === Infinity ? <RichText text={msg.text} /> : msg.text.slice(0, msg.shown)}
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
                className="glass tap relative rounded-full px-3 py-1.5 text-xs text-muted transition-colors hover:text-foreground"
              >
                {s.label} ↗
              </a>
            ))}
          {msg.followups?.map((f) => (
            <button
              key={f}
              disabled={busy}
              onClick={() => onAsk(f)}
              className="glass tap relative cursor-pointer rounded-full px-3 py-1.5 text-xs"
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
  remote,
  onEnable,
  onDisable,
}: {
  llm: LlmState
  mode: 'keyword' | 'llm'
  prog: number
  remote: boolean
  onEnable: () => void
  onDisable: () => void
}) {
  const base = 'glass tap relative flex h-9 items-center gap-1 rounded-full px-2.5 text-xs font-medium transition-colors md:px-3'
  if (llm === 'unsupported') {
    return (
      <span
        title="On-device AI needs WebGPU (Chrome or Edge on desktop)."
        className={`${base} cursor-not-allowed text-muted`}
      >
        <Sparkles className="h-3.5 w-3.5" /> <span className="hidden md:inline">no WebGPU</span>
      </span>
    )
  }
  if (llm === 'loading') return <span className={`${base} text-foreground`}><Sparkles className="h-3.5 w-3.5" /> {prog}%</span>
  if (mode === 'llm') {
    return (
      <button onClick={onDisable} className={`${base} cursor-pointer text-foreground`}>
        <Sparkles className="h-3.5 w-3.5" /> <span className="hidden md:inline">smart: on</span>
      </button>
    )
  }
  return (
    <button
      onClick={onEnable}
      aria-label="Smart mode"
      title={remote ? 'Chat with an AI that knows everything about me.' : 'Load a small LLM that runs free in your browser (~0.4 GB, one-time).'}
      className={`${base} cursor-pointer text-muted hover:text-foreground`}
    >
      <Sparkles className="h-3.5 w-3.5" /> <span className="hidden md:inline">smart mode</span>
    </button>
  )
}
