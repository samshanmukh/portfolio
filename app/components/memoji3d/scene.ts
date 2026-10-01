// A live 3D take on Sam's Memoji, built from primitives in three.js so it runs in any
// browser with WebGL. Everything is procedural: no model file to download.
//
// Layout: the head sits around the origin (radius ~1), +z faces the viewer, +y is up.
// Faces are driven by a small set of expression values that ease toward the targets of
// the current mood, plus a cursor-follow gaze, blinks and a nod on every keystroke.

import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export type Mood = 'idle' | 'thinking' | 'wink' | 'grin'

export type MemojiState = {
  looking: boolean
  mood: Mood
  reduced: boolean
}

export type MemojiHandle = {
  set: (s: Partial<MemojiState>) => void
  nod: () => void
  resize: (w: number, h: number) => void
  setRunning: (on: boolean) => void
  destroy: () => void
}

// palette sampled from the Memoji stickers
const SKIN = new THREE.Color('#d99a73')
const STUBBLE = new THREE.Color('#6e5547')
const BLUSH = new THREE.Color('#e79a86')
const HAIR = new THREE.Color('#120d0b')
const HAIR_HI = new THREE.Color('#5c3a25')
const BROW = new THREE.Color('#2a1c15')
const IRIS = new THREE.Color('#3a2316')

const smooth = (a: number, b: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}
const gauss = (d2: number, s: number) => Math.exp(-d2 / (2 * s * s))

// Maps a unit direction onto the head surface: a slightly narrow, tall sphere with a
// tapered jaw and chin.
function headPoint(d: THREE.Vector3, r = 1, out = new THREE.Vector3()) {
  let x = d.x * 0.9
  const y = d.y * 1.04
  let z = d.z * 0.94
  if (d.y < 0) {
    const t = d.y * d.y
    x *= 1 - 0.12 * t
    z *= 1 - 0.06 * t
  }
  return out.set(x, y, z).multiplyScalar(r)
}

// unit direction from elevation (up from the equator) and azimuth (from +z toward +x)
function dir(el: number, az: number, out = new THREE.Vector3()) {
  return out.set(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az))
}

// A smooth, seamless unit sphere we can push around vertex by vertex.
function unitSphere(w: number, h: number) {
  const g = new THREE.SphereGeometry(1, w, h)
  g.deleteAttribute('uv')
  g.deleteAttribute('normal')
  return mergeVertices(g)
}

function buildHead() {
  const g = unitSphere(112, 84)
  const pos = g.attributes.position as THREE.BufferAttribute
  const colors = new Float32Array(pos.count * 3)
  const d = new THREE.Vector3()
  const p = new THREE.Vector3()
  const c = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    d.fromBufferAttribute(pos, i).normalize()
    headPoint(d, 1, p)
    pos.setXYZ(i, p.x, p.y, p.z)

    // light stubble along the jaw, chin and upper lip; clear cheeks and lips
    const front = smooth(-0.35, 0.15, d.z)
    let beard = smooth(-0.15, -0.4, d.y) * front
    beard += gauss(d.x * d.x * 0.5 + (d.y + 0.33) ** 2 * 6, 0.09) * smooth(0.6, 0.9, d.z) // moustache
    beard -= gauss(d.x * d.x * 0.9 + (d.y + 0.44) ** 2 * 5, 0.07) // lips
    beard -= gauss((Math.abs(d.x) - 0.5) ** 2 + (d.y + 0.12) ** 2, 0.13) * 0.8 // cheeks
    beard = THREE.MathUtils.clamp(beard, 0, 1) * 0.85
    const blush = gauss((Math.abs(d.x) - 0.48) ** 2 + (d.y + 0.15) ** 2, 0.1) * smooth(0.4, 0.8, d.z) * 0.25
    c.copy(SKIN).lerp(BLUSH, blush).lerp(STUBBLE, beard)
    colors.set([c.r, c.g, c.b], i * 3)
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  g.computeVertexNormals()
  return g
}

