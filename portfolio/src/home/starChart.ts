import { rgb, type Rgb } from './pixels'

// Shared pieces for drawing star charts in pixels: the header's Orion and the constellations
// behind the page use the same stars, the same lettering and the same map projection.

/** A star's color: a red giant, a yellow star, or the usual blue-white. */
export type Look = 'red' | 'gold' | 'blue'

/** Paints one pixel; alpha below 1 blends it over what is already there. */
export type Plot = (x: number, y: number, color: Rgb, alpha?: number) => void

/**
 * A star placed on a chart. `size` 2 is among the sky's brightest, 0 is faint. A star that
 * twinkles is drawn a size larger or smaller for a moment: 3 has longer arms still, and -1 is a
 * bare dot.
 */
export type ChartStar = { x: number; y: number; size: number; look: Look }

export const STAR_LOOKS: Record<Look, { core: Rgb; arm: Rgb }> = {
  red: { core: rgb('#ffe2c4'), arm: rgb('#ff9a5c') },
  gold: { core: rgb('#fff6d8'), arm: rgb('#ffd98a') },
  blue: { core: rgb('#f4f2ff'), arm: rgb('#b9c9ff') },
}

const NEAR = [[1, 0], [-1, 0], [0, 1], [0, -1]]
const FAR = [[2, 0], [-2, 0], [0, 2], [0, -2]]
const FARTHEST = [[3, 0], [-3, 0], [0, 3], [0, -3]]
const DIAGONAL = [[1, 1], [1, -1], [-1, 1], [-1, -1]]

/** One star: a bright core with four arms, larger for brighter stars or when `glow` lights it. */
export function plotStar(plot: Plot, star: ChartStar, glow: Rgb | null = null) {
  const look = STAR_LOOKS[star.look]
  plot(star.x, star.y, look.core)
  if (star.size < 0 && !glow) return
  const arm = glow ?? look.arm
  const faint = star.size === 0 && !glow
  for (const [dx, dy] of NEAR) plot(star.x + dx, star.y + dy, arm, faint ? 0.55 : 1)
  if (star.size < 2 && !glow) return
  const flaring = star.size > 2 && !glow
  for (const [dx, dy] of FAR) plot(star.x + dx, star.y + dy, arm, flaring ? 0.85 : 0.5)
  for (const [dx, dy] of DIAGONAL) plot(star.x + dx, star.y + dy, arm, flaring ? 0.5 : 0.3)
  if (flaring) for (const [dx, dy] of FARTHEST) plot(star.x + dx, star.y + dy, arm, 0.4)
}

// How stars twinkle, in the header and behind the page alike: each in its own slow rhythm
// shines one step brighter for a moment, and later one step dimmer.
/**
 * A twinkling star's rhythm has a pace of its own, in radians a second: from the first of these
 * up to the two together, which is a rhythm of three to twelve seconds.
 */
export const TWINKLE_PACE = { slowest: 0.5, spread: 1.8 }

/**
 * Whether a twinkling star shines a step brighter (1), a step dimmer (-1) or as it is (0) at the
 * moment `now`, in milliseconds. `speed` is its pace and `phase` where in its rhythm it starts.
 */
export function twinkleAt(phase: number, speed: number, now: number) {
  const wave = Math.sin((now / 1000) * speed + phase)
  return wave > 0.75 ? 1 : wave < -0.8 ? -1 : 0
}

