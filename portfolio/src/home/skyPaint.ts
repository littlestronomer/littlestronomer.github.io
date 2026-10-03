import { plotFarGalaxy, plotSight } from './deepSky'
import { Pixels, bayer, mix, rgb, type Rgb } from './pixels'
import type { Figure } from './skyFigures'
import { plotStar, plotWord, type Plot } from './starChart'
import { STAR_COLORS } from './starField'
import { seededRandom } from './tinyNet'

// The painting of the sky behind the page. The far layer is the night itself: the Milky Way
// with its clouds of light and its lane of dust, the faintest stars, and galaxies too far away
// to have a name. The middle layer holds the constellations and the deep-sky objects beside
// them. The loose stars between and in front of these are not painted here: each has a depth
// of its own (see starField.ts).
//
// In the Turkish theme there is no sky at all: the background is a wall of small Turkish flags,
// laid like bricks, each row half a flag along from the one above.

/** One nameless far galaxy to about this many sky pixels. */
const FAR_GALAXY_ROOM = 26000
/** How bright a deep-sky object is while its constellation is not lit. */
const SIGHT_AT_REST = 0.55
const HALO_AROUND = [[1, 0], [-1, 0], [0, 1], [0, -1]]
/** The size of one small flag in the Turkish theme's wall, in sky pixels. */
const FLAG = { width: 30, height: 20 }

export const INK = {
  sky: rgb('#100f2b'),
  /** The Milky Way's light, from its thin edges to the thick of its clouds. */
  haze: ['#17143c', '#1d194a', '#252057'].map(rgb),
  /** The same light toward the middle of the galaxy, where it is warmer. */
  warmHaze: ['#1a1339', '#231745', '#2e1c4f'].map(rgb),
  line: rgb('#35317f'),
  name: rgb('#443f96'),
  lit: rgb('#e3f4ff'),
  halo: rgb('#6fbcff'),
  litName: rgb('#ffe7a3'),
}

/** Where the Milky Way runs on a layer: from the upper right to the lower left. */
function milkyWay(width: number, height: number) {
  return { middle: (y: number) => width * (0.88 - (0.76 * y) / height), half: Math.max(34, width * 0.15) }
}

/**
 * Smooth noise between 0 and 1: random values on a grid, blended from each corner to the next.
 * It gives clouds their clumps.
 */
function cloudNoise(seed: number) {
  const SIZE = 64
  const random = seededRandom(seed)
  const grid = Float32Array.from({ length: SIZE * SIZE }, () => random())
  const at = (x: number, y: number) => grid[(y & (SIZE - 1)) * SIZE + (x & (SIZE - 1))]
  return (x: number, y: number) => {
    const left = Math.floor(x)
    const top = Math.floor(y)
    const across = (x - left) ** 2 * (3 - 2 * (x - left))
    const down = (y - top) ** 2 * (3 - 2 * (y - top))
    const upper = at(left, top) + (at(left + 1, top) - at(left, top)) * across
    const lower = at(left, top + 1) + (at(left + 1, top + 1) - at(left, top + 1)) * across
    return upper + (lower - upper) * down
  }
}

/**
 * The stars that are part of the far layer, each one pixel across: a dust of the faintest
 * stars everywhere, and the Milky Way's own, thick along its band and some of them brighter.
 */
function scatterFarStars(plot: Plot, width: number, height: number) {
  const random = seededRandom(2026)
  const band = milkyWay(width, height)
  const scatter = (room: number, colors: Rgb[], x: (y: number) => number) => {
    for (let left = Math.round((width * height) / room); left > 0; left--) {
      const y = Math.floor(random() * height)
      plot(x(y), y, colors[Math.floor(random() ** 2.4 * colors.length)])
    }
  }
  const alongBand = (y: number) => band.middle(y) + (random() + random() - 1) * band.half
  scatter(148, STAR_COLORS.slice(0, 2), () => Math.floor(random() * width))
  scatter(296, STAR_COLORS.slice(0, 2), alongBand)
  scatter(1100, STAR_COLORS.slice(1, 3), alongBand)
}

/**
 * The farthest layer: the night itself, the Milky Way, the faintest stars and the far galaxies.
 * The Milky Way is our own galaxy seen from inside: a band of light in clumps, split along its
 * length by a dark lane of dust, and warmer in color toward the galaxy's middle, which lies at
 * the band's lower end here.
 */