// Hairline height (in direction-y) as you go around the head: high forehead, lower at
// the temples, down to the nape at the back.
function hairlineY(az: number) {
  const a = Math.abs(az)
  if (a < Math.PI / 2) return THREE.MathUtils.lerp(0.6, 0.15, smooth(0.25, Math.PI / 2, a))
  return THREE.MathUtils.lerp(0.12, -0.5, smooth(Math.PI / 2, Math.PI * 0.9, a))
}

// Hair cap: a sphere shell that sits outside the head where there's hair and tucks
// inside the head everywhere else, so the hairline is where the two surfaces cross.
function buildHairCap() {
  const g = unitSphere(128, 96)
  const pos = g.attributes.position as THREE.BufferAttribute
  const colors = new Float32Array(pos.count * 3)
  const d = new THREE.Vector3()
  const p = new THREE.Vector3()
  const c = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    d.fromBufferAttribute(pos, i).normalize()
    const az = Math.atan2(d.x, d.z)
    const el = Math.asin(THREE.MathUtils.clamp(d.y, -1, 1))
    const mask = smooth(-0.03, 0.05, d.y - hairlineY(az))
    const wave = 0.018 * Math.sin(az * 9 + el * 6) * Math.sin(el * 4 + az * 2)
    const volume =
      0.06 + 0.12 * Math.max(0, d.y) ** 2 + 0.05 * Math.max(0, -d.z) * Math.max(0, d.y) + 0.07 * smooth(0.1, 0.5, d.y) * Math.abs(d.x)
    const r = THREE.MathUtils.lerp(0.955, 1.0 + volume + wave, mask)
    headPoint(d, r, p)
    pos.setXYZ(i, p.x, p.y, p.z)
    const streak = smooth(0.55, 1, Math.sin(az * 13 + el * 7) * 0.5 + 0.5) * Math.max(0, d.y)
    c.copy(HAIR).lerp(HAIR_HI, streak * 0.45)
    colors.set([c.r, c.g, c.b], i * 3)
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  g.computeVertexNormals()
  return g
}

// One tapered, slightly flattened lock of hair along a path over the scalp.
function buildLock(points: THREE.Vector3[], thick: number, highlight: number) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal')
  const seg = 56
  const radial = 10
  const g = new THREE.TubeGeometry(curve, seg, 1, radial, false)
  const pos = g.attributes.position as THREE.BufferAttribute
  const colors = new Float32Array(pos.count * 3)
  const v = new THREE.Vector3()
  const centre = new THREE.Vector3()
  const out = new THREE.Vector3()
  const c = new THREE.Color()
  for (let i = 0; i <= seg; i++) {
    const t = i / seg
    curve.getPointAt(t, centre)
    out.copy(centre).normalize()
    const r = thick * Math.pow(Math.sin(Math.PI * (0.06 + 0.94 * t)), 0.65) + 0.006
    for (let j = 0; j <= radial; j++) {
      const k = i * (radial + 1) + j
      v.fromBufferAttribute(pos, k).sub(centre)
      v.addScaledVector(out, -v.dot(out) * 0.45) // flatten against the head
      v.multiplyScalar(r).add(centre)
      pos.setXYZ(k, v.x, v.y, v.z)
      const hi = highlight * Math.sin(Math.PI * t) * (0.6 + 0.4 * Math.sin(j * 0.9))
      c.copy(HAIR).lerp(HAIR_HI, Math.max(0, hi))
      colors.set([c.r, c.g, c.b], k * 3)
    }
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  g.computeVertexNormals()
  return g
}

