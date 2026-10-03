import { Pixels, rgb, type Rgb } from './pixels'
import { seededRandom } from './tinyNet'

// The header under the Turkish flag: a rider galloping across the steppe at dusk. The horse
// stays in the middle of the picture while the land runs past from right to left: the far
// mountains slowly, the hills and yurts faster, the grass at the horse's feet fastest.

/** The dusk sky, from the top down to the horizon. */
export const STEPPE_SKY = ['#4f030a', '#6b050d', '#8a0710', '#aa0812', '#c80915', '#dc0a16', '#e30a17'].map(rgb)

const MOUNTAIN = rgb('#9c0812')
const HILL = rgb('#7c060e')
const YURT = rgb('#3d0207')
const DOOR = rgb('#f0646d')
const GROUND = rgb('#5e040b')
const GROUND_RIM = rgb('#9a0d17')
const SPECK = rgb('#7a0810')
const GRASS = rgb('#8c0b15')
const GRASS_TIP = rgb('#d2444d')
const RIDER = rgb('#1a0103')
const SCARF = rgb('#ffffff')
const DUST = rgb('#f29aa0')

/** One full stride of the gallop. */
const GALLOP_MS = 520
// How a horse really gallops. The feet come down one after another, hind before fore; each
// stays on the ground for about a quarter of the stride while the body passes over it; and then
// for a moment the horse is in the air with all four legs gathered under it. It is never in the
// air with its legs stretched out front and back: that is only in old paintings.
/** When each leg comes down, as a share of the stride: the two hind legs, then the two fore. */
const FOOTFALL = { hindFar: 0, hindNear: 0.12, foreFar: 0.38, foreNear: 0.5 }
/** The share of the stride a hoof spends on the ground. */
const ON_GROUND = 0.26
/** The moment in the stride when the horse is highest in the air. */
const IN_THE_AIR = 0.87

/**
 * The horse and rider are modelled at twice the size they are drawn, so that the rider comes
 * out about as tall as the little astronomer who stands in the header by night.
 */
const RIDER_SIZE = 0.52
/** How fast each layer runs past, in pixels a second. */
const SPEED = { mountains: 5, hills: 13, yurts: 20, ground: 52 }

/** A round felt tent, as the steppe's people have always built them. */
const YURT_SHAPE = [
  '.....###.....',
  '...#######...',
  '..#########..',
  '.###########.',
  '#############',
  '#############',
  '#####ooo#####',
  '#####ooo#####',
]
/** Yurts stand at these places along a stretch of land that repeats. */
const YURT_STRETCH = 560
const YURTS = [70, 118, 392]

const GRASS_STRETCH = 223
const TUFTS = (() => {
  const random = seededRandom(1071)
  return Array.from({ length: 22 }, () => ({ x: Math.floor(random() * GRASS_STRETCH), height: 2 + Math.floor(random() * 3) }))
})()

export type Steppe = {
  /** The row where the ground begins. */
  ground: number
  /** The column the rider stays in. */
  riderX: number
}

/** `x` wrapped into a stretch of land `stretch` pixels long that has slid `moved` pixels left. */
function along(x: number, moved: number, stretch: number) {
  return (((x - moved) % stretch) + stretch) % stretch
}

