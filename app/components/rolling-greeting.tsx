'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'

export type GreetingLine = { text: string; wave?: boolean }

// Placeholder for the ask box: each line pops up whole (like the bubbles elsewhere), holds, then
// rolls up out of the way for the next. A line with `wave` gets a 👋 that waves from the wrist.
export function RollingGreeting({ lines, active }: { lines: GreetingLine[]; active: boolean }) {
  const [i, setI] = useState(0)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (!active || reduced) return
    const t = setInterval(() => setI((n) => (n + 1) % lines.length), 3200)
    return () => clearInterval(t)
  }, [active, reduced, lines.length])

  const line = lines[i]
  return (
    <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 flex items-center overflow-hidden">
      <AnimatePresence mode="popLayout" initial={!reduced}>
        <motion.span
          key={i}
          className="block origin-left whitespace-nowrap"
          initial={{ y: '110%', opacity: 0, scale: 0.85, filter: 'blur(4px)' }}
          animate={{ y: '0%', opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ y: '-110%', opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
          transition={{ type: 'spring', stiffness: 320, damping: 22 }}
        >
          {line.text}
          {line.wave && (
            <>
              {' '}
              <motion.span
                className="inline-block"
                style={{ transformOrigin: '70% 80%' }}
                animate={reduced ? undefined : { rotate: [0, 18, -8, 18, -6, 14, 0] }}
                transition={{ duration: 1.4, ease: 'easeInOut', delay: 0.3 }}
              >
                👋
              </motion.span>
            </>
          )}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
