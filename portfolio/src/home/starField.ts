import { Pixels, clearPlot, rgb, type Rgb } from './pixels'
import { plotStar, type Look, type Plot } from './starChart'
import { seededRandom } from './tinyNet'

// The loose stars of the sky behind the page: the ones that belong to no constellation. Each
// has a depth of its own. The nearer a star is, the farther it moves as the page scrolls, and
// the larger and brighter it is drawn; and there are many more far stars than near ones. So
// the stars pass one another as the page scrolls, and the sky reads as a space with depth
// instead of a few flat sheets.
//
// About half of them twinkle the way the stars in the header do: each in its own slow rhythm
// shines one step brighter for a moment, and later one step dimmer. A bright star that shines
// grows arms for that moment.

/** The colors of stars one pixel across, from the faintest to the brightest. */
export const STAR_COLORS = ['#2c2969', '#48449a', '#8a86d0', '#d9d6ff'].map(rgb)
/** A few stars are not blue-white: these are the cool orange ones and the hot blue ones. */
export const STAR_TINTS = ['#d9b48f', '#9ccdea'].map(rgb)

/**
 * How deep the loose stars lie, given as the share of the page's scrolling that a star follows:
 * the farthest are just in front of the Milky Way and barely move, and the nearest almost keep
 * up with the page.
 */
const DEPTH = { far: 0.14, near: 0.92 }
/** How fast the stars thin out toward the viewer: their number falls with this power of their drift. */
const THINNING = 1.6
/** One loose star on screen to about this many sky pixels. */
const STAR_ROOM = 520
/** The share of the stars that twinkle. The faintest never do. */
const TWINKLERS = 0.45
/** A star's picture reaches this far from its middle, in sky pixels. */
const REACH = 2
const CELL = REACH * 2 + 1

/** A loose star, placed in the sky. */
export type FieldStar = {
  /** Its place in sky pixels: across the sky, and down the strip of sky that it travels. */
  x: number
  y: number
  /** How far it moves for each pixel the page scrolls. */
  drift: number
  /** Which of the PICTURES it is drawn with. */
  picture: number
  /**
   * Its twinkling: where in its rhythm it starts, and how fast the rhythm runs, in radians a
   * second. A steady star has no speed.
   */
  phase: number
  speed: number
}

/** How a star is drawn: as one pixel of a color, or with arms like the stars of a constellation. */
type Picture = { dot: Rgb } | { size: number; look: Look }

const PICTURES: Picture[] = [
  { dot: STAR_COLORS[1] },
  { dot: STAR_COLORS[2] },
  { dot: STAR_COLORS[3] },
  { dot: STAR_TINTS[0] },
  { dot: STAR_TINTS[1] },
  { size: 0, look: 'blue' },
  { size: 0, look: 'gold' },
  { size: 1, look: 'blue' },
  { size: 1, look: 'gold' },
  { size: 2, look: 'blue' },
  { size: 2, look: 'gold' },
]
// Where each kind of picture is in the list. A golden star with arms comes right after the
// blue-white one of the same size.
const FAINT_DOT = 0
const DOT = 1
const BRIGHT_DOT = 2
const ORANGE_DOT = 3
const BLUE_DOT = 4
const ARMS = [5, 7, 9]
/**
 * For each picture, the picture one step brighter and the one a step dimmer, which a star shows
 * while it twinkles: a dot grows brighter and then grows arms, and arms grow longer. The orange
 * and blue dots only brighten, and the largest stars only dim.
 */
const BRIGHTER = [DOT, BRIGHT_DOT, ARMS[0], ARMS[0] + 1, ARMS[0], ARMS[1], ARMS[1] + 1, ARMS[2], ARMS[2] + 1, ARMS[2], ARMS[2] + 1]
const DIMMER = [FAINT_DOT, FAINT_DOT, DOT, ORANGE_DOT, BLUE_DOT, BRIGHT_DOT, ORANGE_DOT, ARMS[0], ARMS[0] + 1, ARMS[1], ARMS[1] + 1]

/**
 * Which picture a star at some depth gets. Far stars are faint dots; nearer ones are brighter,
 * a few of them orange or blue; and many of the nearest have arms, a few of them golden.
 */
