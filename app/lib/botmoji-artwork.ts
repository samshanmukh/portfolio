import type { BotmojiRole } from './botmoji'

// The supplied artwork stays intact. These crops remove the gutters between
// expressions, and landmarks let the rig move its original facial pixels.
export const BOTMOJI_ARTWORK_URL = '/botmoji/reference-plush.png'
export const BOTMOJI_ARTWORK_NAMES = ['Mochi', 'Pip', 'Luna', 'Sprout', 'Peach', 'Nimbus'] as const
const ROLE_ARTWORK: Record<BotmojiRole, number> = { designer: 2, product: 3, accounts: 0, engineer: 5, marketing: 4, founder: 1, other: 0 }
export function botmojiArtwork(role: BotmojiRole, seed: number, selected?: number) {
  return selected !== undefined && Number.isInteger(selected) && selected >= 0 && selected < 6 ? selected : role === 'other' ? seed % 6 : ROLE_ARTWORK[role]
}

type Point = readonly [number, number]
type Face = readonly [Point, Point, Point]
const BOUNDS = [
  [[19,41,256,249],[20,23,256,233],[19,16,256,225],[19,10,256,217]],
  [[24,32,251,249],[26,19,256,233],[23,10,256,226],[25,7,256,219]],
  [[22,32,256,250],[29,23,256,235],[25,13,256,227],[26,10,256,220]],
  [[26,28,237,249],[30,15,250,235],[27,3,248,227],[29,4,244,220]],
  [[4,45,236,250],[13,35,238,235],[10,29,239,227],[9,24,237,220]],
  [[0,43,236,250],[0,33,241,236],[0,23,240,228],[0,25,236,220]],
] as const
const FACES: readonly (readonly Face[])[] = [
  [[[102,157.5],[188.5,157],[147,181]],[[120.5,142.5],[203,124.5],[170,160]],[[108,151],[194,144],[152,169]],[[103,117.5],[192,115.5],[148.5,146]]],
  [[[100,157.5],[181.5,158],[137,181]],[[116.5,144],[198,132],[162,165]],[[107.5,152.5],[182,155],[149,176]],[[104.5,120],[188,119.5],[147,151]]],
  [[[103.5,159.5],[185,159.5],[144,182]],[[123.5,145],[200.5,132.5],[166,165]],[[105,150.5],[180,155],[145,174]],[[111,123],[193.5,124],[153,153]]],
  [[[99,158.5],[176.5,156.5],[138,181]],[[121.5,144.5],[196,126.5],[165,162]],[[108,160],[178,160],[143,179]],[[106,127],[185,121],[147,154]]],
  [[[81,159],[164.5,156.5],[120,181]],[[103.5,147],[183.5,130],[149,165]],[[89,154.5],[165,156],[130,177]],[[90.5,128],[168,124],[132.5,154]]],
  [[[76.5,157],[156.5,156.5],[113,180]],[[101.5,145],[178,133],[148,165]],[[81.5,154.5],[163.5,152.5],[123,177]],[[78,124.5],[160,121],[120,152]]],
]
export function botmojiArtworkPose(artwork: number, state: number) {
  const [left, top, right, bottom] = BOUNDS[artwork][state]
  const scale = Math.min(240 / (right - left), 240 / (bottom - top))
  const x = (256 - (right - left) * scale) / 2
  const y = 248 - (bottom - top) * scale
  const map = ([px, py]: Point): Point => [x + (px - left) * scale, y + (py - top) * scale]
  return {
    sx: artwork * 256 + left, sy: [20,276,530,768][state] + top,
    sw: right - left, sh: bottom - top, x, y, width: (right - left) * scale, height: (bottom - top) * scale,
    eyes: [map(FACES[artwork][state][0]), map(FACES[artwork][state][1])] as const,
    mouth: map(FACES[artwork][state][2]), eyeRadius: 23 * scale, eyeHeight: 18 * scale, mouthRadius: 16 * scale,
  }
}
