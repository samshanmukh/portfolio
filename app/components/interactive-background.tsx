/**
 * Clean, flat dark backdrop — just a faint dotted grid for subtle texture.
 * (Previous ambient blobs / cursor glow removed.)
 */
export function InteractiveBackground() {
  return (
    <div aria-hidden className="bg-interactive">
      <div className="bg-grid" />
    </div>
  )
}
