'use client'

import { motion } from 'framer-motion'
import { Quote } from 'lucide-react'
import { socials, testimonials } from '../../lib/data'

// "What do people say?" — LinkedIn recommendations.
export function Testimonials() {
  return (
    <div className="w-full pt-6 pb-4">
      <h2 className="text-3xl font-bold md:text-4xl">What people say</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <motion.figure
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.1 * i } }}
            className="flex flex-col rounded-2xl bg-accent p-5"
          >
            <Quote className="h-6 w-6 text-primary" />
            <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-foreground/85">
              {t.quote}
            </blockquote>
            <figcaption className="mt-4 border-t border-border pt-3">
              <div className="text-sm font-semibold">{t.name}</div>
              <div className="text-xs text-muted">{t.title}</div>
            </figcaption>
          </motion.figure>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted">
        Recommendations from LinkedIn · more on{' '}
        <a href={socials.linkedin} target="_blank" rel="noopener noreferrer" className="tap relative text-primary hover:underline">
          my profile ↗
        </a>
      </p>
    </div>
  )
}