function pictureAt(drift: number, random: () => number) {
  const roll = random()
  const gold = random() < 0.22 ? 1 : 0
  const dot = (plain: number) => {
    const tint = random()
    return tint < 0.1 ? ORANGE_DOT : tint < 0.16 ? BLUE_DOT : plain
  }
  if (drift > 0.7) return roll < 0.06 ? ARMS[2] + gold : roll < 0.24 ? ARMS[1] + gold : roll < 0.48 ? ARMS[0] + gold : dot(BRIGHT_DOT)
  if (drift > 0.48) return roll < 0.09 ? ARMS[0] + gold : dot(BRIGHT_DOT)
  if (drift > 0.28) return dot(roll < 0.45 ? BRIGHT_DOT : DOT)
  return roll < 0.4 ? DOT : FAINT_DOT
}

/**
 * Scatters the loose stars over a sky `width` pixels wide whose window is `view` pixels tall.
 * A star that drifts more travels a taller strip of sky by the end of the page, which `tall`
 * gives; so there are more stars like it altogether, and as many on screen at any moment.
 * The stars come back sorted from the farthest to the nearest.
 */
export function scatterField(width: number, view: number, tall: (drift: number) => number, seed: number) {
  const random = seededRandom(seed)
  const onScreen = Math.round((width * view) / STAR_ROOM)
  // The depths are spread so that far stars are many and near ones few.
  const power = 1 - THINNING
  const from = DEPTH.far ** power
  const to = DEPTH.near ** power
  const stars: FieldStar[] = []
  for (let i = 0; i < onScreen; i++) {
    const depth = () => (from - ((i + random()) / onScreen) * (from - to)) ** (1 / power)
    let drift = depth()
    // Each star on screen stands for several in all: as many as its strip is taller than the window.
    for (let left = tall(drift) / view; left > 0; left--) {
      if (left < 1 && random() > left) break
      const picture = pictureAt(drift, random)
      stars.push({
        x: Math.floor(random() * width),
        y: Math.floor(random() * tall(drift)),
        drift,
        picture,
        phase: random() * 2 * Math.PI,
        // The same pace as the stars in the header: a rhythm of three to twelve seconds.
        speed: picture !== FAINT_DOT && random() < TWINKLERS ? 0.5 + random() * 1.8 : 0,
      })
      drift = depth()
    }
  }
  return stars.sort((a, b) => a.drift - b.drift)
}

function plotPicture(plot: Plot, picture: Picture, x: number, y: number) {
  if ('dot' in picture) plot(x, y, picture.dot)
  else plotStar(plot, { x, y, size: picture.size, look: picture.look })
}

/** Paints the stars where they stand before the page has scrolled at all. */
export function plotField(plot: Plot, stars: FieldStar[]) {
  for (const star of stars) plotPicture(plot, PICTURES[star.picture], star.x, star.y)
}

/** Every picture of a star in a row, each in a cell of its own, for stamping onto a canvas. */
export function starSheet() {
  const sheet = new Pixels(PICTURES.length * CELL, CELL)
  const plot = clearPlot(sheet)
  PICTURES.forEach((picture, i) => plotPicture(plot, picture, i * CELL + REACH, REACH))
  return sheet
}

/** The picture a star shows at a moment: its own, or one a step brighter or dimmer while it twinkles. */
function pictureNow(star: FieldStar, now: number) {
  if (!star.speed) return star.picture
  const wave = Math.sin((now / 1000) * star.speed + star.phase)
  return wave > 0.75 ? BRIGHTER[star.picture] : wave < -0.8 ? DIMMER[star.picture] : star.picture
}

/**
 * Draws the stars on a canvas the size of the window, as they stand when the page has scrolled
 * `scrolled` screen pixels, and as they twinkle at the moment `now`, in milliseconds: each has
 * moved up by its own share of the scrolling. `sheet` is a canvas holding the starSheet, and
 * `scale` is how many screen pixels one sky pixel takes.
 */
export function drawField(
  pen: CanvasRenderingContext2D,
  sheet: CanvasImageSource,
  stars: FieldStar[],
  scale: number,
  scrolled: number,
  now: number,
) {
  const { width, height } = pen.canvas
  const size = CELL * scale
  pen.clearRect(0, 0, width, height)
  pen.imageSmoothingEnabled = false
  for (const star of stars) {
    const top = Math.round(star.y * scale - scrolled * star.drift) - REACH * scale
    if (top > height || top < -size) continue
    pen.drawImage(sheet, pictureNow(star, now) * CELL, 0, CELL, CELL, (star.x - REACH) * scale, top, size, size)
  }
}
