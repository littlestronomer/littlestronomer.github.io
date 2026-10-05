import { bayer, linePoints, rgb, type Rgb } from './pixels'
import type { Plot } from './starChart'
import { seededRandom } from './tinyNet'

// The deep sky: galaxies, nebulae and clusters of stars, each a small pixel painting. They are
// placed beside the constellations where they really are. The large ones (the Andromeda Galaxy,
// the North America Nebula, the Veil) are drawn at or near their real size on the chart. The
// small ones would be less than a pixel across, so they are drawn larger than life, the way a
// star chart marks them with a symbol.

type Point = { x: number; y: number }

/** A place on a chart, and how the sky lies around it there. */
export type Spot = Point & {
  /** One degree of sky toward the north and toward the east, in chart pixels. */
  north: Point
  east: Point
}

/** Which painting stands for a deep-sky object. */
export type SightShape =
  | 'andromeda'
  | 'bode'
  | 'pinwheel'
  | 'whirlpool'
  | 'triplet'
  | 'ring'
  | 'northAmerica'
  | 'veil'
  | 'crab'
  | 'pleiades'
  | 'cluster'
  | 'globular'

/** A deep-sky object near a constellation: a galaxy, a nebula or a cluster of stars. */
export type Sight = {
  /** Its name on star charts, written beside it while its constellation is lit. */
  tag: string
  /** What it is called, shown beside the cursor. */
  name: string
  /** Its place in the sky, in degrees (J2000). */
  ra: number
  dec: number
  /** How far away it is, in light-years, where a parallax tells. The others are farther than the scale goes. */
  ly?: number
  shape: SightShape
  /** How wide a cluster of stars is, in minutes of arc. */
  across?: number
}

type Tones = { heart: Rgb; body: Rgb; rim: Rgb }

const INK = {
  // A galaxy's heart is yellow with old stars, and its arms are blue with young ones.
  galaxy: { heart: rgb('#fff0cc'), body: rgb('#c0b2ee'), rim: rgb('#7f77cb') },
  arm: rgb('#9fb8ff'),
  // Glowing hydrogen is red, and glowing oxygen is blue-green.
  hydrogen: rgb('#f0618a'),
  hydrogenDeep: rgb('#a8386b'),
  oxygen: rgb('#74e4d4'),
  // Young stars are blue-white, and the dust around the Pleiades shines blue in their light.
  young: rgb('#eaf0ff'),
  youngFaint: rgb('#a4b9f8'),
  dust: rgb('#5f8be6'),
  giant: rgb('#ffc182'),
  // The stars of a globular cluster are among the oldest there are.
  old: { heart: rgb('#fff3cb'), body: rgb('#e6cd92'), rim: rgb('#a98f60') },
  crab: rgb('#ffb680'),
  // A galaxy too far away to have a name, in the blues of the faint stars.
  far: { heart: rgb('#8a86d0'), body: rgb('#5450a8'), rim: rgb('#35317f') },
}

const RADIANS = Math.PI / 180
const NEXT_TO = [[1, 0], [-1, 0], [0, 1], [0, -1]]
const CORNERS = [[1, 1], [1, -1], [-1, 1], [-1, -1]]

function unit(v: Point): Point {
  const length = Math.hypot(v.x, v.y) || 1
  return { x: v.x / length, y: v.y / length }
}

/** How many chart pixels one degree of sky takes at a spot. */
function perDegree(spot: Spot) {
  return Math.hypot(spot.north.x, spot.north.y)
}

/**
 * A direction on the chart, from a position angle: the angle astronomers use for how something
 * lies in the sky, counted in degrees from north and turning toward the east.
 */
function heading(spot: Spot, angle: number): Point {
  const north = unit(spot.north)
  const east = unit(spot.east)
  const cos = Math.cos(angle * RADIANS)
  const sin = Math.sin(angle * RADIANS)
  return unit({ x: cos * north.x + sin * east.x, y: cos * north.y + sin * east.y })
}

/** The pixel reached from a spot by going `far` pixels in a direction. */
function along(spot: Point, direction: Point, far: number): Point {
  return { x: Math.round(spot.x + direction.x * far), y: Math.round(spot.y + direction.y * far) }
}

/**
 * A galaxy seen at a slant: an oval with a bright heart, whose rim thins out into the sky.
 * `long` and `wide` are its full length and width in pixels, and `axis` is the way it lies.
 */
