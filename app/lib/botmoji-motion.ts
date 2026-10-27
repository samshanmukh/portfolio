// A shared clock for the live canvas, embeds, and GIF frames. Every expression
// is a deterministic function of time, so seeking/exporting never changes it.
export const BOTMOJI_MODE_SECONDS = [2.4, 3.2, 3.6, 3.2] as const
export const BOTMOJI_LOOP_SECONDS = BOTMOJI_MODE_SECONDS.reduce((sum, duration) => sum + duration, 0)
export const BOTMOJI_GIF_FRAME_MS = 100

const cycle = (seconds: number, duration: number) => ((seconds % duration) + duration) % duration
const smooth = (from: number, to: number, value: number) => {
  const t = Math.max(0, Math.min(1, (value - from) / (to - from)))
  return t * t * (3 - 2 * t)
}
const blinkAt = (time: number, center: number, width: number) => {
  const distance = Math.abs(time - center) / (width / 2)
  return distance >= 1 ? 0 : (1 + Math.cos(distance * Math.PI)) / 2
}

export type BotmojiMotion = {
  gazeX: number
  gazeY: number
  blink: number
  eyeOpen: number
  browLift: number
  furrow: number
  smile: number
  mouthOpen: number
  heat: number
  tilt: number
  bob: number
  breath: number
}

export function botmojiFrame(elapsed: number, selectedMode?: number) {
  const safeTime = Number.isFinite(elapsed) ? elapsed : 0
  if (selectedMode !== undefined) {
    const state = Number.isInteger(selectedMode) && selectedMode >= 0 && selectedMode < 4 ? selectedMode : 0
    return { state, seconds: cycle(safeTime, BOTMOJI_MODE_SECONDS[state]) }
  }
  let seconds = cycle(safeTime, BOTMOJI_LOOP_SECONDS)
  for (let state = 0; state < 4; state++) {
    if (seconds < BOTMOJI_MODE_SECONDS[state] - 1e-9 || state === 3) return { state, seconds }
    seconds = Math.max(0, seconds - BOTMOJI_MODE_SECONDS[state])
  }
  return { state: 0, seconds: 0 }
}

export function botmojiMotion(state: number, seconds: number, animate = true): BotmojiMotion {
  const mode = Number.isInteger(state) && state >= 0 && state < 4 ? state : 0
  const duration = BOTMOJI_MODE_SECONDS[mode]
  const time = cycle(Number.isFinite(seconds) ? seconds : 0, duration)
  const p = time / duration
  const wave = Math.sin(p * Math.PI * 2)
  const motion: BotmojiMotion = {
    gazeX: 0, gazeY: 0, blink: 0, eyeOpen: 1, browLift: 0,
    furrow: 0, smile: 0.28, mouthOpen: 0, heat: 0,
    tilt: 0, bob: 0, breath: animate ? wave * 0.008 : 0,
  }
  if (!animate) {
    if (mode === 1) Object.assign(motion, { gazeX: 5, gazeY: -4, browLift: 5 })
    if (mode === 2) Object.assign(motion, { gazeY: 4, eyeOpen: 0.72, browLift: -3, furrow: 0.95, heat: 0.6, smile: 0.05 })
    if (mode === 3) Object.assign(motion, { smile: 1, mouthOpen: 0.95, browLift: 4 })
    return motion
  }
  if (mode === 0) {
    motion.gazeX = wave * 0.8
    motion.blink = blinkAt(time, 1.8, 0.28)
  } else if (mode === 1) {
    motion.gazeX = 4 + wave * 3
    motion.gazeY = -4 + Math.sin(p * Math.PI * 4) * 1.5
    motion.browLift = 5 + wave * 2
    motion.blink = Math.max(blinkAt(time, 0.8, 0.32), blinkAt(time, 1.2, 0.3), blinkAt(time, 2.7, 0.3))
    motion.tilt = wave * 0.018
    motion.bob = Math.sin(p * Math.PI * 4) * 1.5
  } else if (mode === 2) {
    // Deliberate left/right reading, a concentrated squint, moving brows,
    // and a warm forehead pulse that cools before this mode repeats.
    const focus = Math.sin(p * Math.PI)
    motion.gazeX = Math.sin(p * Math.PI * 4) * 7
    motion.gazeY = 4 + Math.sin(p * Math.PI * 6) * 1.5
    motion.eyeOpen = 0.74 - focus * 0.1
    motion.browLift = -3 - focus * 2
    motion.furrow = 0.72 + focus * 0.35 + Math.sin(p * Math.PI * 6) * 0.08
    motion.blink = blinkAt(time, 2.7, 0.28)
    motion.smile = 0.05
    motion.heat = Math.max(0, focus * (0.78 + Math.sin(p * Math.PI * 6) * 0.12))
    motion.tilt = Math.sin(p * Math.PI * 4) * 0.009
    motion.bob = Math.sin(p * Math.PI * 6) * focus
  } else {
    // A closed-mouth smile grows into a wide, open grin, holds, then closes
    // gently so the next repetition starts from the same closed-mouth pose.
    const grin = smooth(0.1, 0.4, p) * (1 - smooth(0.78, 1, p))
    motion.smile = 0.28 + grin * 0.72
    motion.mouthOpen = grin * (0.94 + Math.sin(p * Math.PI * 8) * 0.05)
    motion.eyeOpen = 1 - grin * 0.12
    motion.browLift = grin * 4
    motion.blink = blinkAt(time, 2.4, 0.26)
    motion.bob = -Math.sin(p * Math.PI * 2) * grin * 2
  }
  return motion
}

