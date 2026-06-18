import { MatrixRain } from './matrix-rain'

/**
 * Backdrop — subtle Matrix digital rain (masked to the side gutters) plus
 * very faint CRT scanlines, on a flat dark base.
 */
export function InteractiveBackground() {
  return (
    <div aria-hidden className="bg-interactive">
      <MatrixRain />
      <div className="bg-scanlines" />
    </div>
  )
}
