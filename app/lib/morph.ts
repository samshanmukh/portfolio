// Home → chat without a page jump: the browser's View Transitions API snapshots home, Next renders
// chat underneath, and the shared pieces (avatar, ask box, social row) glide from their home spots to
// their chat spots while everything else cross-fades. Falls back to a plain navigation where the API
// isn't available or the visitor prefers reduced motion.
type Router = { push: (url: string) => void }

let arrive: (() => void) | null = null
let active = false

/** true while a home → chat morph is running, so chat can skip its own entrance animations */
export const morphing = () => active

export function morphTo(router: Router, url: string) {
  const doc = document as Document & { startViewTransition?: (cb: () => Promise<void>) => { finished: Promise<void> } }
  if (!doc.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    router.push(url)
    return
  }
  active = true
  const vt = doc.startViewTransition(
    () =>
      new Promise<void>((resolve) => {
        arrive = resolve
        router.push(url)
        setTimeout(resolve, 2000) // never hold the page frozen if chat is slow to show up
      }),
  )
  vt.finished.finally(() => {
    active = false
    arrive = null
  })
}

/** chat calls this once it has painted its first frame, so the browser can take the "after" snapshot */
export function morphArrived() {
  arrive?.()
  arrive = null
}