// Match Fenn's tap in Zup: .24s crouch, .68s airborne full turn,
// .24s landing pulse, then hold the happy face briefly after landing.
export const BOTMOJI_TAP_SECONDS = 1.21
export const BOTMOJI_TAP_SMILE_SECONDS = 2.31
export type BotmojiTapMotion = {
  active: boolean
  y: number
  yaw: number
  roll: number
  scaleX: number
  scaleY: number
  zoom: number
  smile: number
}
export function botmojiTapMotion(seconds: number, side = 1, reduced = false): BotmojiTapMotion {
  const pose: BotmojiTapMotion = { active: false, y: 0, yaw: 0, roll: 0, scaleX: 1, scaleY: 1, zoom: 1, smile: 0 }
  if (!Number.isFinite(seconds) || seconds < 0 || seconds >= BOTMOJI_TAP_SMILE_SECONDS) return pose
  pose.active = true
  if (reduced) { pose.smile = 1; return pose }
  const air = (seconds - 0.24) / 0.68
  const q = Math.max(0, Math.min(1, air))
  const arc = Math.sin(Math.PI * q)
  const landTime = seconds - 0.92
  let squash = 0
  if (air < 0) squash = smooth(0,0.24,seconds)
  else if (landTime > 0 && landTime < 0.24) {
    const u = landTime / 0.24, k = 7*u
    const tail = 1-smooth(0.85,1,u)
    squash = k*k*Math.exp(2-k)/4*tail
  } else if (air < 0.2) squash = Math.exp(-((air/0.11)**2))
  pose.y = -78 * arc
  pose.yaw = Math.PI*2*smooth(0,1,q)
  pose.roll = (side < 0 ? -1 : 1)*Math.PI/30*arc
  pose.scaleX = 1+0.16*squash*1.15-0.06*arc
  pose.scaleY = 1-0.18*squash*1.15+0.09*arc
  // A camera pullback keeps the fluffy tuft inside the preview during
  // the jump while the ground/name labels stay fixed.
  pose.zoom = 1-0.3*arc
  pose.smile = seconds < 0.92 ? arc : 1-smooth(2.01,2.31,seconds)
  return pose
}

// Finish the exported expressions with the same performance as a tap. Sample
// the brief turn at 20fps, then settle to the exact opening pose for the loop.
export const BOTMOJI_GIF_JUMP_SECONDS = 2.6
export const BOTMOJI_GIF_JUMP_FRAME_MS = 50
export type BotmojiGifFrame = { state: number; seconds: number; delay: number; tap?: BotmojiTapMotion }
export function botmojiGifTimeline(): BotmojiGifFrame[] {
  const expressions = Array.from({ length: Math.round(BOTMOJI_LOOP_SECONDS*1000/BOTMOJI_GIF_FRAME_MS) }, (_,frame) => ({
    ...botmojiFrame(frame*BOTMOJI_GIF_FRAME_MS/1000), delay: BOTMOJI_GIF_FRAME_MS,
  }))
  const jump = Array.from({ length: Math.round(BOTMOJI_GIF_JUMP_SECONDS*1000/BOTMOJI_GIF_JUMP_FRAME_MS) }, (_,frame) => ({
    state: 0, seconds: 0, delay: BOTMOJI_GIF_JUMP_FRAME_MS,
    tap: botmojiTapMotion(frame*BOTMOJI_GIF_JUMP_FRAME_MS/1000),
  }))
  return [...expressions,...jump]
}
