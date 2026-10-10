'use client'

import { motion } from 'framer-motion'
import { CalendarDays, Mail } from 'lucide-react'
import { socials } from '../../lib/data'

// "Can we meet?": a link to Sam's booking page. The visitor picks a slot and leaves their
// name and email there, and the meeting lands on Sam's calendar. The chat never sets a
// time or place itself. Without a booking page yet, it offers email instead.
export function Book() {
  const page = socials.booking
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="glass w-full max-w-sm rounded-3xl p-4"
    >
      <div className="flex items-center gap-3">
        <div className="glass flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
          {page ? <CalendarDays className="h-5 w-5 text-[#4285F4]" /> : <Mail className="h-5 w-5 text-[#EA4335]" />}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold">{page ? 'Book a time with me' : 'Set up a time'}</h3>
          <p className="text-xs text-muted">
            {page ? 'Pick a slot, add your name and email, done.' : "Email me and we'll find a slot."}
          </p>
        </div>
      </div>
      <a
        href={page || `mailto:${socials.email}?subject=${encodeURIComponent("Let's meet")}`}
        target={page ? '_blank' : undefined}
        rel="noopener noreferrer"
        className="glass tap relative mt-3 block w-full rounded-full py-2.5 text-center text-sm font-medium"
      >
        {page ? 'Pick a time' : 'Email me'}
      </a>
    </motion.div>
  )
}
