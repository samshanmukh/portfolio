'use client'

import { motion } from 'framer-motion'
import { Camera, Dumbbell } from 'lucide-react'
import { gym } from '../../lib/data'

// "What do you do for fun?" — the gym card, with a jump to the live trainer demo.
export function Gym({ onAsk }: { onAsk: (q: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full pt-6 pb-4"
    >
      <h2 className="text-3xl font-bold md:text-4xl">{gym.tagline}</h2>
      <div className="relative mt-6 overflow-hidden rounded-3xl bg-accent p-6 sm:p-10">
        <Dumbbell aria-hidden className="pointer-events-none absolute -top-6 -right-6 h-40 w-40 rotate-12 text-[#B95F9D]/15" />
        <p className="relative max-w-xl text-lg leading-relaxed">{gym.blurb}</p>
        <dl className="relative mt-8 grid gap-3 sm:grid-cols-3">
          {gym.stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-background p-4">
              <dt className="text-xs font-medium tracking-wide text-muted uppercase">{s.label}</dt>
              <dd className="mt-1 text-lg font-semibold">{s.value}</dd>
            </div>
          ))}
        </dl>
        <p className="relative mt-6 text-sm text-muted">yes, two of my projects are literally AI gym coaches.</p>
        <button
          onClick={() => onAsk('Try the AI trainer demo')}
          className="glass relative mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
        >
          <Camera className="h-4 w-4" /> Try the AI trainer
        </button>
      </div>
    </motion.div>
  )
}