// A tiny pixel font for chart labels: capitals and digits, five pixels tall.
const GLYPHS: Record<string, string[]> = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'],
  B: ['##.', '#.#', '##.', '#.#', '##.'],
  C: ['.##', '#..', '#..', '#..', '.##'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'],
  E: ['###', '#..', '##.', '#..', '###'],
  F: ['###', '#..', '##.', '#..', '#..'],
  G: ['.##', '#..', '#.#', '#.#', '.##'],
  H: ['#.#', '#.#', '###', '#.#', '#.#'],
  I: ['###', '.#.', '.#.', '.#.', '###'],
  J: ['..#', '..#', '..#', '#.#', '.#.'],
  K: ['#.#', '#.#', '##.', '#.#', '#.#'],
  L: ['#..', '#..', '#..', '#..', '###'],
  M: ['#...#', '##.##', '#.#.#', '#...#', '#...#'],
  N: ['#..#', '##.#', '#.##', '#..#', '#..#'],
  O: ['###', '#.#', '#.#', '#.#', '###'],
  P: ['##.', '#.#', '##.', '#..', '#..'],
  Q: ['###', '#.#', '#.#', '###', '..#'],
  R: ['##.', '#.#', '##.', '#.#', '#.#'],
  S: ['.##', '#..', '.#.', '..#', '##.'],
  T: ['###', '.#.', '.#.', '.#.', '.#.'],
  U: ['#.#', '#.#', '#.#', '#.#', '###'],
  V: ['#.#', '#.#', '#.#', '#.#', '.#.'],
  W: ['#...#', '#...#', '#.#.#', '##.##', '#...#'],
  X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'],
  Z: ['###', '..#', '.#.', '#..', '###'],
  0: ['###', '#.#', '#.#', '#.#', '###'],
  1: ['.#.', '##.', '.#.', '.#.', '###'],
  2: ['##.', '..#', '.#.', '#..', '###'],
  3: ['##.', '..#', '.#.', '..#', '##.'],
  4: ['#.#', '#.#', '###', '..#', '..#'],
  5: ['###', '#..', '##.', '..#', '##.'],
  6: ['.##', '#..', '###', '#.#', '###'],
  7: ['###', '..#', '.#.', '.#.', '.#.'],
  8: ['###', '#.#', '###', '#.#', '###'],
  9: ['###', '#.#', '###', '..#', '##.'],
  ' ': ['..', '..', '..', '..', '..'],
}

/** How many pixels wide a word is in the label font. */
export function wordWidth(word: string) {
  return [...word].reduce((sum, letter) => sum + GLYPHS[letter][0].length + 1, -1)
}

/** Writes a word in capitals with its top-left corner at (x, y). */
export function plotWord(plot: Plot, word: string, x: number, y: number, color: Rgb, alpha = 1) {
  let left = x
  for (const letter of word) {
    const glyph = GLYPHS[letter]
    glyph.forEach((row, dy) => [...row].forEach((cell, dx) => cell === '#' && plot(left + dx, y + dy, color, alpha)))
    left += glyph[0].length + 1
  }
}

// The shine that runs through a constellation under the cursor: a crest of light that crosses
// it from the upper left to the lower right, rests a moment, and sets off again, the way a
// Mexican wave goes around a stadium. Between crests the lines stay softly lit.
const WAVE = { travelMs: 1100, restMs: 650, width: 0.3, rest: 0.26 }

/**
 * How bright the shine is at one point. `along` runs from 0 at the chart's upper left corner to
 * 1 at its lower right, and `elapsed` is the time in milliseconds since the cursor arrived.
 */
export function shineAt(along: number, elapsed: number) {
  const travelled = (elapsed % (WAVE.travelMs + WAVE.restMs)) / WAVE.travelMs
  const crest = travelled * (1 + 2 * WAVE.width) - WAVE.width
  const near = Math.max(0, 1 - Math.abs(along - crest) / WAVE.width)
  return WAVE.rest + (1 - WAVE.rest) * near * near * (3 - 2 * near)
}

/**
 * One crest of the same light, crossing a chart a single time in `ms` milliseconds: nothing
 * before it comes, and nothing once it has passed.
 */
export function crestAt(along: number, elapsed: number, ms: number) {
  const crest = (elapsed / ms) * (1 + 2 * WAVE.width) - WAVE.width
  const near = Math.max(0, 1 - Math.abs(along - crest) / WAVE.width)
  return near * near * (3 - 2 * near)
}

const RADIANS = Math.PI / 180

/**
 * A flat map of the sky around (ra0, dec0), both in degrees: the gnomonic projection that star
 * charts use, with north up and east to the left as the sky looks from the ground. Returns a
 * function that turns a star's coordinates into degrees right of and above the centre.
 */
export function skyMap(ra0: number, dec0: number) {
  const sin0 = Math.sin(dec0 * RADIANS)
  const cos0 = Math.cos(dec0 * RADIANS)
  return (ra: number, dec: number) => {
    const sinDec = Math.sin(dec * RADIANS)
    const cosDec = Math.cos(dec * RADIANS)
    const turn = (ra - ra0) * RADIANS
    const depth = sin0 * sinDec + cos0 * cosDec * Math.cos(turn)
    return {
      right: (-cosDec * Math.sin(turn)) / depth / RADIANS,
      up: (cos0 * sinDec - sin0 * cosDec * Math.cos(turn)) / depth / RADIANS,
    }
  }
}
