import { ZodiacStars } from './zodiac-stars'

/**
 * App backdrop — dark warm base with a soft glow (.bg-app in globals.css)
 * and faint, dynamic zodiac constellations.
 */
export function InteractiveBackground() {
  return (
    <div aria-hidden className="bg-app">
      <ZodiacStars />
    </div>
  )
}
