'use client'

import { useEffect, useState } from 'react'

// Types each phrase letter by letter, pauses, deletes it, then moves to the next (looping).
// Returns the static fallback when `active` is false or the visitor prefers reduced motion.
export function useTypewriter(phrases: string[], active: boolean, fallback: string) {
  const [text, setText] = useState('')
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  useEffect(() => {
    if (!active || reduced) return
    let phrase = 0
    let shown = 0
    let deleting = false
    let timer: ReturnType<typeof setTimeout>

    const tick = () => {
      const chars = Array.from(phrases[phrase]) // code points, so emoji type as one letter
      if (!deleting) {
        shown++
        setText(chars.slice(0, shown).join(''))
        if (shown >= chars.length) {
          deleting = true
          timer = setTimeout(tick, 1800)
          return
        }
        timer = setTimeout(tick, 75)
      } else {
        shown--
        setText(chars.slice(0, shown).join(''))
        if (shown <= 0) {
          deleting = false
          phrase = (phrase + 1) % phrases.length
          timer = setTimeout(tick, 400)
          return
        }
        timer = setTimeout(tick, 35)
      }
    }
    timer = setTimeout(tick, 600)
    return () => clearTimeout(timer)
  }, [active, reduced, phrases])

  if (!active || reduced) return fallback
  return text
}
