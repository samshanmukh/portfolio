'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { profile } from './lib/data'
import { quickConfig, quickQuestions } from './lib/questions'
import { quickIcons } from './components/quick-icons'
import { ThemeToggle } from './components/theme-toggle'
import { SocialLinks } from './components/social-links'

const top = {
  hidden: { opacity: 0, y: -60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' as const } },
}
const bottom = {
  hidden: { opacity: 0, y: 80 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.2, ease: 'easeOut' as const } },
}

export default function Home() {
  const [input, setInput] = useState('')
  const router = useRouter()
  const goToChat = (q: string) => router.push(`/chat?query=${encodeURIComponent(q)}`)

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pb-10 md:pb-20">
      {/* big faded name behind everything */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center overflow-hidden">
        <div
          className="hidden bg-gradient-to-b from-neutral-500/30 to-neutral-500/5 bg-clip-text dark:from-neutral-400/35 dark:to-neutral-400/5 text-[10rem] leading-none font-black text-transparent select-none sm:block lg:text-[16rem]"
          style={{ marginBottom: '-2.5rem' }}
        >
          {profile.shortName} Karri
        </div>
      </div>

      {/* top-right: theme + source */}
      <div className="absolute top-6 right-4 z-20 flex items-center gap-1 sm:right-8 md:gap-2">
        <SocialLinks size="sm" />
        <ThemeToggle />
      </div>

      {/* top-left: availability pill */}
      {profile.available && (
        <div className="absolute top-6 left-4 z-20 sm:left-6">
          <button
            onClick={() => goToChat('What are you looking for?')}
            className="relative flex cursor-pointer items-center gap-2 rounded-full border border-border bg-white/30 px-4 py-1.5 text-sm font-medium shadow-md backdrop-blur-lg transition hover:bg-white/60 dark:bg-neutral-900/60 dark:hover:bg-neutral-800"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <span className="hidden sm:inline">Open to ML / AI roles</span>
            <span className="sm:hidden">Hiring?</span>
          </button>
        </div>
      )}

      {/* header */}
      <motion.div
        className="z-10 mt-24 mb-8 flex flex-col items-center text-center md:mt-4 md:mb-10"
        variants={top}
        initial="hidden"
        animate="visible"
      >
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          Hey, I&apos;m {profile.shortName} Karri
        </h1>
        <p className="mt-3 text-sm text-muted md:text-base">
          {profile.role} · {profile.location}
        </p>
      </motion.div>

      {/* centre memoji */}
      <div className="relative z-10 h-52 w-52 sm:h-72 sm:w-72">
        <Image src="/memoji.png" alt={`${profile.name} memoji`} fill priority sizes="288px" className="object-contain" />
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
          <div className="mx-auto flex items-center rounded-full border border-neutral-200 bg-white/30 py-2.5 pr-2 pl-6 backdrop-blur-lg transition-all hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-neutral-600">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything…"
              aria-label="Ask me anything"
              className="w-full border-none bg-transparent text-base text-neutral-800 placeholder:text-neutral-500 focus:outline-none dark:text-neutral-200"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Submit question"
              className="flex cursor-pointer items-center justify-center rounded-full bg-[#0171E3] p-2.5 text-white transition-colors hover:bg-blue-600 disabled:opacity-70 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </form>

        <div className="mt-4 grid w-full max-w-2xl grid-cols-3 gap-3 md:grid-cols-5">
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
    </div>
  )
}