function galaxy(plot: Plot, at: Point, long: number, wide: number, axis: Point, tones: Tones = INK.galaxy) {
  const x = Math.round(at.x)
  const y = Math.round(at.y)
  const reach = Math.ceil(long / 2)
  for (let dy = -reach; dy <= reach; dy++) {
    for (let dx = -reach; dx <= reach; dx++) {
      const out = Math.hypot((dx * axis.x + dy * axis.y) / (long / 2), (dy * axis.x - dx * axis.y) / (wide / 2))
      if (out > 1.02) continue
      if (out < 0.25) plot(x + dx, y + dy, tones.heart)
      else if (out < 0.62) plot(x + dx, y + dy, tones.body)
      // A large rim is dithered away; a small one, a pixel or two wide, is simply fainter.
      else if (long < 8 || 1.25 - out > bayer(dx, dy)) plot(x + dx, y + dy, tones.rim, long < 8 ? 0.7 : 1)
    }
  }
}

/** A galaxy seen edge on: a thin streak `long` pixels from end to end, brightest in the middle. */
function streak(plot: Plot, at: Point, long: number, axis: Point, tones: Tones = INK.galaxy) {
  const half = (long - 1) / 2
  const pixels = linePoints(at.x - axis.x * half, at.y - axis.y * half, at.x + axis.x * half, at.y + axis.y * half)
  pixels.forEach(([x, y], i) => {
    const out = Math.abs(i - (pixels.length - 1) / 2) / (pixels.length / 2)
    if (out < 0.2) plot(x, y, tones.heart)
    else if (out < 0.62) plot(x, y, tones.body)
    else plot(x, y, tones.rim, 0.8)
  })
}

/**
 * A galaxy seen from above: a bright heart in a faint disc, with two arms winding out of it.
 * `start` is the angle at which the first arm leaves the heart, and `sweep` how far around the
 * heart each arm winds on its way out, both in radians.
 */
function spiral(plot: Plot, at: Point, radius: number, start: number, sweep: number) {
  const x = Math.round(at.x)
  const y = Math.round(at.y)
  const reach = Math.ceil(radius)
  for (let dy = -reach; dy <= reach; dy++) {
    for (let dx = -reach; dx <= reach; dx++) {
      const out = Math.hypot(dx, dy)
      if (out > 0 && out <= radius + 0.3) plot(x + dx, y + dy, INK.galaxy.rim, 0.34 * (1 - out / (radius + 1)))
    }
  }
  const drawn = new Set(['0,0'])
  for (const arm of [0, Math.PI]) {
    for (let step = 0; step <= 64; step++) {
      const far = step / 64
      const turn = start + arm + far * sweep
      const out = 1 + (radius - 1) * far
      const dx = Math.round(out * Math.cos(turn))
      const dy = Math.round(out * Math.sin(turn))
      if (drawn.has(`${dx},${dy}`)) continue
      drawn.add(`${dx},${dy}`)
      // An arm leaves the heart in its colors and turns blue farther out, thinning as it goes.
      plot(x + dx, y + dy, far < 0.34 ? INK.galaxy.body : INK.arm, 1 - 0.5 * far)
    }
  }
  plot(x, y, INK.galaxy.heart)
}

/** A stretch of a ring around a spot: `turn` is where its middle lies, `half` how far it runs each way. */
function arc(plot: Plot, at: Point, radius: number, turn: number, half: number, colors: Rgb[]) {
  const drawn = new Set<string>()
  const steps = Math.ceil(radius * half * 4)
  for (let step = -steps; step <= steps; step++) {
    const angle = turn + (step / steps) * half
    const x = Math.round(at.x + radius * Math.cos(angle))
    const y = Math.round(at.y + radius * Math.sin(angle))
    const key = `${x},${y}`
    if (drawn.has(key)) continue
    plot(x, y, colors[drawn.size % colors.length], 1 - 0.5 * Math.abs(step / steps) ** 2)
    drawn.add(key)
  }
}

/** Paints a picture written as rows of letters, with its middle at (x, y). */
function stamp(plot: Plot, x: number, y: number, rows: string[], middle: Point, colors: Record<string, Rgb>) {
  rows.forEach((row, dy) =>
    [...row].forEach((letter, dx) => {
      if (colors[letter]) plot(x + dx - middle.x, y + dy - middle.y, colors[letter])
    }),
  )
}

// The North America Nebula as it looks with north up: the wide north, the Gulf of Mexico cut
// into its right side, and the narrow land running down to the south. The small cloud to its
// right is the Pelican Nebula.
const NORTH_AMERICA = [
  '..aAAAa......',
  '.aAAAAAaa....',
  'aAAaAAAAAa.a.',
  'aAAAAAaAa.aAa',
  '.aAAAAAa...Aa',
  '..aAAaa.a..a.',
  '...aAa.......',
  '....aa.......',
  '.....aa......',
]

