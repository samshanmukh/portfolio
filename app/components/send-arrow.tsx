import { ArrowRight } from 'lucide-react'
import type { CSSProperties } from 'react'

// The send button's arrow. During a launch it holds a steady shine (on the arrow only: bold black in
// light mode, liquid-metal silver in dark) to catch the eye, then fades back to plain.
export function SendArrow({ shine, beam }: { shine: boolean; beam?: string }) {
  return (
    <span className="relative flex">
      <ArrowRight className="h-5 w-5" />
      {shine && (
        <svg aria-hidden viewBox="0 0 24 24" fill="none" className={`arrow-shine pointer-events-none absolute inset-0 h-5 w-5 ${beam ? 'tinted' : ''}`} style={beam ? ({ '--shine': beam, '--shine-glow': beam } as CSSProperties) : undefined}>
          {/* dark mode: libraries.dev/metal's silver (#E2E2E2 base, white highlight, a dark horizon band through the middle) */}
          <defs>
            <linearGradient id="arrow-chrome" gradientUnits="userSpaceOnUse" x1="12" y1="5" x2="12" y2="19">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.28" stopColor="#e2e2e2" />
              <stop offset="0.46" stopColor="#9a9a9a" />
              <stop offset="0.52" stopColor="#5c5c5c" />
              <stop offset="0.6" stopColor="#b4b4b4" />
              <stop offset="0.8" stopColor="#e2e2e2" />
              <stop offset="1" stopColor="#f7f7f7" />
            </linearGradient>
          </defs>
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      )}
    </span>
  )
}
