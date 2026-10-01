'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'

// Placeholder for the ask box: each greeting pops up as a whole line (like the bubbles
// elsewhere), holds, then rolls up out of the way for the next one.
export function RollingGreeting({ lines, active }: { lines: string[]; active: boolean }) {
  const [i, setI] = useState(0)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (!active || reduced) return
    const t = setInterval(() => setI((n) => (n + 1) % lines.length), 3200)
    return () => clearInterval(t)
  }, [active, reduced, lines.length])

  return (
    <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 flex items-center overflow-hidden">
      <AnimatePresence mode="popLayout" initial={!reduced}>
        <motion.span
          key={i}
          className="font-display block origin-left text-lg whitespace-nowrap"
          initial={{ y: '110%', opacity: 0, scale: 0.85, filter: 'blur(4px)' }}
          animate={{ y: '0%', opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ y: '-110%', opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
          transition={{ type: 'spring', stiffness: 320, damping: 22 }}
        >
          {lines[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
