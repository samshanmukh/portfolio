'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { RollingGreeting } from './components/rolling-greeting'
import { profile } from './lib/data'
import { openSmsOnPhone } from './lib/open-sms'
import { quickConfig, quickQuestions } from './lib/questions'
import { quickIcons } from './components/quick-icons'
import { ThemeToggle } from './components/theme-toggle'
import { SocialLinks } from './components/social-links'
import { FluidCursor } from './components/fluid-cursor'
import { SpotifyWidget } from './components/spotify-widget'
import { FluidTrail, LAUNCHES, LaunchFluid, LaunchFx, type Launch } from './components/launch-fx'

const GREETINGS = [{ text: `Hey, I'm ${profile.shortName}`, wave: true }, { text: 'Ask me anything!' }]

// Launch: only the send arrow, centred on screen → the ask box slowly grows out of it while the
// arrow slides to its spot → the box settles into place and everything else fades/pops in.
type Phase = 'measure' | 'arrow' | 'expand' | 'settle' | 'done'
const ARROW_MS = 850 // circle pops in, arrow spawns inside it, then expand
const EXPAND_MS = 1100
const SETTLE_MS = 700
const OPEN = 'inset(0px 0px 0px 0px round 999px)'
const HIDDEN = 'inset(50% 0px 50% 100% round 999px)'

// fades/slides a block in once the box has settled
const reveal = (show: boolean, delay = 0, y = 16) => ({
  initial: { opacity: 0, y },
  animate: show ? { opacity: 1, y: 0 } : { opacity: 0, y },
  transition: { duration: 0.5, ease: 'easeOut' as const, delay: show ? delay : 0 },
})

