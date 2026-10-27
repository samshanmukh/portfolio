import { botmojiGifTimeline, botmojiMotion, type BotmojiMotion, type BotmojiTapMotion } from './botmoji-motion'
import { BOTMOJI_ROLES, BOTMOJI_STATES, type BotmojiConfig } from './botmoji'
import { BOTMOJI_ARTWORK_URL, botmojiArtwork, botmojiArtworkPose } from './botmoji-artwork'
import { drawBotmojiTurn } from './botmoji-volume'

const SIZE = 480
const TILE = 256
let artwork: HTMLImageElement | undefined
let artworkPromise: Promise<void> | undefined
export function loadBotmojiArtwork(): Promise<void> {
  if (artwork) return Promise.resolve()
  if (!artworkPromise) artworkPromise = new Promise<void>((resolve, reject) => {
    const image = new Image()
    image.onload = () => { artwork = image; resolve() }
    image.onerror = () => { artworkPromise = undefined; reject(new Error('The plush artwork could not load.')) }
    image.src = BOTMOJI_ARTWORK_URL
  })
  return artworkPromise
}
function hsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r,g,b), min = Math.min(r,g,b), delta = max - min
  const l = (max + min) / 2
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))
  const h = delta === 0 ? 0 : max === r ? ((g - b) / delta + 6) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4
  return [h / 6, s, l]
}
function rgb(h: number, s: number, l: number) {
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => { const k = (n + h * 12) % 12; return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) }
  return [f(0), f(8), f(4)]
}
const colorHsl = (color: string) => hsl(...[1,3,5].map((at) => parseInt(color.slice(at, at + 2), 16)) as [number,number,number])
type Pose = ReturnType<typeof botmojiArtworkPose>
type Raster = { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; base: ImageData; frame: ImageData; pose: Pose }
const rasters = new Map<string, Raster>()
function cleanCutout(pixels: Uint8ClampedArray) {
  // The supplied sheet contains detached white/chroma-key flecks. Keep the
  // connected plush silhouette, including its translucent wisps, and remove
  // the bright matte residue without touching the enclosed eye highlights.
  const background = new Uint8Array(TILE*TILE)
  const queue = new Int32Array(TILE*TILE)
  let read = 0, write = 0
  const isMatte = (p: number) => {
    const at = p*4, r = pixels[at], g = pixels[at+1], b = pixels[at+2]
    const max = Math.max(r,g,b), min = Math.min(r,g,b)
    return pixels[at+3] < 8 || (min > 237 && max-min < 17) || (max > 235 && min < 25 && max-min > 215)
  }
  const add = (p: number) => { if (!background[p] && isMatte(p)) { background[p] = 1; queue[write++] = p } }
  for (let n = 0; n < TILE; n++) { add(n); add((TILE-1)*TILE+n); add(n*TILE); add(n*TILE+TILE-1) }
  while (read < write) {
    const p = queue[read++], x = p%TILE, y = Math.floor(p/TILE)
    if (x) add(p-1); if (x<TILE-1) add(p+1); if (y) add(p-TILE); if (y<TILE-1) add(p+TILE)
  }
  const body = new Uint8Array(TILE*TILE)
  read = 0; write = 0
  const keep = (p: number) => { if (!body[p] && !background[p] && pixels[p*4+3] >= 8) { body[p] = 1; queue[write++] = p } }
  keep(220*TILE+128)
  while (read < write) {
    const p = queue[read++], x = p%TILE, y = Math.floor(p/TILE)
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (x+dx>=0 && x+dx<TILE && y+dy>=0 && y+dy<TILE) keep(p+dy*TILE+dx)
    }
  }
  for (let p = 0; p < body.length; p++) if (!body[p]) pixels[p*4+3] = 0
}
function plushRaster(config: BotmojiConfig, state: number): Raster {
  if (!artwork) throw new Error('The plush artwork is still loading.')
  const d = config.design
  const family = botmojiArtwork(config.role, d.seed, d.artwork)
  const key = [family, state, d.fur, d.secondary, d.accent].join(':')
  const cached = rasters.get(key)
  if (cached) return cached
  const pose = botmojiArtworkPose(family, state)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = TILE
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(artwork, pose.sx, pose.sy, pose.sw, pose.sh, pose.x, pose.y, pose.width, pose.height)
  const base = ctx.getImageData(0, 0, TILE, TILE)
  cleanCutout(base.data)
  const primary = colorHsl(d.fur), secondary = colorHsl(d.secondary), accent = colorHsl(d.accent)
  // Recolor fur only: the original eye reflections, brows, and mouth keep their
  // source colors. Luminance variation preserves the photographed fur fibers.
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const i = (y * TILE + x) * 4
    if (base.data[i + 3] === 0) continue
    const [nativeHue, saturation, light] = hsl(base.data[i],base.data[i+1],base.data[i+2])
    const nativeFurHue = [0.1,0.11,0.79,0.16,0.04,0.6][family]
    const hueDistance = Math.min(Math.abs(nativeHue-nativeFurHue),1-Math.abs(nativeHue-nativeFurHue))
    const inEye = pose.eyes.some(([ex,ey],side) => ((x-ex)/(pose.eyeRadius*(state===1 && side===1 ? 0.76 : 1)))**2 + ((y-ey)/(pose.eyeHeight*0.97))**2 < 1)
    const inMouth = ((x-pose.mouth[0])/(pose.mouthRadius*1.05))**2 + ((y-pose.mouth[1])/(state === 3 ? 16 : 5))**2 < 1
    const protectedFace = (inEye && (light < 0.65 || hueDistance > 0.12 || light > 0.89)) || (inMouth && light < 0.65)
    if (protectedFace) continue
    // Dark facial lines remain untouched, including the source eyebrows.
    if (light < 0.27) continue
    const patch = Math.max(0, 1 - Math.hypot((x - 72) / 65, (y - 183) / 53)) * 0.28
    const tuft = Math.max(0,1-Math.hypot((x-142)/60,(y-55)/70))*0.14
    const hueBase = primary[0] + ((((secondary[0] - primary[0]) + 1.5) % 1) - 0.5) * patch
    const hue = hueBase + ((((accent[0]-hueBase)+1.5)%1)-0.5)*tuft
    const sat = ((primary[1] * (1-patch) + secondary[1] * patch)*(1-tuft)+accent[1]*tuft) * (0.74 + saturation * 0.28)
    const luminance = Math.max(0,Math.min(1, light + (primary[2] - 0.73) * 0.32))
    const tinted = rgb((hue+1)%1, Math.min(0.75,sat), luminance)
    for (let c = 0; c < 3; c++) base.data[i+c] = tinted[c]
  }
  const raster = { canvas, ctx, base, frame: ctx.createImageData(TILE,TILE), pose }
  if (rasters.size >= 40) rasters.delete(rasters.keys().next().value!)
  rasters.set(key,raster)
  return raster
}
// Inverse piecewise mapping compresses existing eye/mouth pixels and pulls in
// surrounding fur. The boundary is fixed, avoiding seams or painted-on lids.
function featureAxis(distance: number, radius: number, scale: number) {
  const outer = radius * 2.1, inner = radius * scale, absolute = Math.abs(distance)
  if (absolute >= outer) return distance
  const mapped = absolute < inner ? absolute / scale : radius + (absolute - inner) * (outer - radius) / (outer - inner)
  return Math.sign(distance) * mapped
}
function falloff(value: number, radius: number) { const t = Math.max(0, 1 - (value/radius)**2); return t*t }
function animatePlush(raster: Raster, state: number, motion: BotmojiMotion) {
  const {base, frame, pose, ctx, canvas} = raster
  const source = base.data, out = frame.data
  out.set(source)
  const cx = (pose.eyes[0][0] + pose.eyes[1][0]) / 2
  const forehead = Math.min(pose.eyes[0][1],pose.eyes[1][1]) - 47
  for (let y = Math.max(0,Math.floor(forehead - 55)); y < Math.min(TILE,pose.mouth[1] + 40); y++) {
    for (let x = Math.max(0,Math.floor(pose.eyes[0][0] - 48)); x < Math.min(TILE,pose.eyes[1][0] + 48); x++) {
      const i = (y*TILE+x)*4
      if (!source[i+3]) continue
      let sx = x, sy = y
      for (const [ex,ey] of pose.eyes) {
        const dx = x-ex, dy = y-ey
        const edge = falloff(dx,pose.eyeRadius*1.55)
        const blinkScale = Math.max(0.025, (1 - motion.blink * 0.975) * (state === 2 ? 0.95 : 1))
        sy += (featureAxis(dy,pose.eyeHeight,blinkScale)-dy)*edge
        const gaze = edge * falloff(dy,pose.eyeHeight*1.5)
        sx -= motion.gazeX * 0.22 * gaze
        sy -= motion.gazeY * 0.12 * gaze
        const brow = edge * falloff(y - (ey - 31), 13)
        sy += (state === 2 ? Math.sin(motion.furrow*9) * 2 : -motion.browLift*0.2) * brow
      }
      if (state === 3) {
        const dx = x-pose.mouth[0], dy = y-pose.mouth[1]
        const edge = falloff(dx,pose.mouthRadius*1.75)
        sy += (featureAxis(dy,15,0.055 + motion.mouthOpen*0.945)-dy)*edge
      }
      // Bilinear resampling keeps the source fur and eye highlights soft while
      // gaze, lids, eyebrows and the smile deform continuously.
      sx = Math.max(0,Math.min(TILE-1.001,sx)); sy = Math.max(0,Math.min(TILE-1.001,sy))
      const ix = Math.floor(sx), iy = Math.floor(sy), fx = sx-ix, fy = sy-iy
      const at = (iy*TILE+ix)*4
      const heat = Math.exp(-((x-cx)**2/1900 + (y-forehead)**2/1100)) * motion.heat * 0.57
      for (let c = 0; c < 4; c++) {
        const top = source[at+c]*(1-fx) + source[at+4+c]*fx
        const bottom = source[at+TILE*4+c]*(1-fx) + source[at+TILE*4+4+c]*fx
        const pixel = top*(1-fy) + bottom*fy
        out[i+c] = c === 3 ? pixel : pixel*(1-heat) + [255,67,77][c]*heat
      }
    }
  }
  ctx.putImageData(frame,0,0)
  return canvas
}

