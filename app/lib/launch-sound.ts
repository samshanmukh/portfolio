// A soft launch sound made in code (Web Audio, no audio file): a gentle pop as the arrow appears,
// then a quiet two-note shimmer as the beam runs along it. Browsers often block sound until the
// visitor has interacted with the site; in that case this stays silent.
export function playLaunchSound(popAt = 0.3, shimmerAt = 0.45) {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const play = () => {
      const t0 = ctx.currentTime
      const out = ctx.createGain()
      out.gain.value = 0.5
      out.connect(ctx.destination)

      // pop: a short sine that drops in pitch
      const pop = ctx.createOscillator()
      const popGain = ctx.createGain()
      pop.type = 'sine'
      pop.frequency.setValueAtTime(520, t0 + popAt)
      pop.frequency.exponentialRampToValueAtTime(170, t0 + popAt + 0.12)
      popGain.gain.setValueAtTime(0.0001, t0 + popAt)
      popGain.gain.exponentialRampToValueAtTime(0.22, t0 + popAt + 0.01)
      popGain.gain.exponentialRampToValueAtTime(0.0001, t0 + popAt + 0.16)
      pop.connect(popGain).connect(out)
      pop.start(t0 + popAt)
      pop.stop(t0 + popAt + 0.2)

      // shimmer: two soft bell-like notes rising, following the beam
      ;[
        [1318.5, 0],
        [1975.5, 0.09],
      ].forEach(([freq, delay]) => {
        const start = t0 + shimmerAt + delay
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq * 0.985, start)
        osc.frequency.exponentialRampToValueAtTime(freq, start + 0.15)
        g.gain.setValueAtTime(0.0001, start)
        g.gain.exponentialRampToValueAtTime(0.06, start + 0.03)
        g.gain.exponentialRampToValueAtTime(0.0001, start + 0.9)
        osc.connect(g).connect(out)
        osc.start(start)
        osc.stop(start + 1)
      })
      setTimeout(() => ctx.close().catch(() => {}), (shimmerAt + 1.5) * 1000)
    }
    if (ctx.state === 'running') return play()
    // blocked until the visitor interacts: try once, and stay silent if the browser says no
    ctx
      .resume()
      .then(() => (ctx.state === 'running' ? play() : ctx.close()))
      .catch(() => ctx.close().catch(() => {}))
    setTimeout(() => {
      if (ctx.state !== 'running') ctx.close().catch(() => {})
    }, 300)
  } catch {
    // no sound, no problem
  }
}
