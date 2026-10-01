'use client'

import { motion, useReducedMotion } from 'framer-motion'

// Placeholder for the ask box: one line that pops up into place (like the bubbles elsewhere),
// with a hand that waves from the wrist when it appears and again every few seconds while idle.
export function RollingGreeting({ text, active }: { text: string; active: boolean }) {
  const reduced = useReducedMotion()

  return (
    <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 flex items-center overflow-hidden">
      <motion.span
        className="block origin-left whitespace-nowrap"
        initial={reduced ? false : { y: '110%', opacity: 0, scale: 0.85, filter: 'blur(4px)' }}
        animate={{ y: '0%', opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      >
        {text}{' '}
        <motion.span
          className="inline-block"
          style={{ transformOrigin: '70% 80%' }}
          animate={active && !reduced ? { rotate: [0, 16, -8, 16, -6, 12, 0] } : { rotate: 0 }}
          transition={
            active && !reduced
              ? { duration: 1.4, ease: 'easeInOut', delay: 0.35, repeat: Infinity, repeatDelay: 3 }
              : { duration: 0.3 }
          }
        >
          👋
        </motion.span>
      </motion.span>
    </span>
  )
}