export function paintFar(width: number, height: number) {
  const sky = new Pixels(width, height)
  const data = sky.image.data
  const band = milkyWay(width, height)
  const clouds = cloudNoise(1785)
  for (let y = 0; y < height; y++) {
    const middle = band.middle(y)
    // The lane of dust wanders from one side of the band's middle to the other.
    const lane = (clouds(y / 90, 11.5) - 0.5) * 0.9
    const warmth = Math.min(1, Math.max(0, (y / height - 0.45) / 0.45))
    for (let x = 0; x < width; x++) {
      const across = (x - middle) / band.half
      let color = INK.sky
      if (Math.abs(across) < 1.35) {
        const clump = 0.6 * clouds(x / 44, y / 44) + 0.3 * clouds(x / 19 + 31, y / 19) + 0.1 * clouds(x / 7, y / 7 + 31)
        let light = 1 - Math.abs(across) + (clump - 0.5) * 1.1
        const dust = Math.exp(-(((across - lane) / 0.2) ** 2)) * (0.45 + 0.75 * clouds(x / 27 + 5, y / 27 + 57))
        light = Math.min(1, Math.max(0, light * 0.95) * (1 - 0.85 * Math.min(1, dust)))
        // Three tones of light, each dithered into the next.
        const level = light * INK.haze.length
        const tone = Math.min(INK.haze.length, Math.floor(level) + (level % 1 > bayer(x, y) ? 1 : 0))
        if (tone > 0) color = mix(INK.haze[tone - 1], INK.warmHaze[tone - 1], warmth)
      }
      const k = (y * width + x) * 4
      data[k] = color[0]
      data[k + 1] = color[1]
      data[k + 2] = color[2]
      data[k + 3] = 255
    }
  }
  const plot: Plot = (x, y, color, alpha = 1) => sky.set(x, y, color, alpha)
  scatterFarStars(plot, width, height)
  // Far galaxies are seen only away from the Milky Way, whose dust hides the ones behind it.
  const random = seededRandom(1923)
  for (let left = Math.round((width * height) / FAR_GALAXY_ROOM), tries = 0; left > 0 && tries < 400; tries++) {
    const x = 4 + Math.floor(random() * (width - 8))
    const y = 4 + Math.floor(random() * (height - 8))
    if (Math.abs(x - band.middle(y)) < band.half * 1.15) continue
    plotFarGalaxy(plot, x, y, random)
    left--
  }
  return sky
}

/** The middle layer: the constellations at rest, with the deep-sky objects beside them. */
export function paintMiddle(plot: Plot, figures: Figure[]) {
  const dim: Plot = (x, y, color, alpha = 1) => plot(x, y, color, alpha * SIGHT_AT_REST)
  for (const figure of figures) {
    for (const path of figure.paths) for (const [x, y] of path) plot(x, y, INK.line)
    for (const { sight, spot } of figure.sights) plotSight(dim, sight, spot)
    for (const star of figure.stars) plotStar(plot, star)
    plotWord(plot, figure.name, figure.label.x, figure.label.y, INK.name)
  }
}

/**
 * A constellation as it shines under the cursor: a halo around each line, then the bright line
 * itself, the deep-sky objects in full color with their tags, the stars and the name.
 */
export function paintLit(plot: Plot, figure: Figure) {
  for (const path of figure.paths) {
    for (const [x, y] of path) for (const [dx, dy] of HALO_AROUND) plot(x + dx, y + dy, INK.halo, 0.3)
  }
  for (const path of figure.paths) for (const [x, y] of path) plot(x, y, INK.lit)
  for (const { sight, spot, tag } of figure.sights) {
    plotSight(plot, sight, spot)
    plotWord(plot, sight.tag, tag.x, tag.y, INK.litName)
  }
  for (const star of figure.stars) plotStar(plot, star, INK.lit)
  plotWord(plot, figure.name, figure.label.x, figure.label.y, INK.litName)
}

/** One small Turkish flag, with a thin dark seam on its right and bottom. */
function smallFlag() {
  const { width, height } = FLAG
  const red = rgb('#e30a17')
  const seam = rgb('#a8080f')
  const white = rgb('#ffffff')
  const flag = new Pixels(width, height)
  // The crescent is what is left of one disc when a smaller one, set toward the star, is taken
  // out of it. Each pixel is white if most of it lies inside.
  const inCrescent = (x: number, y: number) => Math.hypot(x - 10, y - 10) <= 5 && Math.hypot(x - 11.25, y - 10) > 4
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let inside = 0
      for (let i = 0; i < 16; i++) inside += inCrescent(x + ((i % 4) + 0.5) / 4, y + (Math.floor(i / 4) + 0.5) / 4) ? 1 : 0
      flag.set(x, y, inside >= 8 ? white : x === width - 1 || y === height - 1 ? seam : red)
    }
  }
  // At this size the star is a small cross.
  for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]]) {
    flag.set(16 + dx, 10 + dy, white)
  }
  return flag
}

/** The Turkish theme's background: small flags laid like bricks, every other row half a flag along. */
export function paintFlags(width: number, height: number) {
  const flag = smallFlag()
  const wall = new Pixels(width, height)
  const from = flag.image.data
  const to = wall.image.data
  for (let y = 0; y < height; y++) {
    const along = Math.floor(y / flag.height) % 2 === 0 ? 0 : flag.width / 2
    for (let x = 0; x < width; x++) {
      const source = ((y % flag.height) * flag.width + ((x + along) % flag.width)) * 4
      const target = (y * width + x) * 4
      to[target] = from[source]
      to[target + 1] = from[source + 1]
      to[target + 2] = from[source + 2]
      to[target + 3] = 255
    }
  }
  return wall
}
