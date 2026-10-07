'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Image from 'next/image'
import { Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { openSmsOnPhone } from '../../lib/open-sms'
import { ask, type Source, type View } from '../../lib/agent'
import { profile } from '../../lib/data'
import { isPresetQuestion } from '../../lib/questions'
import type { PostMeta } from '../../lib/posts'
import { type ChatMsg, hostedAvailable, hostedStream } from '../../lib/hosted-llm'
import { SendArrow } from '../send-arrow'
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
  useEffect(() => setMounted(true), []) // start the ask box's launch once hydrated
  // launch only (same as home): the send arrow holds its shine for a moment, then goes plain
  const [shine, setShine] = useState(!morphed)
  useEffect(() => {
    if (!shine) return
    const t = setTimeout(() => setShine(false), 2900)
    return () => clearTimeout(t)
  }, [shine])
  // chat is in the DOM now: let the browser take its "after" snapshot (rAF is paused during the swap)
  useEffect(() => morphArrived(), [])

  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  // questions sent while an answer is still coming; each goes out, in order, once the one before finishes
  const [queued, setQueued] = useState<{ q: string; typed: boolean }[]>([])
  // smart mode is always on when the site has a hosted model; without one (or when every
  // model is busy) typed questions get the instant answers. null until we know.
  const [smart, setSmart] = useState<boolean | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const autoSubmitted = useRef(false)

  useEffect(() => {
    hostedAvailable().then(setSmart)
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
    // still show the matching card; the model writes the words
    const routed = ask(q)
    setMessages((prev) => [...prev, { role: 'agent', view: routed.view, text: '', status: 'thinking', shown: Infinity }])
    let first = true
    const onToken = (full: string) => {
      if (first) {
        first = false
        patchLast({ status: 'typing' })
      }
      patchLast({ text: full })
    }
    try {
      await hostedStream([...history, { role: 'user', content: q }], onToken, routed.view)
      patchLast({ status: 'done' })
    } catch {
      // every model rate-limited or down: answer this one instantly instead
      setMessages((prev) => prev.slice(0, -1))
      await streamKeyword(routed)
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
    if (typed && smart) {
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
    if (initialQuery && smart !== null && !autoSubmitted.current) {
      autoSubmitted.current = true
      run(initialQuery, !isPresetQuestion(initialQuery))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery, smart])

  // Like the reference, the screen shows only the latest exchange.
  const lastUser = messages.findLastIndex((m) => m.role === 'user')
  const lastAgent = messages.findLastIndex((m) => m.role === 'agent')
  const userMsg = lastUser >= 0 ? messages[lastUser] : null
  const agentMsg = lastAgent > lastUser || (lastAgent >= 0 && lastUser < 0) ? messages[lastAgent] : null
  const hasView = !!agentMsg?.view
  const geek = agentMsg?.view === 'projects' || agentMsg?.view === 'skills'
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
        {/* the sparkles open the "about this portfolio" popup */}
        <WelcomeModal
          trigger={
            <button
              aria-label="About this portfolio"
              className="glass tap flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:text-foreground"
            >
              <Sparkles className="h-3.5 w-3.5" />
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
              style={{ viewTransitionName: 'avatar' }}
            >
              {/* holds still while visitors type and while answers load; a Projects or Skills answer
                  swaps in the glasses version */}
              <Image src="/avatar-smile.png" alt={`${profile.name}'s avatar`} fill sizes="112px" priority className={`object-contain transition-opacity duration-500 ${geek ? 'opacity-0' : 'opacity-100'}`} />
              <Image src="/avatar-glasses.png" alt="" aria-hidden fill sizes="112px" className={`object-contain transition-opacity duration-500 ${geek ? 'opacity-100' : 'opacity-0'}`} />
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto flex h-full max-w-3xl flex-col">
        {/* scrollable answer */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-2" style={{ paddingTop: headerHeight }}>
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
                className={`${morphed ? '' : mounted ? 'ask-grow' : 'invisible'} shimmer-border glass-field mx-auto flex items-center rounded-full border border-[#E5E5E9] bg-input py-2 pr-2 pl-6`}
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
                {/* launch (same as home): the empty glass circle pops in, the arrow spawns inside it with its
                    shine, then the box grows out of the button */}
                <motion.span
                  className="flex"
                  initial={reduced || morphed ? false : { scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 14, delay: reduced ? 0 : 0.1 }}
                >
                  <motion.button
                    type="submit"
                    disabled={!input.trim()}
                    aria-label="Send"
                    whileHover={{ scale: 1.08, y: -1 }}
                    whileTap={{ scale: 0.88 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                    className="glass-primary flex cursor-pointer items-center justify-center rounded-full p-2.5 disabled:cursor-default disabled:opacity-70"
                  >
                    <motion.span
                      className="flex"
                      initial={reduced || morphed ? false : { scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3, type: 'spring', stiffness: 520, damping: 13 }}
                    >
                      <SendArrow shine={shine && !reduced} />
                    </motion.span>
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