export default function Home() {
  const [input, setInput] = useState('')
  const [focused, setFocused] = useState(false)
  const router = useRouter()
  const reduced = useReducedMotion()

  const boxRef = useRef<HTMLDivElement>(null)
  const arrowRef = useRef<HTMLSpanElement>(null)
  const [phase, setPhase] = useState<Phase>('measure')
  const [intro, setIntro] = useState({ x: 0, y: 0, clip: HIDDEN, ax: 0, ay: 0, size: 0 })
  const [launch, setLaunch] = useState<Launch>('fluid')
  useLayoutEffect(() => {
    const box = boxRef.current?.getBoundingClientRect()
    const el = arrowRef.current
    if (reduced || !box || !el) {
      setPhase('done')
      return
    }
    // the arrow starts at scale 0, so take its centre from the rect and its size from layout
    const r = el.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const half = el.offsetWidth / 2 + 3 // a few px of glass around the button
    const pick = new URLSearchParams(window.location.search).get('launch') as Launch | null
    if (pick && LAUNCHES.includes(pick)) setLaunch(pick)
    setIntro({
      ax: cx - box.left,
      ay: cy - box.top,
      size: el.offsetWidth,
      x: window.innerWidth / 2 - cx,
      y: window.innerHeight / 2 - (box.top + box.height / 2),
      clip: `inset(${cy - half - box.top}px ${box.right - (cx + half)}px ${box.bottom - (cy + half)}px ${cx - half - box.left}px round 999px)`,
    })
    setPhase('arrow')
    const t1 = setTimeout(() => setPhase('expand'), ARROW_MS)
    const t2 = setTimeout(() => setPhase('settle'), ARROW_MS + EXPAND_MS)
    const t3 = setTimeout(() => setPhase('done'), ARROW_MS + EXPAND_MS + SETTLE_MS)
    return () => [t1, t2, t3].forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const revealed = phase === 'settle' || phase === 'done'
  const launching = phase === 'arrow' || phase === 'expand'
  const ready = phase === 'done' // the greeting starts once everything is in place
  const goToChat = (q: string) => router.push(`/chat?query=${encodeURIComponent(q)}`)

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] md:pb-20">
      {/* liquid colour trail that follows the cursor */}
      <FluidCursor />
      {launch === 'fluid-trail' && phase !== 'measure' && phase !== 'done' && <FluidTrail phase={phase} anchor={arrowRef} />}

      {/* big faded name behind everything — rises from the bottom edge letter by letter */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center overflow-hidden">
        <motion.div
          aria-hidden
          className="flex text-[16vw] leading-none font-black select-none sm:text-[10rem] lg:text-[16rem]"
          style={{ marginBottom: '-0.16em' }}
          initial={reduced ? false : 'hidden'}
          animate={revealed ? 'visible' : 'hidden'}
          variants={{ visible: { transition: { staggerChildren: 0.07, delayChildren: 0.3 } } }}
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
      <motion.div className="absolute top-6 right-4 z-20 sm:right-8" {...reveal(revealed, 0.1, -16)}>
        <ThemeToggle />
      </motion.div>

      {/* top-left: availability pill */}
      {profile.available && (
        <motion.div className="absolute top-6 left-4 z-20 sm:left-6" {...reveal(revealed, 0.1, -16)}>
          <button
            onClick={() => openSmsOnPhone() || goToChat('How can I reach you?')}
            className="tap relative flex cursor-pointer items-center gap-2 rounded-full border border-border bg-white/30 px-3 py-1 text-xs font-medium whitespace-nowrap shadow-md backdrop-blur-lg transition hover:bg-white/60 sm:px-4 sm:py-1.5 sm:text-sm dark:bg-neutral-900/60 dark:hover:bg-neutral-800"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <span className="hidden sm:inline">Open to chat &amp; connect</span>
            <span className="sm:hidden">Let&apos;s connect</span>
          </button>
        </motion.div>
      )}

      {/* header */}
      <div className="z-10 mt-24 mb-8 flex flex-col items-center text-center md:mt-20 md:mb-10">
        {/* the greeting is typed into the input below; keep a real h1 for SEO / screen readers */}
        <h1 className="sr-only">
          {profile.name} · {profile.role}
        </h1>
      </div>

      {/* centre memoji */}
      <motion.div
        className="relative z-10 h-52 w-52 sm:h-72 sm:w-72"
        initial={{ opacity: 0, scale: 0.85, y: 20 }}
        animate={revealed ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.85, y: 20 }}
        transition={{ type: 'spring', stiffness: 160, damping: 18 }}
      >
        <Image src="/memoji.png" alt={`${profile.name} memoji`} fill sizes="288px" priority className="object-contain" />
      </motion.div>

      {/* input + quick buttons */}
      <div className="z-10 mt-8 flex w-full flex-col items-center justify-center">
        <motion.form
          onSubmit={(e) => {
            e.preventDefault()
            if (input.trim()) goToChat(input.trim())
          }}
          className={`relative z-30 w-full max-w-lg ${phase === 'measure' ? 'invisible' : ''}`}
          initial={false}
          animate={
            phase === 'arrow' || phase === 'expand'
              ? { x: phase === 'arrow' ? intro.x : 0, y: intro.y }
              : { x: 0, y: 0 }
          }
          transition={
            phase === 'arrow'
              ? { duration: 0 }
              : phase === 'expand'
                ? { duration: EXPAND_MS / 1000, ease: [0.65, 0, 0.35, 1] }
                : { type: 'spring', stiffness: 120, damping: 20 }
          }
        >
          {/* attention effect around the button while it pops in and the box grows (removed once done) */}
          <LaunchFx launch={launch} phase={phase} intro={intro} expandMs={EXPAND_MS} />
          <motion.div
            ref={boxRef}
            initial={{ clipPath: HIDDEN }}
            animate={{ clipPath: phase === 'measure' ? HIDDEN : phase === 'arrow' ? intro.clip : OPEN }}
            transition={phase === 'expand' ? { duration: EXPAND_MS / 1000, ease: [0.65, 0, 0.35, 1] } : { duration: 0 }}
            className={`shimmer-border glass-field mx-auto flex items-center rounded-full border border-neutral-200 bg-white/30 py-2.5 pr-2 pl-6 backdrop-blur-lg transition-all hover:border-neutral-300`}
          >
            <span className="relative flex w-full items-center">
              {ready && !input && (
                <span className="text-base text-neutral-600 dark:text-neutral-400">
                  <RollingGreeting lines={GREETINGS} active={!focused} />
                </span>
              )}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                aria-label="Ask me anything"
                className="relative w-full border-none bg-transparent text-base text-neutral-800 focus:outline-none dark:text-neutral-200"
              />
            </span>
            <motion.span
              ref={arrowRef}
              className="flex"
              initial={reduced ? false : { scale: 0 }}
              animate={phase === 'measure' ? { scale: 0 } : { scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 14 }}
            >
              <motion.button
                type="submit"
                disabled={!input.trim()}
                aria-label="Submit question"
                whileHover={{ scale: 1.08, y: -1 }}
                whileTap={{ scale: 0.88 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                className={`glass-primary flex cursor-pointer items-center justify-center rounded-full p-2.5 ${launching ? '' : 'disabled:opacity-70'}`}
              >
                {launch === 'fluid' && phase !== 'done' && phase !== 'measure' && <LaunchFluid phase={phase} />}
                {/* the empty glass circle lands first, then the arrow spawns inside it */}
                <motion.span
                  className={`flex transition-colors duration-700 ${launching && launch === 'liquid' ? 'launch-ink' : ''}`}
                  initial={reduced ? false : { scale: 0, opacity: 0 }}
                  animate={phase === 'measure' ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 520, damping: 13 }}
                >
                  <ArrowRight className="h-5 w-5" />
                </motion.span>
              </motion.button>
            </motion.span>
          </motion.div>
        </motion.form>

        {/* socials pop in just under the input once the box has settled */}
        <div className="min-h-12 mt-4 flex w-full justify-center">
          {revealed && <SocialLinks size="sm" pop delay={0.25} className="justify-center" />}
        </div>

        <motion.div {...reveal(revealed, 0.45)} className="mt-5 flex w-full max-w-2xl flex-wrap justify-center gap-1 sm:grid sm:grid-cols-5 sm:gap-3">
          {quickConfig.map(({ key, color }) => {
            const Icon = quickIcons[key]
            return (
              <button
                key={key}
                onClick={() => goToChat(quickQuestions[key])}
                className="flex min-w-[76px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-white/30 px-2.5 py-2.5 backdrop-blur-lg transition hover:bg-accent active:scale-95 sm:aspect-square sm:w-full sm:min-w-0 sm:flex-col sm:gap-1 sm:rounded-2xl sm:px-0 sm:py-6 dark:bg-neutral-900/50 md:py-8"
              >
                <Icon size={22} strokeWidth={2} color={color} className="h-[18px] w-[18px] sm:h-[22px] sm:w-[22px]" />
                <span className="text-sm font-medium text-foreground/80">{key}</span>
              </button>
            )
          })}
        </motion.div>
      </div>

      {/* what I'm listening to (hidden until Spotify is configured) */}
      {revealed && <SpotifyWidget />}
    </div>
  )
}