/** Draws the steppe as it is `now` milliseconds in: land, yurts, grass, rider and dust. */
export function drawSteppe(frame: Pixels, { ground, riderX }: Steppe, now: number) {
  const { width, height } = frame
  const seconds = now / 1000

  // Each layer is a line of land that slides left; the picture shows the part passing now.
  const mountains = seconds * SPEED.mountains
  const hills = seconds * SPEED.hills
  const ridge = (x: number) =>
    ground - 8 - 5 * Math.abs(Math.sin((x + mountains) * 0.019 + 1.1)) - 3 * Math.sin((x + mountains) * 0.043 + 2) - 2 * Math.sin((x + mountains) * 0.097)
  const hill = (x: number) => ground - 3 - 2.5 * Math.sin((x + hills) * 0.031 + 0.6) - 1.5 * Math.sin((x + hills) * 0.083 + 1.7)
  for (let x = 0; x < width; x++) {
    for (let y = Math.round(ridge(x)); y < ground; y++) frame.set(x, y, MOUNTAIN)
    for (let y = Math.round(hill(x)); y < ground; y++) frame.set(x, y, HILL)
  }

  // Yurts on the horizon, each with a lit doorway.
  const yurts = seconds * SPEED.yurts
  for (const place of YURTS) {
    for (let left = along(place, yurts, YURT_STRETCH) - YURT_STRETCH; left < width; left += YURT_STRETCH) {
      YURT_SHAPE.forEach((row, dy) =>
        [...row].forEach((cell, dx) => {
          if (cell !== '.') frame.set(Math.round(left) + dx, ground - YURT_SHAPE.length + dy, cell === 'o' ? DOOR : YURT)
        }),
      )
      frame.set(Math.round(left) + 6, ground - YURT_SHAPE.length - 1, YURT)
    }
  }

  // The ground, speckled so that its speed shows, and the grass along its edge.
  const moved = Math.round(seconds * SPEED.ground)
  for (let y = ground; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const speck = y > ground + 1 && (((x + moved) * 73856093) ^ (y * 19349663)) % 23 === 0
      frame.set(x, y, y === ground ? GROUND_RIM : speck ? SPECK : GROUND)
    }
  }
  for (const tuft of TUFTS) {
    for (let x = along(tuft.x, moved, GRASS_STRETCH) - GRASS_STRETCH; x < width; x += GRASS_STRETCH) {
      for (let up = 0; up < tuft.height; up++) frame.set(x, ground - up, up === tuft.height - 1 ? GRASS_TIP : GRASS)
    }
  }

  const stride = (now % GALLOP_MS) / GALLOP_MS
  drawRider(frame, riderX, ground, stride)

  // Dust kicked up behind the hooves, drifting back and fading.
  for (let k = 0; k < 7; k++) {
    const life = (now / 700 + k / 7) % 1
    frame.set(riderX - 7 - life * 22 - (k % 3) * 2, ground - 1 - life * (2 + (k % 3)), DUST, (1 - life) * 0.75)
  }
}

/**
 * The horse and its rider in silhouette, facing right, with the body above (centerX, ground).
 * `stride` runs from 0 to 1 over one gallop stride, starting as the first hind foot comes down.
 */
