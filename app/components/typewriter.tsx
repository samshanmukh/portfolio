'use client'

import { useEffect, useState } from 'react'

/** Types out `text` one character at a time, then shows a blinking cursor. */
export function Typewriter({
  text,
  speed = 55,
  className = '',
}: {
  text: string
  speed?: number
  className?: string
}) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (count >= text.length) return
    const t = setTimeout(() => setCount((c) => c + 1), speed)
    return () => clearTimeout(t)
  }, [count, text.length, speed])

  return (
    <span className={className}>
      {text.slice(0, count)}
      <span className="cursor" aria-hidden />
    </span>
  )
}
