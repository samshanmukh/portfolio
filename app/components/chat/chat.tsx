'use client'

import { motion, useReducedMotion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { openSmsOnPhone } from '../../lib/open-sms'
import { ask, requestedView, type Source, type View } from '../../lib/agent'
import { profile } from '../../lib/data'
import { isPresetQuestion } from '../../lib/questions'
import type { PostMeta } from '../../lib/posts'
import { afterPlace, answer as bookingAnswer, question as bookingQuestion, dayLabel, timeLabel, NEVER_MIND, type Flow } from '../../lib/booking-flow'
import { splitBooking } from '../../lib/clean-reply'
import { socials } from '../../lib/data'
import { type ChatMsg, hostedAvailable, hostedStream } from '../../lib/hosted-llm'
import { SendArrow } from '../send-arrow'
import { SocialLinks } from '../social-links'
import { SpotifyWidget } from '../spotify-widget'
import { ThemeToggle } from '../theme-toggle'
import { ViewRenderer } from '../views/view-renderer'
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
      .slice(-6)
      .map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }))
    // the model writes the words; a card comes along only when the question asks for it outright
    const routed = ask(q)
    const view = requestedView(q)
    setMessages((prev) => [...prev, { role: 'agent', view, text: '', status: 'thinking', shown: Infinity }])
    let first = true
    let marker: 'book' | 'cancel' | null = null
    const onToken = (full: string) => {
      if (first) {
        first = false
        patchLast({ status: 'typing' })
      }
      const split = splitBooking(full)
      if (split.cancel) marker = 'cancel'
      else if (split.book && !marker) marker = 'book'
      patchLast({ text: split.text })
    }
    try {
      await hostedStream([...history, { role: 'user', content: q }], onToken, view)
      patchLast({ status: 'done' })
      return marker
    } catch {
      // every model rate-limited or down: answer this one instantly instead
      setMessages((prev) => prev.slice(0, -1))
      await streamKeyword(routed)
      return null
    }
  }

  // Booking a meeting is a soft back-and-forth: one question at a time with tap-to-answer chips.
  // Only the visitor's own "Yes, book it" books it (through /api/book onto Sam's calendar).
  const flowRef = useRef<Flow | null>(null)
  // what the visitor asked before booking, so the invite says what they want to talk about
  const bookingChat = useRef<ChatMsg[]>([])
  // the meeting this visitor booked here, kept across reloads so "cancel it" can really cancel it
  type Booked = { id: string; email: string; start: string; what: string }
  const booked = useRef<Booked | null>(null)
  useEffect(() => {
    try {
      const b = JSON.parse(localStorage.getItem('booked-meeting') || 'null')
      if (b?.id && Date.parse(b.start) > Date.now()) booked.current = b
    } catch {
      // no storage: nothing to restore
    }
  }, [])
  const remember = (b: Booked | null) => {
    booked.current = b
    try {
      if (b) localStorage.setItem('booked-meeting', JSON.stringify(b))
      else localStorage.removeItem('booked-meeting')
    } catch {
      // no storage: it still works for this visit
    }
  }
  // set while we're asking "cancel it?"; `rebook` means they wanted another time
  const cancelAsk = useRef<{ stage: 'confirm' | 'email' | 'code'; rebook: boolean; email?: string } | null>(null)
  const KEEP = 'Keep it'
  const CANCEL_YES = 'Yes, cancel it'

  const EMAIL_IN_TEXT = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i
  // "cancel our meeting", "can't make it Monday": about a meeting, not "never mind" mid-booking
  const wantsCancel = (q: string) =>
    /\b(cancel|call (it )?off|reschedul|can'?t make it|cannot make it|(move|remove|delete) (it|the|our|my))/i.test(q) &&
    ((!!booked.current && !flowRef.current) || /\b(meeting|meet|call|coffee|appointment|booking|invite|monday|tuesday|wednesday|thursday|friday)\b/i.test(q))

  const say = (text: string, chips?: string[], sources?: Source[]) => streamKeyword({ tool: '', text, followups: chips, sources })

  const startBooking = async (chat: ChatMsg[], intro = '') => {
    bookingChat.current = chat
    let slots: string[] = []
    try {
      const d = await (await fetch('/api/book', { cache: 'no-store' })).json()
      if (d?.enabled && Array.isArray(d.slots)) slots = d.slots
    } catch {
      // booking unreachable: offer email below
    }
    if (!slots.length) {
      flowRef.current = null
      return say(`${intro} I can't book from here right now, but email me at ${socials.email} and we'll find a time.`.trim(), undefined, [
        { label: 'email', href: `mailto:${socials.email}?subject=${encodeURIComponent("Let's meet")}` },
      ])
    }
    const flow: Flow = { stage: 'type', slots }
    flowRef.current = flow
    await say(`${intro} ${bookingQuestion(flow).text}`.trim(), bookingQuestion(flow).chips)
  }

  const continueBooking = async (q: string) => {
    const step = bookingAnswer(flowRef.current!, q)
    if ('done' in step) {
      flowRef.current = null
      return say(step.done.text, step.done.chips)
    }
    if ('flow' in step) {
      flowRef.current = step.flow
      return say(step.say.text, step.say.chips)
    }
    if ('lookup' in step) {
      // check the place on Google Maps, so the invite carries a real address
      setMessages((prev) => [...prev, { role: 'agent', text: '', status: 'thinking', shown: 0 }])
      let address: string | null = null
      try {
        const d = await (await fetch(`/api/book?place=${encodeURIComponent(step.lookup.place!)}`, { cache: 'no-store' })).json()
        if (typeof d?.address === 'string') address = d.address
      } catch {
        // not found or offline: keep the place as they wrote it
      }
      setMessages((prev) => prev.slice(0, -1))
      const s = address ? { flow: { ...step.lookup, found: address, stage: 'placeCheck' as const }, say: bookingQuestion({ ...step.lookup, found: address, stage: 'placeCheck' }) } : afterPlace(step.lookup)
      if (!('flow' in s)) return
      flowRef.current = s.flow
      return say(s.say.text, s.say.chips)
    }
    const f = step.book
    setMessages((prev) => [...prev, { role: 'agent', text: '', status: 'thinking', shown: 0 }])
    let d: { ok?: boolean; id?: string; error?: string; start?: string; meet?: string | null } = {}
    try {
      const r = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: f.type, start: f.start, name: f.name, email: f.email, phone: f.phone, place: f.place, chat: bookingChat.current }),
      })
      d = await r.json().catch(() => ({}))
    } catch {
      // network error: handled below
    }
    setMessages((prev) => prev.slice(0, -1))
    if (d.ok) {
      flowRef.current = null
      if (d.id) remember({ id: d.id, email: f.email!, start: d.start || f.start!, what: f.type === 'inPerson' ? 'coffee' : f.type === 'phone' ? 'call' : 'video call' })
      const when = `${dayLabel(d.start || f.start!)} at ${timeLabel(d.start || f.start!)}`
      return say(
        `Done! You're on my calendar for ${when}, and the invite is on its way to ${f.email}. Looking forward to it! Anything else you want to know before then?`,
        undefined,
        d.meet ? [{ label: 'Meet link', href: d.meet }] : undefined
      )
    }
    if (d.error === 'slot-taken') {
      let slots = f.slots.filter((s) => s !== f.start)
      try {
        const fresh = await (await fetch('/api/book', { cache: 'no-store' })).json()
        if (Array.isArray(fresh?.slots) && fresh.slots.length) slots = fresh.slots
      } catch {
        // keep the old list minus the taken slot
      }
      if (!slots.length) {
        flowRef.current = null
        return say(`Oh no, someone just took that slot and it was the last one open. Email me at ${socials.email} and we'll find a time.`, undefined, [
          { label: 'email', href: `mailto:${socials.email}?subject=${encodeURIComponent("Let's meet")}` },
        ])
      }
      const flow: Flow = { ...f, slots, stage: 'day', day: undefined, start: undefined }
      flowRef.current = flow
      return say(`Oh no, someone just took that slot. ${bookingQuestion(flow).text}`, bookingQuestion(flow).chips)
    }
    flowRef.current = null
    return say(
      d.error === 'rate-limited'
        ? `That's a lot of bookings for one day! Email me at ${socials.email} and we'll sort it out.`
        : `Hmm, something went wrong booking that. Email me at ${socials.email} and we'll find a time.`,
      undefined,
      [{ label: 'email', href: `mailto:${socials.email}?subject=${encodeURIComponent("Let's meet")}` }]
    )
  }

  // Cancelling (or moving) a meeting. Booked from this browser: ask once, then take it off Sam's
  // calendar. Otherwise: find it by the email it was booked with, and email them a code first, so
  // only the person with that inbox can cancel it.
  const emailLink: Source[] = [{ label: 'email', href: `mailto:${socials.email}?subject=${encodeURIComponent('Our meeting')}` }]
  const post = async (body: Record<string, unknown>) => {
    setMessages((prev) => [...prev, { role: 'agent', text: '', status: 'thinking', shown: 0 }])
    let d: { ok?: boolean; error?: string; found?: number; start?: string; what?: string } = {}
    try {
      const r = await fetch('/api/book', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      d = await r.json().catch(() => ({}))
    } catch {
      // network error: handled by the caller
    }
    setMessages((prev) => prev.slice(0, -1))
    return d
  }
  const cancelled = (rebook: boolean, what = 'it') => {
    const done = `Done, I've cancelled ${what} and you'll get an email from Google about it.`
    return rebook ? startBooking(bookingChat.current, `${done} Let's find a new time.`) : say(`${done} If you want to meet another time, just say so!`)
  }
  const couldNot = () => say(`Hmm, I couldn't cancel it from here. You can decline the invite from your calendar, or email me at ${socials.email}.`, undefined, emailLink)

  const lookUp = async (email: string, rebook: boolean) => {
    const d = await post({ action: 'lookup', email })
    // the same answer whether or not a meeting exists, so nobody can probe someone's email
    if (typeof d.found === 'number') {
      cancelAsk.current = { stage: 'code', email, rebook }
      return say(
        `If there's a meeting booked with ${email}, I just emailed it a 6-digit code so I know it's you. Type it here and I'll cancel it. (No email in a minute? Tell me the email you booked with.)`,
        [NEVER_MIND]
      )
    }
    cancelAsk.current = null
    if (d.error === 'rate-limited') return say(`That's a few tries already. Email me at ${socials.email} and I'll cancel it for you.`, undefined, emailLink)
    return couldNot()
  }

  const startCancel = async (q: string, chat: ChatMsg[]) => {
    flowRef.current = null
    bookingChat.current = chat
    const rebook = /reschedul|\bmove\b|another (time|day)|different (time|day)|\bpush|\bchange/i.test(q)
    const b = booked.current
    if (b) {
      cancelAsk.current = { stage: 'confirm', rebook }
      return say(`Cancel our ${b.what} on ${dayLabel(b.start)} at ${timeLabel(b.start)}?`, [CANCEL_YES, KEEP])
    }
    // an email they already gave in this chat saves asking again
    const email = [...chat].reverse().map((m) => (m.role === 'user' ? m.content.match(EMAIL_IN_TEXT)?.[0] : undefined)).find(Boolean)
    if (email) return lookUp(email, rebook)
    cancelAsk.current = { stage: 'email', rebook }
    await say('Sure, I can help with that. What email did you book it with?', [NEVER_MIND])
  }

  const finishCancel = async (q: string) => {
    const ask = cancelAsk.current!
    const t = q.trim()
    if (/^(never ?mind|forget it|stop|no thanks)\b/i.test(t)) {
      cancelAsk.current = null
      return say("No problem, it stays on my calendar. What else can I tell you?")
    }
    if (ask.stage === 'email') {
      const email = t.match(EMAIL_IN_TEXT)?.[0]
      if (!email) return say("Hmm, that doesn't look like an email. What email did you book it with?", [NEVER_MIND])
      return lookUp(email, ask.rebook)
    }
    if (ask.stage === 'code') {
      // a different email instead of the code: look that one up
      const other = t.match(EMAIL_IN_TEXT)?.[0]
      if (other) return lookUp(other, ask.rebook)
      const code = t.replace(/\s/g, '').match(/\d{6}/)?.[0]
      if (!code) return say('Just the 6-digit code from the email, please.', [NEVER_MIND])
      const d = await post({ action: 'cancelCode', email: ask.email, code })
      if (d.ok) {
        cancelAsk.current = null
        return cancelled(ask.rebook, d.start ? `our ${d.what || 'meeting'} on ${dayLabel(d.start)} at ${timeLabel(d.start)}` : 'it')
      }
      if (d.error === 'rate-limited') {
        cancelAsk.current = null
        return say(`That's a few tries already. Email me at ${socials.email} and I'll cancel it for you.`, undefined, emailLink)
      }
      if (d.error === 'bad-code') return say("That code doesn't match. Check the email and try again?", [NEVER_MIND])
      cancelAsk.current = null
      if (d.error === 'expired') return say('That code has expired. Say "cancel my meeting" and I will send a new one.')
      return couldNot()
    }
    // booked from this browser: a clear yes only, so "please don't" or "sure, but keep it" keeps it
    cancelAsk.current = null
    const b = booked.current!
    if (!/^(yes|yep|yeah|sure|ok|okay|please do|do it|cancel it)\b/i.test(t) || /\b(no|not|don'?t|keep|wait|stop|actually)\b/i.test(t)) return say("Great, it stays on my calendar. What else can I tell you?")
    const d = await post({ action: 'cancel', id: b.id, email: b.email })
    if (d.ok || d.error === 'not-found') {
      remember(null)
      return cancelled(ask.rebook)
    }
    return couldNot()
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
    // the conversation so far, for the booking note
    const chat: ChatMsg[] = [
      ...messages.filter((m) => m.text && m.status !== 'thinking').map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }) as ChatMsg),
      { role: 'user', content: q },
    ]
    // a quick-question pill mid-booking means they moved on
    if (flowRef.current && isPresetQuestion(q)) flowRef.current = null
    if (cancelAsk.current && isPresetQuestion(q)) cancelAsk.current = null
    if (cancelAsk.current) {
      await finishCancel(q)
    } else if (wantsCancel(q)) {
      // cancelling a meeting comes first, even mid-way through booking another
      await startCancel(q, chat)
    } else if (flowRef.current) {
      await continueBooking(q)
    } else if (ask(q).view === 'book' || requestedView(q) === 'book') {
      await startBooking(chat, "I'd love that!")
    } else if (typed && smart) {
      const marker = await runLLM(q)
      if (marker === 'cancel') await startCancel(q, chat)
      else if (marker === 'book') await startBooking(chat)
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

  // One continuous conversation, like iMessage: every question and answer stays on screen.
  const lastUser = messages.findLastIndex((m) => m.role === 'user')
  const lastAgent = messages.findLastIndex((m) => m.role === 'agent')
  const agentMsg = lastAgent > lastUser ? messages[lastAgent] : null
  const hasView = !!agentMsg?.view
  const geek = agentMsg?.view === 'projects' || agentMsg?.view === 'skills'
  const isEmpty = !messages.length
  const headerHeight = hasView ? 110 : 170

  // a new question scrolls up to just under the header, so its answer (and any card) reads from the top
  useEffect(() => {
    if (lastUser < 0) return
    const box = scrollRef.current
    const el = box?.querySelector<HTMLElement>(`[data-msg="${lastUser}"]`)
    if (box && el) box.scrollTo({ top: el.offsetTop - headerHeight - 12, behavior: reduced ? 'auto' : 'smooth' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastUser])

  return (
    <div className="relative h-dvh overflow-hidden">

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
        <SpotifyWidget />
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
          {isEmpty ? (
            <motion.div key="landing" className="flex min-h-full items-center justify-center" {...MOTION}>
              <ChatLanding onAsk={run} />
            </motion.div>
          ) : (
            <div className="relative flex min-h-full w-full flex-col justify-end gap-3 px-4 pb-6">
              {messages.map((m, i) =>
                m.role === 'user' ? (
                  <motion.div
                    key={i}
                    data-msg={i}
                    initial={reduced ? false : { opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="ml-auto max-w-[80%] origin-bottom-right rounded-3xl rounded-br-md bg-bubble px-4 py-2 break-words text-white"
                  >
                    {m.text}
                  </motion.div>
                ) : (
                  <motion.div
                    key={i}
                    data-msg={i}
                    initial={reduced ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="flex w-full flex-col items-start"
                  >
                    {m.view && m.view !== 'book' && (
                      <div className="mb-3 w-full">
                        <ViewRenderer view={m.view} posts={posts} onAsk={run} />
                      </div>
                    )}
                    <AgentText msg={m} onAsk={run} busy={busy} last={i === lastAgent} />
                  </motion.div>
                )
              )}
              {lastUser === messages.length - 1 && (
                <div className="mr-auto rounded-3xl rounded-bl-md bg-accent px-4 py-3">
                  <Dots />
                </div>
              )}
            </div>
          )}
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
                className={`${morphed ? '' : mounted ? 'ask-grow' : 'invisible'} shimmer-border glass-field mx-auto flex items-center rounded-full border py-2 pr-2 pl-6`}
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

function AgentText({ msg, onAsk, busy, last }: { msg: Msg; onAsk: (q: string) => void; busy: boolean; last: boolean }) {
  return (
    <div className="max-w-[85%]">
      {msg.tool && msg.tool !== 'init()' && (
        <div className="glass mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[11px] text-muted">
          ⚙ {msg.tool}
        </div>
      )}
      <div className="rounded-3xl rounded-bl-md bg-accent px-4 py-2 leading-relaxed break-words whitespace-pre-wrap">
        {msg.status === 'thinking' ? (
          <Dots />
        ) : (
          <>
            {msg.shown === Infinity ? <RichText text={msg.text} /> : msg.text.slice(0, msg.shown)}
            {msg.status === 'typing' && <span className="caret" />}
          </>
        )}
      </div>
      {/* links and follow-ups only under the newest answer, so older ones don't pile up */}
      {last && msg.status === 'done' && (
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