export function drawBotmoji(canvas: HTMLCanvasElement, config: BotmojiConfig, state: number, seconds = 0, compact = false, animate = true, tap?: BotmojiTapMotion) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Your browser could not create the preview.')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  const motion = botmojiMotion(state, seconds, animate)
  const poseState = tap && tap.smile > 0.001 ? 3 : state
  if (poseState !== state || (tap && tap.smile > 0.001)) {
    motion.mouthOpen = (tap?.smile ?? 0)*0.95
    motion.smile = Math.max(motion.smile,tap?.smile ?? 0)
    motion.heat = 0
  }
  const raster = plushRaster(config,poseState)
  const image = animatePlush(raster,poseState,motion)
  ctx.save(); ctx.scale(canvas.width / SIZE, canvas.height / SIZE)
  ctx.save()
  if (compact) { ctx.translate(-20,-4); ctx.scale(1.08,1.08) }
  ctx.translate(240,375 + motion.bob + (tap?.y ?? 0)); ctx.rotate(motion.tilt + config.design.tilt*0.12 + (tap?.roll ?? 0))
  // Preserve the supplied silhouette; profile proportions vary only subtly.
  ctx.scale((1+motion.breath)*(1+(config.design.width-1)*0.25)*(tap?.scaleX ?? 1)*(tap?.zoom ?? 1), (1-motion.breath)*(1+(config.design.height-1)*0.18)*(tap?.scaleY ?? 1)*(tap?.zoom ?? 1))
  ctx.translate(-240,-375)
  if (tap && tap.yaw > 0.001 && tap.yaw < Math.PI*2-0.001) drawBotmojiTurn(ctx,image,raster.base,tap.yaw)
  else ctx.drawImage(image,40,0,400,400)
  ctx.restore()
  if (!compact) {
    ctx.fillStyle = '#f4f4f5'; ctx.textAlign = 'center'; ctx.font = '500 28px Georgia, serif'
    const name = `${config.name === 'Your' ? 'Your' : config.name.split(' ')[0] + '’s'} bot moji`
    ctx.fillText(name, 240, 425, 420)
    ctx.fillStyle = '#a1a1aa'; ctx.font = '15px system-ui, sans-serif'
    ctx.fillText(`${BOTMOJI_ROLES[config.role].label}  ·  ${BOTMOJI_STATES[state]}`, 240, 456, 420)
  }
  ctx.restore()
}

