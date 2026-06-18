/**
 * App backdrop — warm dark with a soft brown glow and a faint, static grid
 * that fades toward the page (styles in globals.css under .bg-app). Clean and
 * motionless on purpose.
 */
export function InteractiveBackground() {
  return <div aria-hidden className="bg-app" />
}
