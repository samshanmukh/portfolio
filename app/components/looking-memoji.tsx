'use client'

import { motion, useAnimationControls, useReducedMotion } from 'framer-motion'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'

// How long the memoji keeps looking at the input after the last keystroke / focus.
const IDLE_MS = 1600

// Wire these into an input: the memoji looks down while someone is typing and
// eases back to neutral after a short pause or when the input loses focus.
export function useTypingGaze() {
  const [looking, setLooking] = useState(false)
  const [keystrokes, setKeystrokes] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const glance = useCallback(() => {
    setLooking(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setLooking(false), IDLE_MS)
  }, [])

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  return {
    looking,
    keystrokes,
    onFocus: glance,
    onType: () => {
      glance()
      setKeystrokes((k) => k + 1)
    },
    onBlur: () => {
      if (timer.current) clearTimeout(timer.current)
      setLooking(false)
    },
  }
}

// The memoji is a flat image, so the head turn is faked: tilt it back in 3D around the
// neck (top away from the viewer reads as "looking down"), drop it a touch, and nod a
// little on every keystroke.
export function LookingMemoji({
  looking,
  keystrokes,
  alt,
  sizes,
  priority,
}: {
  looking: boolean
  keystrokes: number
  alt: string
  sizes: string
  priority?: boolean
}) {
  const reduced = useReducedMotion()
  const nod = useAnimationControls()

  useEffect(() => {
    if (reduced || keystrokes === 0) return
    nod.start({ rotateX: [0, 7, 0], transition: { duration: 0.28, ease: 'easeOut' } })
  }, [keystrokes, reduced, nod])

  return (
    <div className="relative h-full w-full" style={{ perspective: 600 }}>
      <motion.div
        className="relative h-full w-full"
        style={{ transformOrigin: '50% 80%' }}
        animate={
          looking && !reduced
            ? { rotateX: 16, y: '3%', scale: 0.98 }
            : { rotateX: 0, y: '0%', scale: 1 }
        }
        transition={{ type: 'spring', stiffness: 170, damping: 18 }}
      >
        <motion.div className="relative h-full w-full" style={{ transformOrigin: '50% 80%' }} animate={nod}>
          <Image src="/memoji.png" alt={alt} fill sizes={sizes} priority={priority} className="object-contain" />
        </motion.div>
      </motion.div>
    </div>
  )
}
