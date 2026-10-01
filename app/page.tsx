'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTypewriter } from './components/use-typewriter'
import { profile } from './lib/data'
import { quickConfig, quickQuestions } from './lib/questions'
import { quickIcons } from './components/quick-icons'
import { ThemeToggle } from './components/theme-toggle'
import { SocialLinks } from './components/social-links'
import { FluidCursor } from './components/fluid-cursor'
import { SpotifyWidget } from './components/spotify-widget'
import { LookingMemoji, useTypingGaze } from './components/looking-memoji'

const GREETINGS = [`Hey, I'm ${profile.shortName} Karri 👋`, 'Hello! Ask me anything…']

const top = {
  hidden: { opacity: 0, y: -60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' as const } },
}
const bottom = {
  hidden: { opacity: 0, y: 80 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.05, ease: 'easeOut' as const } },
}

export default function Home() {
  const [input, setInput] = useState('')
  const [focused, setFocused] = useState(false)
  // the greeting starts typing once the message box has finished inflating
  const [mounted, setMounted] = useState(false)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    setMounted(true) // start the bubble once hydrated, in sync with the fade-in
    const t = setTimeout(() => setReady(true), 900)
    return () => clearTimeout(t)
  }, [])
  const placeholder = useTypewriter(GREETINGS, ready && !focused && !input, ready ? 'Ask me anything…' : '')
  const gaze = useTypingGaze()
  const router = useRouter()
  const reduced = useReducedMotion()
  const goToChat = (q: string) => router.push(`/chat?query=${encodeURIComponent(q)}`)

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] md:pb-20">
      {/* liquid colour trail that follows the cursor */}
      <FluidCursor />

      {/* big faded name behind everything — rises from the bottom edge letter by letter */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center overflow-hidden">
        <motion.div
          aria-hidden
          className="flex text-[16vw] leading-none font-black select-none sm:text-[10rem] lg:text-[16rem]"
          style={{ marginBottom: '-0.16em' }}
          initial={reduced ? false : 'hidden'}
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } } }}
        >
          {Array.from(`${profile.shortName} Karri`).map((ch, i) => (
            <motion.span
              key={i}
              className="inline-block bg-gradient-to-b from-neutral-500/30 to-neutral-500/5 bg-clip-text text-transparent dark:from-neutral-400/35 dark:to-neutral-400/5"
              variants={{
                hidden: { y: '110%', opacity: 0 },
                visible: { y: '0%', opacity: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
              }}
            >
              {ch === ' ' ? '\u00a0' : ch}
            </motion.span>
          ))}
        </motion.div>
      </div>

      {/* top-right: theme */}
      <div className="absolute top-6 right-4 z-20 sm:right-8">
        <ThemeToggle />
      </div>

      {/* top-left: availability pill */}
      {profile.available && (
        <div className="absolute top-6 left-4 z-20 sm:left-6">
          <button
            onClick={() => goToChat('How can I reach you?')}
            className="tap relative flex cursor-pointer items-center gap-2 rounded-full border border-border bg-white/30 px-3 py-1 text-xs font-medium whitespace-nowrap shadow-md backdrop-blur-lg transition hover:bg-white/60 sm:px-4 sm:py-1.5 sm:text-sm dark:bg-neutral-900/60 dark:hover:bg-neutral-800"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <span className="hidden sm:inline">Open to chat &amp; connect</span>
            <span className="sm:hidden">Let&apos;s connect</span>
          </button>
        </div>
      )}

      {/* header */}
      <motion.div
        className="z-10 mt-24 mb-8 flex flex-col items-center text-center md:mt-20 md:mb-10"
        variants={top}
        initial="hidden"
        animate="visible"
      >
        {/* the greeting is typed into the input below; keep a real h1 for SEO / screen readers */}
        <h1 className="sr-only">
          {profile.name} — {profile.role}
        </h1>
      </motion.div>

      {/* centre memoji */}
      <div className="relative z-10 h-52 w-52 sm:h-72 sm:w-72">
        <LookingMemoji looking={gaze.looking} keystrokes={gaze.keystrokes} alt={`${profile.name} memoji`} sizes="288px" priority />
      </div>

      {/* input + quick buttons */}
      <motion.div
        variants={bottom}
        initial="hidden"
        animate="visible"
        className="z-10 mt-8 flex w-full flex-col items-center justify-center"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (input.trim()) goToChat(input.trim())
          }}
          className="relative w-full max-w-lg"
        >
          <div
            className={`${mounted ? 'bubble-in' : 'invisible'} mx-auto flex items-center rounded-full border border-neutral-200 bg-white/30 py-2.5 pr-2 pl-6 backdrop-blur-lg transition-all hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-neutral-600`}
            style={{ animationDelay: '0.25s' }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                gaze.onType()
              }}
              placeholder={placeholder}
              onFocus={() => {
                setFocused(true)
                gaze.onFocus()
              }}
              onBlur={() => {
                setFocused(false)
                gaze.onBlur()
              }}
              aria-label="Ask me anything"
              className="w-full border-none bg-transparent text-base text-neutral-800 placeholder:text-neutral-600 focus:outline-none dark:text-neutral-200 dark:placeholder:text-neutral-400"
            />
            <motion.span
              className="flex"
              initial={reduced ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 14, delay: reduced ? 0 : 0.85 }}
            >
              <motion.button
                type="submit"
                disabled={!input.trim()}
                aria-label="Submit question"
                whileHover={{ scale: 1.08, y: -1 }}
                whileTap={{ scale: 0.88 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                className="glass-primary flex cursor-pointer items-center justify-center rounded-full p-2.5 disabled:opacity-70"
              >
                <ArrowRight className="h-5 w-5" />
              </motion.button>
            </motion.span>
          </div>
        </form>

        {/* socials pop in just under the input */}
        <SocialLinks size="sm" pop delay={1.0} className="mt-4 justify-center" />

        <div className="mt-5 grid w-full max-w-2xl grid-cols-3 gap-3 md:grid-cols-5">
          {quickConfig.map(({ key, color }) => {
            const Icon = quickIcons[key]
            return (
              <button
                key={key}
                onClick={() => goToChat(quickQuestions[key])}
                className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-white/30 py-6 backdrop-blur-lg transition hover:bg-accent active:scale-95 dark:bg-neutral-900/50 md:py-8"
              >
                <Icon size={22} strokeWidth={2} color={color} />
                <span className="text-xs font-medium text-foreground/80 sm:text-sm">{key}</span>
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* what I'm listening to (hidden until Spotify is configured) */}
      <SpotifyWidget />
    </div>
  )
}