function drawRider(frame: Pixels, centerX: number, ground: number, stride: number) {
  const dark = new Set<number>()
  const light = new Set<number>()
  const key = (x: number, y: number) => Math.round(y) * 4096 + Math.round(x)
  // A filled disc; every part of the horse is built from discs dragged along lines.
  const dot = (x: number, y: number, size: number, into = dark) => {
    // Thin parts never shrink to nothing: a hoof or a rein is at least one pixel.
    const radius = Math.max(0.5, size * RIDER_SIZE)
    const reach = Math.ceil(radius)
    for (let dy = -reach; dy <= reach; dy++) {
      for (let dx = -reach; dx <= reach; dx++) {
        if (dx * dx + dy * dy <= radius * radius + 0.3) into.add(key(x + dx, y + dy))
      }
    }
  }
  const stroke = (x0: number, y0: number, x1: number, y1: number, r0: number, r1 = r0, into = dark) => {
    const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 3))
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      dot(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r0 + (r1 - r0) * t, into)
    }
  }

  const turn = stride * Math.PI * 2
  // 1 at the top of the leap, 0 when the horse is lowest, with its weight on its fore legs.
  const stretch = (1 + Math.cos((stride - IN_THE_AIR) * Math.PI * 2)) / 2
  // The body rises as the horse leaves the ground. It tips nose up while the hind legs push
  // and nose down while the fore legs carry it.
  const bodyY = ground - (18 + 2 * stretch) * RIDER_SIZE
  const pitch = 0.06 * Math.sin((stride - 0.33) * Math.PI * 2)
  const cos = Math.cos(pitch)
  const sin = Math.sin(pitch)
  /** A point given relative to the middle of the horse's body, as a place in the picture. */
  const at = (x: number, y: number): [number, number] => [
    centerX + (x * cos - y * sin) * RIDER_SIZE,
    bodyY + (x * sin + y * cos) * RIDER_SIZE,
  ]
  const line = (x0: number, y0: number, x1: number, y1: number, r0: number, r1 = r0, into = dark) =>
    stroke(...at(x0, y0), ...at(x1, y1), r0, r1, into)

  // Body: barrel, chest and hindquarters.
  line(-7, 0, 7, -0.5, 5.6, 5.4)
  dot(...at(8, -1), 5.8)
  dot(...at(-8.5, -0.5), 6.2)
  // Neck and head, with two ears.
  line(9, -3, 17, -12, 3.2, 2.4)
  line(17, -13, 23, -9.5, 2.1, 1.4)
  dot(...at(16, -16), 0.6)
  dot(...at(17.5, -16.5), 0.6)
  // Mane and tail stream out behind.
  for (let i = 0; i <= 5; i++) {
    dot(...at(8.5 + i * 1.5 - 1.6, -5 - i * 1.6 - 1.4 + 0.6 * Math.sin(turn + i)), 1)
  }
  // The tail is a full plume: thin where it leaves the body, thickest in the middle, and
  // tapering to its tip.
  for (let i = 0; i <= 12; i++) {
    const far = i / 12
    const puff = 0.6 + 1.9 * Math.sin(Math.PI * Math.max(0, (far - 0.15) / 0.85) ** 0.8)
    dot(...at(-13 - i * 1.05, -2.5 + i * 0.3 + 1.3 * far * Math.sin(turn - i * 0.5) - 2.5 * stretch * far), puff)
  }

  // Legs. Each hoof follows the same round: it lands well ahead of its shoulder or hip, stays
  // planted while the body passes over it, pushes off behind, and is then lifted, folded and
  // swung forward to land again. The joint between the two bones is put where it must be for
  // the leg to reach its hoof: a fore knee bends forward, a hind hock bends back.
  const leg = (jointX: number, jointY: number, lands: number, fore: boolean) => {
    const [hipX, hipY] = at(jointX, jointY)
    const round = (((stride - lands) % 1) + 1) % 1
    const ahead = fore ? 8.5 : 9
    const behind = fore ? 7 : 8
    let reach: number
    let lift = 0
    if (round < ON_GROUND) {
      reach = ahead - (ahead + behind) * (round / ON_GROUND)
    } else {
      const air = (round - ON_GROUND) / (1 - ON_GROUND)
      reach = -behind + (ahead + behind) * air * air * (3 - 2 * air)
      lift = (fore ? 9 : 6.5) * Math.sin(Math.PI * air) ** 0.8
    }
    const hoofX = centerX + (jointX + reach) * RIDER_SIZE
    const hoofY = ground - 0.5 - lift * RIDER_SIZE
    const far = Math.hypot(hoofX - hipX, hoofY - hipY)
    // A planted leg is straight and leans; it is a little longer then, as the fetlock gives
    // under the horse's weight, so that the hoof stays on the ground.
    const give = Math.max(1, Math.min(1.18, far / (16.5 * RIDER_SIZE)))
    const upper = 8 * RIDER_SIZE * give
    const lower = 8.5 * RIDER_SIZE * give
    // The leg cannot stretch past its own length or fold flat.
    const span = Math.min(upper + lower - 0.01, Math.max(Math.abs(upper - lower) + 0.01, far))
    const toward = Math.atan2(hoofY - hipY, hoofX - hipX)
    const open = Math.acos((upper * upper + span * span - lower * lower) / (2 * upper * span))
    const bend = toward + (fore ? -open : open)
    const kneeX = hipX + upper * Math.cos(bend)
    const kneeY = hipY + upper * Math.sin(bend)
    const down = Math.atan2(hoofY - kneeY, hoofX - kneeX)
    const footX = kneeX + lower * Math.cos(down)
    const footY = kneeY + lower * Math.sin(down)
    stroke(hipX, hipY, kneeX, kneeY, 1.7, 1.2)
    stroke(kneeX, kneeY, footX, footY, 1.1, 0.9)
    dot(footX, footY, 1.2)
  }
  leg(-9, 3, FOOTFALL.hindFar, false)
  leg(-9, 3, FOOTFALL.hindNear, false)
  leg(8, 3, FOOTFALL.foreFar, true)
  leg(8, 3, FOOTFALL.foreNear, true)

  // The rider leans into the gallop: leg, body, arm to the reins, head in a pointed cap.
  const seat = -6 - (1 - stretch)
  line(0, seat + 1, 3, 2, 1.3)
  dot(...at(4, 3), 1.1)
  line(-1, seat - 1, 3, seat - 9, 2.2, 2)
  line(3, seat - 8, 10, seat - 3, 1)
  line(10, seat - 3, 21, -10, 0.4)
  dot(...at(5, seat - 12), 2.3)
  line(3.5, seat - 14.5, 6.5, seat - 14.5, 0.7)
  dot(...at(5, seat - 16), 0.7)
  // A white scarf flying behind.
  line(1.5, seat - 9, -8 - 2 * stretch, seat - 8 + 1.5 * Math.sin(turn + 1), 1.2, 0.5, light)

  const paint = (pixels: Set<number>, color: Rgb) => {
    for (const k of pixels) frame.set(k % 4096, Math.floor(k / 4096), color)
  }
  paint(dark, RIDER)
  paint(light, SCARF)
}