export async function exportBotmojiGif(config: BotmojiConfig, onProgress?: (percent: number) => void) {
  await loadBotmojiArtwork()
  const { GIFEncoder, quantize, applyPalette } = await import('gifenc')
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 384
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  const gif = GIFEncoder()
  const frames = botmojiGifTimeline()
  for (let frame = 0; frame < frames.length; frame++) {
    const pose = frames[frame]
    drawBotmoji(canvas, config, pose.state, pose.seconds, false, true, pose.tap)
    const rgba = ctx.getImageData(0, 0, 384, 384).data
    for (let i = 0; i < rgba.length; i += 4) {
      if (rgba[i+3] < 128) {
        // Transparent fur-edge pixels can retain bright RGB values. Clear
        // those too so palette matching cannot turn them into opaque ghosts.
        rgba[i] = rgba[i+1] = rgba[i+2] = rgba[i+3] = 0
      } else rgba[i+3] = 255
    }
    const palette = [[0, 0, 0, 0], ...quantize(rgba, 255, { format: 'rgba4444', oneBitAlpha: true }).filter((color) => color[3] !== 0)]
    gif.writeFrame(applyPalette(rgba, palette, 'rgba4444'), 384, 384, { palette, delay: pose.delay, repeat: 0, transparent: true, transparentIndex: 0, dispose: 2 })
    onProgress?.(Math.round((frame + 1) / frames.length * 100))
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
  }
  gif.finish()
  return new Blob([new Uint8Array(gif.bytes())], { type: 'image/gif' })
}