function buildHairLocks() {
  const geos: THREE.BufferGeometry[] = []
  const d = new THREE.Vector3()
  const rand = mulberry(7)

  // the quiff: locks rise off the forehead and sweep back and to one side with a wave
  const n = 19
  for (let i = 0; i < n; i++) {
    const az0 = THREE.MathUtils.lerp(-0.85, 0.85, i / (n - 1)) + (rand() - 0.5) * 0.08
    const phase = rand() * Math.PI * 2
    const lift = 0.3 * (1 - 0.25 * Math.abs(az0)) + rand() * 0.06
    const pts: THREE.Vector3[] = []
    for (let s = 0; s <= 10; s++) {
      const t = s / 10
      const el = THREE.MathUtils.lerp(hairElevation(az0) + 0.04, 1.95, t)
      const az = az0 * (1 - 0.35 * t) + 0.45 * t * t + 0.1 * Math.sin(t * 7 + phase)
      // shoots up off the forehead, peaks early, then lies down toward the crown
      const r = 1.04 + lift * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.7)), 0.6)
      pts.push(headPoint(dir(el, az, d), r))
    }
    geos.push(buildLock(pts, 0.095 + rand() * 0.035, rand() < 0.45 ? 0.75 : 0.25))
  }

  // a few curls across the top for the wavy texture
  for (let i = 0; i < 9; i++) {
    const az0 = THREE.MathUtils.lerp(-0.7, 0.9, i / 8)
    const pts: THREE.Vector3[] = []
    for (let s = 0; s <= 8; s++) {
      const t = s / 8
      const el = THREE.MathUtils.lerp(0.95, 1.5, t)
      const az = az0 + 0.25 * t + 0.12 * Math.sin(t * 5 + i)
      pts.push(headPoint(dir(el, az, d), 1.17 + 0.05 * Math.sin(Math.PI * t)))
    }
    geos.push(buildLock(pts, 0.08, 0.8))
  }

  // sides, swept back above the ears
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const el0 = 0.2 + i * 0.13
      const pts: THREE.Vector3[] = []
      for (let s = 0; s <= 8; s++) {
        const t = s / 8
        const az = side * THREE.MathUtils.lerp(1.05, 2.5, t)
        const el = el0 + 0.08 * Math.sin(t * 4 + i)
        pts.push(headPoint(dir(el, az, d), 1.04 + 0.03 * Math.sin(Math.PI * t)))
      }
      geos.push(buildLock(pts, 0.08, 0.3))
    }
  }
  return geos
}

// elevation of the hairline for an azimuth (inverse of hairlineY on the unit sphere)
function hairElevation(az: number) {
  return Math.asin(THREE.MathUtils.clamp(hairlineY(az), -1, 1))
}

