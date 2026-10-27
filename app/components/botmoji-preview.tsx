'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { drawBotmoji, loadBotmojiArtwork } from '../lib/botmoji-render'
import { botmojiFrame, botmojiTapMotion, BOTMOJI_TAP_SECONDS } from '../lib/botmoji-motion'
import { BOTMOJI_STATES, type BotmojiConfig } from '../lib/botmoji'

export function BotmojiPreview({ config, state, compact = false, paused = false, onError }: { config: BotmojiConfig; state?: number; compact?: boolean; paused?: boolean; onError?: (error: string) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const elapsed = useRef(0)
  const previousMode = useRef(state)
  const tapStarted = useRef(-Infinity)
  const [tapVersion, setTapVersion] = useState(0)
  function jump() {
    const now = performance.now()
    // As in Zup, a rapid second tap cannot interrupt the airborne turn.
    if (now-tapStarted.current < BOTMOJI_TAP_SECONDS*0.6*1000) return
    tapStarted.current = now
    setTapVersion((value) => value+1)
  }
  useEffect(() => {
    if (!canvas.current) return
    if (previousMode.current !== state) elapsed.current = 0
    previousMode.current = state
    const animating = !reduced && !compact && !paused
    let raf = 0
    let cancelled = false
    let last = performance.now()
    let lastPaint = -Infinity
    const draw = (now: number) => {
      if (!canvas.current) return
      try {
        if (animating) elapsed.current += Math.max(0, Math.min(now - last, 100)) / 1000
        last = now
        const tap = botmojiTapMotion((now-tapStarted.current)/1000,tapVersion%2 ? -1 : 1,!!reduced)
        if (now - lastPaint >= 1000 / 30 || (!animating && !tap.active)) {
          const pose = botmojiFrame(reduced || compact ? 0 : elapsed.current, state)
          drawBotmoji(canvas.current, config, pose.state, pose.seconds, compact, !reduced && !compact,tap)
          lastPaint = now
        }
        if (animating || tap.active) raf = requestAnimationFrame(draw)
      } catch { onError?.('The character could not render. Please try another variation.') }
    }
    loadBotmojiArtwork().then(() => {
      if (cancelled) return
      last = performance.now()
      draw(last)
    }).catch(() => { if (!cancelled) onError?.('The plush artwork could not load. Please try again.') })
    return () => { cancelled = true; cancelAnimationFrame(raf) }
  }, [config, state, reduced, compact, paused, onError, tapVersion])
  return <button type="button" onClick={jump} aria-label={`Make ${config.name}'s bot moji ${reduced ? 'smile' : 'jump and spin'}`} title={reduced ? 'Tap for a smile' : 'Tap to jump and spin'} className={`block w-full touch-manipulation cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${compact ? 'rounded-xl' : 'rounded-[22px]'}`}><canvas ref={canvas} width={compact ? 192 : 480} height={compact ? 192 : 480} role="img" aria-label={`${config.name}'s unique fluffy bot moji${compact ? '' : paused ? ', expression paused' : state === undefined ? ', cycling through four animated expressions' : `, animated ${BOTMOJI_STATES[state].toLowerCase()} expression`}`} className={`block aspect-square w-full ${compact ? '' : 'rounded-[22px] bg-black/70 dark:bg-black/25'}`} /></button>
}
