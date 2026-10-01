'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState, type ReactNode } from 'react'
import { profile } from '../lib/data'

// Logo button that opens a short "what is this?" dialog (like the reference).
export function WelcomeModal({ trigger }: { trigger?: ReactNode }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="cursor-pointer rounded-2xl bg-white/30 p-2 shadow-lg backdrop-blur-lg transition-colors hover:bg-white/60 dark:bg-neutral-900/60 dark:hover:bg-neutral-800"
        >
          <Image
            src="/icon.jpg"
            alt=""
            width={40}
            height={40}
            unoptimized
            className="h-9 w-9 rounded-xl object-cover md:h-10 md:w-10"
          />
          <span className="sr-only">About this portfolio</span>
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="welcome-title"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-2xl bg-background p-4 py-6 shadow-xl md:p-8"
            >
              <div className="flex items-start justify-between gap-4 px-2 md:px-0">
                <h2 id="welcome-title" className="text-2xl font-bold tracking-tight md:text-4xl">
                  Welcome to {profile.shortName}&apos;s AI portfolio
                </h2>
                <button
                  onClick={() => setOpen(false)}
                  className="cursor-pointer rounded-full bg-foreground p-2 text-background hover:opacity-90"
                >
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close</span>
                </button>
              </div>

              <section className="mt-6 space-y-6 rounded-2xl bg-accent p-6 md:p-8">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">What&apos;s this?</h3>
                  <p className="leading-relaxed text-foreground/80">
                    Instead of a wall of sections, this portfolio <strong>talks back</strong>.
                    Recruiter, fellow engineer, or just curious — ask whatever you want to know
                    about me and my work.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">How does it work?</h3>
                  <p className="leading-relaxed text-foreground/80">
                    Quick answers are instant and work on any device. Flip on{' '}
                    <strong>⚡ smart mode</strong> in the chat to load a small language model that
                    runs <strong>entirely in your browser</strong> — no server, no API key.
                  </p>
                </div>
              </section>

              <div className="mt-6 flex flex-col items-center gap-4">
                <button
                  onClick={() => setOpen(false)}
                  className="cursor-pointer rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90"
                >
                  Start chatting
                </button>
                <p className="text-center text-sm text-muted">
                  Hand-coded from scratch, no templates.{' '}
                  <a href="/chat?query=How%20can%20I%20reach%20you%3F" className="text-primary hover:underline">
                    Contact me.
                  </a>
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