function mulberry(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Places an object on the head surface at (el, az), facing outward along the normal.
function onFace(obj: THREE.Object3D, el: number, az: number, lift = 0) {
  const d = dir(el, az)
  const p = headPoint(d)
  // numerical surface normal
  const e = 0.01
  const pa = headPoint(dir(el + e, az))
  const pb = headPoint(dir(el, az + e))
  const n = pb.sub(p).cross(pa.sub(p)).normalize()
  obj.position.copy(p).addScaledVector(n, lift)
  obj.lookAt(obj.position.clone().add(n))
  return obj
}

type Expr = {
  smile: number
  grin: number
  pout: number
  squint: number
  wink: number
  look: number
  browL: number
  browR: number
  browTilt: number
  eyeX: number
  eyeY: number
  yaw: number
  pitch: number
  roll: number
}

const MOODS: Record<Mood, Partial<Expr>> = {
  idle: { smile: 0.5, grin: 0, pout: 0, squint: 0.1, wink: 0, browL: 0, browR: 0, browTilt: 0, roll: 0 },
  thinking: { smile: 0, grin: 0, pout: 1, squint: 0, wink: 0, browL: 0.6, browR: -0.1, browTilt: 0.2, roll: 0.08 },
  wink: { smile: 0.95, grin: 0.15, pout: 0, squint: 0.45, wink: 1, browL: 0.25, browR: -0.35, browTilt: 0, roll: -0.12 },
  grin: { smile: 1, grin: 1, pout: 0, squint: 0.55, wink: 0, browL: 0.4, browR: 0.4, browTilt: 0, roll: 0.04 },
}

export function createMemoji(canvas: HTMLCanvasElement, initial: MemojiState): MemojiHandle {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.9

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environment = envTex
  scene.environmentIntensity = 0.3

  const camera = new THREE.PerspectiveCamera(22, 1, 0.1, 50)
  camera.position.set(0, 0.12, 7.4)
  camera.lookAt(0, 0.08, 0)

  scene.add(new THREE.HemisphereLight(0xffffff, 0xb07a5a, 0.55))
  const key = new THREE.DirectionalLight(0xfff1e6, 2.3)
  key.position.set(2.2, 3, 4)
  scene.add(key)
  const fill = new THREE.DirectionalLight(0xdfe8ff, 0.6)
  fill.position.set(-3, 0.5, 2.5)
  scene.add(fill)
  const rim = new THREE.DirectionalLight(0xffffff, 1.6)
  rim.position.set(-1, 2.5, -4)
  scene.add(rim)

  // ---------- materials ----------
  const skinProps = {
    roughness: 0.5,
    sheen: 0.5,
    sheenColor: new THREE.Color('#ffb592'),
    sheenRoughness: 0.6,
    clearcoat: 0.12,
    clearcoatRoughness: 0.5,
  }
  const headMat = new THREE.MeshPhysicalMaterial({ ...skinProps, vertexColors: true })
  const skinMat = new THREE.MeshPhysicalMaterial({ ...skinProps, color: SKIN })
  const hairMat = new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    roughness: 0.42,
    clearcoat: 0.55,
    clearcoatRoughness: 0.35,
    sheen: 0.6,
    sheenColor: new THREE.Color('#5a3a26'),
    sheenRoughness: 0.4,
  })
  const browMat = new THREE.MeshStandardMaterial({ color: BROW, roughness: 0.8 })
  const scleraMat = new THREE.MeshPhysicalMaterial({ color: '#f7f4f0', roughness: 0.2, clearcoat: 1 })
  const irisMat = new THREE.MeshPhysicalMaterial({ color: IRIS, roughness: 0.25, clearcoat: 1 })
  const pupilMat = new THREE.MeshStandardMaterial({ color: '#0b0705', roughness: 0.3 })
  const glintMat = new THREE.MeshBasicMaterial({ color: '#ffffff' })
  const lashMat = new THREE.MeshStandardMaterial({ color: '#160e0b', roughness: 0.7 })
  const lipLineMat = new THREE.MeshStandardMaterial({ color: '#7c3b31', roughness: 0.6 })
  const mouthMat = new THREE.MeshStandardMaterial({ color: '#4a1715', roughness: 0.8, side: THREE.DoubleSide })
  const teethMat = new THREE.MeshPhysicalMaterial({ color: '#fbf7f1', roughness: 0.25, clearcoat: 0.6, side: THREE.DoubleSide })
  const lipsMat = new THREE.MeshPhysicalMaterial({ ...skinProps, color: '#cf8574' })

  // ---------- rig ----------
  // pivot at the neck so nods and tilts swing from below like a real head
  const neck = new THREE.Group()
  neck.position.y = -0.95
  scene.add(neck)
  const head = new THREE.Group()
  head.position.y = 0.95
  neck.add(head)

  head.add(new THREE.Mesh(buildHead(), headMat))
  head.add(new THREE.Mesh(buildHairCap(), hairMat))
  for (const g of buildHairLocks()) head.add(new THREE.Mesh(g, hairMat))

  // ears
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), skinMat)
    ear.scale.set(0.11, 0.22, 0.16)
    ear.position.set(side * 0.87, -0.03, 0.0)
    ear.rotation.y = side * 0.35
    head.add(ear)
    const inner = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), headMat)
    inner.scale.set(0.05, 0.13, 0.08)
    inner.position.set(side * 0.93, -0.02, 0.03)
    head.add(inner)
  }

  // nose
  const nose = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), skinMat)
  nose.scale.set(0.12, 0.1, 0.11)
  onFace(nose, -0.17, 0, -0.02)
  head.add(nose)
  const bridge = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), skinMat)
  bridge.scale.set(0.06, 0.16, 0.06)
  onFace(bridge, -0.04, 0, -0.03)
  head.add(bridge)

  // eyes: a fixed socket (lids, glint) with an eyeball inside that rotates for gaze
  const EYE_R = 0.142
  type Eye = { ball: THREE.Group; upper: THREE.Mesh; lower: THREE.Mesh; brow: THREE.Group; glints: THREE.Group; side: number }
  const eyes: Eye[] = []
  for (const side of [-1, 1]) {
    const socket = new THREE.Group()
    onFace(socket, 0.07, side * 0.35, -0.065)
    socket.rotateY(-side * 0.12) // face a touch more forward than the surface normal
    head.add(socket)

    const ball = new THREE.Group()
    socket.add(ball)
    ball.add(new THREE.Mesh(new THREE.SphereGeometry(EYE_R, 40, 30), scleraMat))
    const cap = (r: number, theta: number, m: THREE.Material) => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 40, 12, 0, Math.PI * 2, 0, theta), m)
      mesh.rotation.x = Math.PI / 2 // pole toward +z
      return mesh
    }
    ball.add(cap(EYE_R * 1.004, 0.72, irisMat))
    ball.add(cap(EYE_R * 1.008, 0.34, pupilMat))

    // catch-lights stay put while the eyeball turns
    const glints = new THREE.Group()
    socket.add(glints)
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 8), glintMat)
    glint.position.set(0.035, 0.045, EYE_R * 0.97)
    const glint2 = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 6), glintMat)
    glint2.position.set(-0.03, -0.035, EYE_R * 0.99)
    glints.add(glint, glint2)

    const upper = new THREE.Mesh(new THREE.SphereGeometry(EYE_R * 1.07, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2), skinMat)
    const lash = new THREE.Mesh(new THREE.TorusGeometry(EYE_R * 1.07, 0.011, 8, 40, Math.PI), lashMat)
    lash.rotation.x = Math.PI / 2
    upper.add(lash)
    socket.add(upper)
    const lower = new THREE.Mesh(
      new THREE.SphereGeometry(EYE_R * 1.05, 40, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
      skinMat,
    )
    socket.add(lower)

    // brow: a flattened, arched capsule on the forehead
    const browAnchor = new THREE.Group()
    onFace(browAnchor, 0.31, side * 0.35, 0.005)
    head.add(browAnchor)
    const brow = new THREE.Group()
    browAnchor.add(brow)
    const bg = new THREE.CapsuleGeometry(0.034, 0.22, 6, 12)
    bg.rotateZ(Math.PI / 2)
    const bp = bg.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < bp.count; i++) {
      const x = bp.getX(i)
      // arch, and thicker toward the inner end
      bp.setY(i, bp.getY(i) * (1 + 0.35 * -side * x * 4) * 0.9 - 1.6 * x * x)
      bp.setZ(i, bp.getZ(i) * 0.45 - 1.4 * x * x)
    }
    bg.computeVertexNormals()
    const browMesh = new THREE.Mesh(bg, browMat)
    browMesh.rotation.z = side * -0.08
    brow.add(browMesh)

    eyes.push({ ball, upper, lower, brow, glints, side })
  }

  // mouth: drawn in a small (u, v) patch and draped onto the face so it never sinks
  // into the skin, whatever the jaw's curvature
  const MOUTH_EL = -0.42
  const surf = (u: number, v: number, lift: number, out = new THREE.Vector3()) => {
    const el = MOUTH_EL + v
    return headPoint(dir(el, u / Math.cos(el) / 0.9), 1 + lift, out)
  }
  const drape = (g: THREE.BufferGeometry, lift: number) => {
    const p = g.attributes.position as THREE.BufferAttribute
    const v = new THREE.Vector3()
    for (let i = 0; i < p.count; i++) {
      surf(p.getX(i), p.getY(i), lift, v)
      p.setXYZ(i, v.x, v.y, v.z)
    }
    g.computeVertexNormals()
    return g
  }
  const lipLine = new THREE.Mesh(new THREE.BufferGeometry(), lipLineMat)
  const mouthOpen = new THREE.Mesh(new THREE.BufferGeometry(), mouthMat)
  const teeth = new THREE.Mesh(new THREE.BufferGeometry(), teethMat)
  head.add(lipLine, mouthOpen, teeth)
  const lips = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), lipsMat)
  const lipsAnchor = onFace(new THREE.Group(), MOUTH_EL, 0, 0)
  lipsAnchor.add(lips)
  head.add(lipsAnchor)

  // a finely subdivided strip between two curves, so it can bend with the face
  const band = (half: number, top: (s: number) => number, bottom: (s: number) => number, nS = 28, nT = 6) => {
    const g = new THREE.BufferGeometry()
    const pos: number[] = []
    const idx: number[] = []
    for (let i = 0; i <= nS; i++) {
      const s = -1 + (2 * i) / nS
      for (let j = 0; j <= nT; j++) pos.push(s * half, THREE.MathUtils.lerp(top(s), bottom(s), j / nT), 0)
    }
    for (let i = 0; i < nS; i++)
      for (let j = 0; j < nT; j++) {
        const a = i * (nT + 1) + j
        const b = a + nT + 1
        idx.push(a, a + 1, b, b, a + 1, b + 1)
      }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setIndex(idx)
    return g
  }

  let lastMouthKey = ''
  function updateMouth(e: Expr) {
    const key = [e.smile, e.grin, e.pout].map((v) => v.toFixed(3)).join()
    if (key === lastMouthKey) return
    lastMouthKey = key
    const w = 0.3 * (1 - 0.55 * e.pout) * (1 + 0.3 * e.grin)
    // corners curl up with the smile; the open mouth is a "D" hanging from that line
    const top = (s: number) => e.smile * (0.05 + 0.02 * e.grin) * s * s - 0.01 * e.smile
    const open = e.grin * 0.13
    const bottom = (s: number) => top(s) - open * Math.pow(Math.max(0, 1 - s * s), 0.7)

    const pts: THREE.Vector3[] = []
    for (let k = 0; k <= 14; k++) {
      const s = -1 + (2 * k) / 14
      pts.push(surf((s * w) / 2, top(s) + 0.012 * e.smile * Math.max(0, Math.abs(s) - 0.75) * 4, 0.006))
    }
    lipLine.geometry.dispose()
    lipLine.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.011, 6, false)
    lipLine.visible = e.grin < 0.35

    if (open > 0.004) {
      const half = w / 2
      mouthOpen.geometry.dispose()
      mouthOpen.geometry = drape(band(half, top, bottom), 0.004)
      teeth.geometry.dispose()
      teeth.geometry = drape(
        band(half * 0.97, (s) => top(s) - 0.003, (s) => Math.max(top(s) - 0.045 * e.grin, bottom(s) + 0.006)),
        0.006,
      )
      mouthOpen.visible = teeth.visible = true
    } else {
      mouthOpen.visible = teeth.visible = false
    }

    // puckered lips
    lips.visible = e.pout > 0.02
    lips.scale.set(0.08 * e.pout, 0.05 * e.pout, 0.05 * e.pout)
    lips.position.z = 0.012 * e.pout
  }

  // ---------- state ----------
  let state: MemojiState = { ...initial }
  const cur: Expr = {
    smile: 0.5, grin: 0, pout: 0, squint: 0.1, wink: 0, look: 0,
    browL: 0, browR: 0, browTilt: 0, eyeX: 0, eyeY: 0, yaw: 0, pitch: 0, roll: 0,
  }
  const pointer = { x: 0, y: 0, at: -1e9 }
  let nodPos = 0
  let nodVel = 0
  let blinkStart = -1
  let nextBlink = 1.5
  let elapsed = 0
  let lastTime = -1

  const onPointer = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    // normalise by a generous radius so the whole page steers the gaze
    const span = Math.max(window.innerWidth, window.innerHeight) * 0.5
    pointer.x = THREE.MathUtils.clamp((e.clientX - cx) / span, -1, 1)
    pointer.y = THREE.MathUtils.clamp((e.clientY - cy) / span, -1, 1)
    pointer.at = elapsed
  }
  window.addEventListener('pointermove', onPointer, { passive: true })
  window.addEventListener('pointerdown', onPointer, { passive: true })

  function frame(time: number) {
    const dt = lastTime < 0 ? 0 : THREE.MathUtils.clamp((time - lastTime) / 1000, 0, 0.05)
    lastTime = time
    elapsed += dt
    const t = elapsed
    const reduced = state.reduced

    // targets
    const target: Expr = { ...cur, ...MOODS[state.mood] }
    const recentPointer = t - pointer.at < 4
    if (state.looking) {
      // looking down at the ask box below
      target.look = 1
      target.pitch = 0.3
      target.yaw = 0
      target.eyeX = 0
      target.eyeY = -0.6
      if (state.mood === 'idle') target.smile = 0.3
    } else if (state.mood === 'thinking') {
      target.look = 0
      target.pitch = -0.08
      target.yaw = -0.12
      target.eyeX = 0.55
      target.eyeY = 0.6
    } else {
      target.look = 0
      const px = recentPointer ? pointer.x : 0.25 * Math.sin(t * 0.37)
      const py = recentPointer ? pointer.y : 0.15 * Math.sin(t * 0.23 + 1)
      target.yaw = reduced ? 0 : px * 0.5
      target.pitch = reduced ? 0 : py * 0.3
      target.eyeX = px * 0.8
      target.eyeY = -py * 0.7
    }

    const k = 1 - Math.exp(-dt * 9)
    const kHead = 1 - Math.exp(-dt * (reduced ? 4 : 6))
    for (const key of Object.keys(cur) as (keyof Expr)[]) {
      const rate = key === 'yaw' || key === 'pitch' || key === 'roll' ? kHead : k
      cur[key] += (target[key] - cur[key]) * rate
    }

    // keystroke nod: a damped spring
    nodVel += (-nodPos * 90 - nodVel * 11) * dt
    nodPos += nodVel * dt

    // blinks every few seconds
    if (blinkStart < 0 && t > nextBlink) blinkStart = t
    let blink = 0
    if (blinkStart >= 0) {
      const b = (t - blinkStart) / 0.16
      blink = b < 1 ? Math.sin(Math.PI * b) : 0
      if (b >= 1) {
        blinkStart = -1
        nextBlink = t + 2 + Math.random() * 3.5
      }
    }

    // head
    const breathe = reduced ? 0 : Math.sin(t * 1.5) * 0.012
    neck.rotation.set(cur.pitch + nodPos, cur.yaw, cur.roll)
    neck.position.y = -0.95 + breathe

    // eyes and lids
    for (const eye of eyes) {
      eye.ball.rotation.set(-cur.eyeY * 0.32, cur.eyeX * 0.4, 0)
      const winking = eye.side > 0 ? cur.wink : 0
      const close = Math.min(1, Math.max(blink, winking, cur.look * 0.15, cur.squint * 0.25))
      eye.upper.rotation.x = THREE.MathUtils.lerp(-0.85 + cur.eyeY * 0.18, 0.62, close)
      eye.glints.visible = close < 0.55
      const lowerOpen = 0.78 - 0.5 * cur.squint - 0.3 * winking
      eye.lower.rotation.x = Math.max(lowerOpen, -0.2)
      const raise = eye.side < 0 ? cur.browL : cur.browR
      eye.brow.position.y = raise * 0.045 - winking * 0.02 - cur.look * 0.01
      eye.brow.rotation.z = eye.side * (cur.browTilt * 0.15 - winking * 0.12)
    }

    updateMouth(cur)
    renderer.render(scene, camera)
  }

  let running = true
  renderer.setAnimationLoop(frame)

  const disposeAll = () => {
    scene.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose()
    })
    for (const m of [headMat, skinMat, hairMat, browMat, scleraMat, irisMat, pupilMat, glintMat, lashMat, lipLineMat, mouthMat, teethMat, lipsMat])
      m.dispose()
    envTex.dispose()
    pmrem.dispose()
    renderer.dispose()
  }

  const api: MemojiHandle = {
    set: (s) => {
      state = { ...state, ...s }
    },
    nod: () => {
      if (!state.reduced) nodVel += 2.4
    },
    resize: (w, h) => {
      if (!w || !h) return
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    },
    setRunning: (on) => {
      if (on === running) return
      running = on
      lastTime = -1
      renderer.setAnimationLoop(on ? frame : null)
    },
    destroy: () => {
      renderer.setAnimationLoop(null)
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('pointerdown', onPointer)
      disposeAll()
    },
  }
  return api
}
