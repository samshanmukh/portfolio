'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Star } from 'lucide-react'
import { useRef } from 'react'
import { projects, socials } from '../../lib/data'

// Card backdrops (no screenshots in the data, so each card gets its own gradient).
const gradients = [
  'from-[#1e3a8a] via-[#2563eb] to-[#60a5fa]',
  'from-[#14532d] via-[#16a34a] to-[#86efac]',
  'from-[#4c1d95] via-[#7c3aed] to-[#c4b5fd]',
  'from-[#7c2d12] via-[#ea580c] to-[#fdba74]',
  'from-[#134e4a] via-[#0d9488] to-[#5eead4]',
  'from-[#831843] via-[#db2777] to-[#f9a8d4]',
]

// "What have you built?" — horizontal card carousel, like the reference.
export function Projects() {
  const rail = useRef<HTMLDivElement>(null)
  const scroll = (dir: 1 | -1) =>
    rail.current?.scrollBy({ left: dir * (rail.current.clientWidth * 0.8), behavior: 'smooth' })

  return (
    <div className="w-full pt-6">
      <h2 className="text-xl font-bold md:text-3xl">My Projects</h2>

      <div
        ref={rail}
        className="no-scrollbar flex w-full snap-x snap-mandatory gap-4 overflow-x-auto py-8"
      >
        {projects.map((p, i) => (
          <motion.a
            key={p.name}
            href={p.href}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.1 * i } }}
            className={`group relative flex h-96 w-64 shrink-0 snap-start flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br p-6 text-white md:h-[26rem] md:w-80 ${gradients[i % gradients.length]}`}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60" />
            <div className="relative">
              <div className="flex items-center gap-2">
                <p className="text-left text-sm font-medium text-white/80">{p.tags.join(' · ')}</p>
              </div>
              <p className="mt-2 max-w-xs text-left text-xl font-semibold [text-wrap:balance] md:text-3xl">
                {p.name}
              </p>
              {p.featured && (
                <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium backdrop-blur">
                  <Star className="h-3 w-3" /> Featured
                </span>
              )}
            </div>
            <div className="relative">
              <p className="text-sm leading-relaxed text-white/90">{p.blurb}</p>
              {p.metric && <p className="mt-2 text-xs font-semibold">↑ {p.metric}</p>}
              <div className="mt-4 flex items-center gap-3 text-sm font-medium">
                {p.demo && <span className="underline-offset-4">demo ↗</span>}
                <span className="underline-offset-4 group-hover:underline">code ↗</span>
              </div>
            </div>
          </motion.a>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <a
          href={socials.github}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          70+ more repositories on GitHub ↗
        </a>
        <div className="flex gap-2">
          <button
            onClick={() => scroll(-1)}
            aria-label="Previous projects"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-accent transition hover:opacity-80"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => scroll(1)}
            aria-label="More projects"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-accent transition hover:opacity-80"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