// The nine brightest Pleiades, in degrees east and north of the middle of the cluster.
const PLEIADES: [east: number, north: number, bright: boolean][] = [
  [0.246, -0.009, true], // Alcyone
  [0.63, -0.061, true], // Atlas
  [0.635, 0.023, false], // Pleione
  [-0.349, -0.001, true], // Electra
  [-0.131, 0.254, true], // Maia
  [-0.017, -0.166, true], // Merope
  [-0.273, 0.353, false], // Taygeta
  [-0.365, 0.175, false], // Celaeno
  [-0.113, 0.441, false], // Asterope
]
/** The Pleiades are drawn this many pixels to the degree, so that their stars stay apart. */
const PLEIADES_GROW = 7.8

const PAINTERS: Record<SightShape, (plot: Plot, spot: Spot, sight: Sight) => void> = {
  // M31: three degrees long, six times as wide as the full Moon, and seen at a steep slant.
  andromeda(plot, spot) {
    const scale = perDegree(spot)
    galaxy(plot, spot, Math.max(9, 3.33 * scale), Math.max(3, 1.18 * scale), heading(spot, 35))
    // Its two small companions, M32 to the south and M110 to the north-west.
    plot(Math.round(spot.x - 0.4 * spot.north.x), Math.round(spot.y - 0.4 * spot.north.y), INK.galaxy.heart)
    const northWest = heading(spot, -47)
    const far = along(spot, northWest, Math.max(3, 0.61 * scale))
    plot(far.x, far.y, INK.galaxy.body)
  },

  // M81, and the Cigar Galaxy (M82) just north of it, seen edge on and lying across it.
  bode(plot, spot) {
    galaxy(plot, spot, 6, 3.6, heading(spot, 157))
    // The Cigar is set a little farther off than it is, so that the two stay apart.
    streak(plot, along(spot, unit(spot.north), Math.max(7, 0.615 * perDegree(spot))), 5, heading(spot, 65))
  },

  // M101, a spiral seen from straight above.
  pinwheel(plot, spot) {
    spiral(plot, spot, 4, 0.4, 2.8)
  },

  // M51: one of its arms reaches to a small companion galaxy, just to the north.
  whirlpool(plot, spot) {
    const companion = heading(spot, 15)
    const sweep = 2.4
    spiral(plot, spot, 3, Math.atan2(companion.y, companion.x) - sweep, sweep)
    const at = along(spot, companion, 4)
    plot(at.x, at.y, INK.galaxy.heart)
    for (const [dx, dy] of NEXT_TO) plot(at.x + dx, at.y + dy, INK.galaxy.rim, 0.5)
  },

  // M66 with M65 beside it and NGC 3628 above them: three galaxies in one small field. They
  // are spread farther apart than they are, in the same directions.
  triplet(plot, spot) {
    const grow = Math.max(1.6, 8 / perDegree(spot))
    const at = (east: number, north: number): Point => ({
      x: spot.x + (east * spot.east.x + north * spot.north.x) * grow,
      y: spot.y + (east * spot.east.y + north * spot.north.y) * grow,
    })
    galaxy(plot, spot, 3.2, 2.2, heading(spot, 170))
    streak(plot, at(-0.318, 0.101), 4, heading(spot, 173))
    streak(plot, at(0.008, 0.598), 5, heading(spot, 103))
  },

  // M57: the shell of gas a dying star has blown off, seen as a ring.
  ring(plot, spot) {
    const x = Math.round(spot.x)
    const y = Math.round(spot.y)
    for (const [dx, dy] of NEXT_TO) plot(x + dx, y + dy, INK.oxygen)
    for (const [dx, dy] of CORNERS) plot(x + dx, y + dy, INK.oxygen, 0.45)
  },

  // NGC 7000: a cloud of glowing hydrogen two degrees across, shaped like the continent.
  northAmerica(plot, spot) {
    stamp(plot, Math.round(spot.x), Math.round(spot.y), NORTH_AMERICA, { x: 4, y: 3 }, {
      A: INK.hydrogen,
      a: INK.hydrogenDeep,
    })
  },

  // The Cygnus Loop: what is left of a star that blew up, a ring of gas three degrees across.
  // Its two bright arcs are the Veil Nebula: the eastern veil, and the thinner western one.
  veil(plot, spot) {
    const scale = perDegree(spot)
    const colors = [INK.oxygen, INK.hydrogen, INK.oxygen]
    const east = heading(spot, 47)
    const west = heading(spot, 272)
    arc(plot, spot, 1.56 * scale, Math.atan2(east.y, east.x), 0.5, colors)
    arc(plot, spot, 1.15 * scale, Math.atan2(west.y, west.x), 0.45, colors)
  },

  // M1: the cloud left by the exploding star that was seen in the year 1054.
  crab(plot, spot) {
    const x = Math.round(spot.x)
    const y = Math.round(spot.y)
    plot(x, y, INK.crab)
    plot(x + 1, y, INK.crab, 0.75)
    plot(x - 1, y, INK.crab, 0.4)
    plot(x, y + 1, INK.oxygen, 0.5)
    plot(x + 1, y + 1, INK.crab, 0.4)
  },

  // M45: a small dipper of blue-white stars, with dust around them shining in their light.
  pleiades(plot, spot) {
    const north = unit(spot.north)
    const east = unit(spot.east)
    const at = (eastward: number, northward: number): Point => ({
      x: Math.round(spot.x + (eastward * east.x + northward * north.x) * PLEIADES_GROW),
      y: Math.round(spot.y + (eastward * east.y + northward * north.y) * PLEIADES_GROW),
    })
    const middle = at(0.135, 0.137)
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -6; dx <= 6; dx++) {
        const out = Math.hypot(dx / 6.4, dy / 3.6)
        if (out < 1) plot(middle.x + dx, middle.y + dy, INK.dust, 0.3 * (1 - out * out))
      }
    }
    for (const [eastward, northward, bright] of PLEIADES) {
      const star = at(eastward, northward)
      plot(star.x, star.y, bright ? INK.young : INK.youngFaint)
    }
  },

  // An open cluster: young stars born together and still loosely in company, with one orange
  // giant among the blue-white ones, in the glow of its fainter stars.
  cluster(plot, spot, sight) {
    const x = Math.round(spot.x)
    const y = Math.round(spot.y)
    const reach = Math.max(2.5, (((sight.across ?? 30) / 60) * perDegree(spot)) / 2)
    const span = Math.ceil(reach)
    for (let dy = -span; dy <= span; dy++) {
      for (let dx = -span; dx <= span; dx++) {
        const out = Math.hypot(dx, dy) / (reach + 0.6)
        if (out < 1) plot(x + dx, y + dy, INK.youngFaint, 0.2 * (1 - out * out))
      }
    }
    // The stars keep a pixel apart, so that each can be told from the next.
    const random = seededRandom(Math.round(sight.ra * 100))
    const taken = new Set<string>()
    const wanted = Math.round(reach * 2)
    for (let tries = 0; taken.size < wanted && tries < wanted * 12; tries++) {
      const turn = random() * 2 * Math.PI
      const out = reach * Math.sqrt(random())
      const dx = Math.round(out * Math.cos(turn))
      const dy = Math.round(out * Math.sin(turn))
      if (taken.has(`${dx},${dy}`) || NEXT_TO.some(([nx, ny]) => taken.has(`${dx + nx},${dy + ny}`))) continue
      plot(x + dx, y + dy, taken.size === 0 ? INK.giant : taken.size % 3 === 2 ? INK.youngFaint : INK.young)
      taken.add(`${dx},${dy}`)
    }
  },

  // A globular cluster: hundreds of thousands of old stars packed into a ball.
  globular(plot, spot) {
    const x = Math.round(spot.x)
    const y = Math.round(spot.y)
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const out = Math.hypot(dx, dy)
        if (out === 0) plot(x, y, INK.old.heart)
        else if (out <= 1) plot(x + dx, y + dy, INK.old.body)
        else if (out < 1.5) plot(x + dx, y + dy, INK.old.rim, 0.85)
        else if (out < 2.3 && bayer(dx, dy) < 0.56) plot(x + dx, y + dy, INK.old.rim, 0.5)
      }
    }
  },
}

/** Paints a deep-sky object at its place on a chart. */
export function plotSight(plot: Plot, sight: Sight, spot: Spot) {
  PAINTERS[sight.shape](plot, spot, sight)
}

/** The corners of the smallest box that holds everything a deep-sky object's painting covers. */
export function sightBox(sight: Sight, spot: Spot) {
  const box = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity }
  plotSight(
    (x, y) => {
      box.left = Math.min(box.left, x)
      box.top = Math.min(box.top, y)
      box.right = Math.max(box.right, x)
      box.bottom = Math.max(box.bottom, y)
    },
    sight,
    spot,
  )
  return box
}

/**
 * A galaxy too far away to have a name: a faint streak or oval in the sky's own blues, lying
 * whichever way `random` turns it.
 */
export function plotFarGalaxy(plot: Plot, x: number, y: number, random: () => number) {
  const turn = random() * Math.PI
  const long = 3 + Math.floor(random() ** 1.6 * 6)
  const wide = 1.2 + random() * (long / 2.6)
  galaxy(plot, { x, y }, long, wide, { x: Math.cos(turn), y: Math.sin(turn) }, INK.far)
}
