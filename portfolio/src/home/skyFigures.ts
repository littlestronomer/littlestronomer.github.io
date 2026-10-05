import { CONSTELLATIONS, NORTH_UP, WAY_TO_THE_QUEEN, type Constellation } from './constellations'
import { sightBox, type Sight, type Spot } from './deepSky'
import { linePoints } from './pixels'
import { TWINKLE_PACE, skyMap, wordWidth, type ChartStar } from './starChart'
import { seededRandom } from './tinyNet'

// Where everything on the sky behind the page stands: each constellation's stars, lines and
// name, the deep-sky objects beside it, and the trail to the Queen. Everything is measured in
// sky pixels. Nothing here draws; skyPaint.ts does that.
//
// A constellation is only a figure from where we stand: its stars lie at very different
// distances. So each star here has a depth of its own, from its real distance, and moves by it
// as the page scrolls, without ever stopping. At one place in the scrolling, the
// constellation's home, its stars line up. Far from it they are only stars among the others:
// the lines that join them, and the name, come as the figure nears its shape and go again as it
// leaves it.

/**
 * How far the two painted layers of the sky move for each pixel the page scrolls: the Milky
 * Way, far off, and the frame the constellations are drawn in.
 */
export const DRIFT = { far: 0.12, middle: 0.3 }
/**
 * How far a star moves for each pixel the page scrolls, by its distance: one ten light-years
 * away moves the most, and each tenfold step in distance takes the same amount off, down to
 * what is as far as the Milky Way's clouds and moves with them.
 */
const NEAREST = { ly: 10, drift: 0.5 }
const FARTHEST = { ly: 3000, drift: DRIFT.far }
/**
 * How far out of shape a constellation is: the gap between the star that has run farthest
 * ahead and the one that has fallen farthest behind, as a share of the constellation's own
 * size. Bent by no more than this, it counts as in shape.
 */
const IN_SHAPE = 0.05
/** A small constellation is measured as if it were at least this large, or it would count as bent too soon. */
const LEAST_EXTENT = 70
/**
 * A constellation is drawn, with its lines and its name, only when it is close to being lined
 * up: then it can be touched too. In shape and near its home it is drawn in full. It thins as
 * it bends and is gone at this much out of shape, or this many sky pixels of scrolling from
 * home, fading over the last of them.
 */
const DRAWN = { lost: 0.4, within: 110, fading: 50 }
/** A constellation can be touched while it is drawn at least this much. */
const TOUCHABLE = 0.15
/**
 * A constellation is in place while it is all but exactly in shape and at its home: then it
 * glows by itself. It stops being in place at this much out of shape, or this many sky pixels
 * of scrolling from home, fading over the last of them.
 */
const IN_PLACE = { lost: 0.14, within: 90, fading: 50 }
/**
 * Room above and below a constellation for what is out of place while it shines: nothing drifts
 * more than a fifth of a pixel off the frame for each pixel scrolled, and it only shines within
 * DRAWN.within of home.
 */
const LOOSE_ROOM = 24
/** How close the cursor must come to a line, in sky pixels, to light it. */
export const REACH = 7
/** Anywhere inside a constellation's outline lights it too, and this far outside it. */
const OUTLINE_REACH = 3
/** How close the cursor must come to a deep-sky object to be on it. */
const SIGHT_REACH = 3
/** Room around a constellation for its stars' arms and its lines' halo. */
const MARGIN = 5
const RADIANS = Math.PI / 180

export type Box = { left: number; top: number; right: number; bottom: number }
export type Point = { x: number; y: number }
/** A stretch of the sky from top to bottom. */
export type Span = { top: number; bottom: number }

/** Turns a place in the sky, in degrees, into a place on a chart, in sky pixels. */
type Place = (ra: number, dec: number) => Point

/**
 * A star of a constellation, placed on the sky. `y` is where it is now, and `home` where it
 * stands when the constellation is lined up.
 */
export type FigureStar = ChartStar & {
  home: number
  /** How far it moves for each pixel the page scrolls. */
  drift: number
  /** Its twinkling, like a loose star's: where in its rhythm it starts, and the rhythm's pace in radians a second. */
  phase: number
  speed: number
}

/** A deep-sky object placed on the sky. Its place, box and tag are where they are now. */
export type PlacedSight = {
  sight: Sight
  spot: Spot
  /** The corners of what its painting covers. */
  box: Box
  /** The top left corner of its tag. */
  tag: Point
  /** How far it moves for each pixel the page scrolls, and how far that has carried it from its home. */
  drift: number
  moved: number
}

/** A constellation placed on the sky, in sky pixels. */
export type Figure = {
  name: string
  lane: Constellation['lane']
  whisper?: string
  stars: FigureStar[]
  /** The pixels of each line between two stars, where the stars are now. There are none while it is not drawn. */
  paths: [number, number][][]
  /** The same lines as end points, for measuring how close the cursor is. */
  segments: [FigureStar, FigureStar][]
  /** The corners of the space the constellation takes up, in order around it. */
  outline: Point[]
  box: Box
  label: Point
  /** The galaxies, nebulae and clusters beside it. */
  sights: PlacedSight[]
  /**
   * How far the page has scrolled, in screen pixels, when the constellation is lined up. Whoever
   * places the sky on a page sets it.
   */
  home: number
  /** Its size when it is lined up: the longer of its width and height, or LEAST_EXTENT if that is more. */
  extent: number
  /** How much its lines and its name show, from 0 to 1: nothing far from its shape or its home, all of them there. */
  shown: number
  /** How exactly it is in place, from 0 to 1. In place, it glows by itself. */
  placed: number
  /** Whether it has come into place and not left since, and when it last did: a crest of light crosses it then. */
  settled: boolean
  struck: number
  /** Everything that can light up, with room to spare: the stars, the lines, the name and the deep-sky objects. */
  frame: Box
  /** A small canvas of its own, laid over the sky, where its shine is drawn. */
  pen: CanvasRenderingContext2D | null
  /** How lit it is now and how lit it should become, from 0 to 1. */
  glow: number
  target: number
  /** When the cursor arrived, which is when the wave of light sets off. */
  since: number
  /** Whether its canvas has anything on it. */
  painted: boolean
}

/** The dotted trail from the Great Bear through the North Star to the Queen. */
export type Trail = {
  /** The stars it runs through, in order, from the first pointer star to Cassiopeia. */
  stops: FigureStar[]
  northStar: FigureStar
  frame: Box
  pen: CanvasRenderingContext2D | null
  painted: boolean
}

/** The room the page leaves for the sky. */
export type Room = {
  width: number
  height: number
  /** How many sky pixels one degree of sky takes. */
  perDegree: number
  /** The middle of each lane, from the left. */
  lanes: Record<'left' | 'right' | 'side', number>
  /** How far down some constellations stand, by name, where the page has a better place for them than their own. */
  middles?: Record<string, number>
  /** The patch of open sky above the footer: its middle, and how large a chart fits in it. */
  north: Point & { width: number; height: number }
}

/** What the cursor is on: a constellation, and perhaps one of the deep-sky objects beside it. */
export type Touched = { figure: Figure; sight: PlacedSight | null }

/** How far something moves for each pixel the page scrolls, from its distance in light-years. */
function driftAt(ly = Infinity) {
  const far = Math.log(ly / NEAREST.ly) / Math.log(FARTHEST.ly / NEAREST.ly)
  return NEAREST.drift + (FARTHEST.drift - NEAREST.drift) * Math.min(1, Math.max(0, far))
}

/** The middle of a group of stars on the sky, found by averaging their directions. */
function middleOf(stars: { ra: number; dec: number }[]) {
  let x = 0
  let y = 0
  let z = 0
  for (const star of stars) {
    const ra = star.ra * RADIANS
    const dec = star.dec * RADIANS
    x += Math.cos(dec) * Math.cos(ra)
    y += Math.cos(dec) * Math.sin(ra)
    z += Math.sin(dec)
  }
  return { ra: Math.atan2(y, x) / RADIANS, dec: Math.atan2(z, Math.hypot(x, y)) / RADIANS }
}

/**
 * A chart for one constellation alone, north up, with its middle as near (centerX, centerY) as
 * fits. The deep-sky objects beside it count for the fit from side to side, so that they stay
 * in the sky with it.
 */
function chartAlone(chart: Constellation, centerX: number, centerY: number, perDegree: number, width: number): Place {
  const middle = middleOf(chart.stars)
  const map = skyMap(middle.ra, middle.dec)
  const flat = (ra: number, dec: number) => {
    const point = map(ra, dec)
    return { x: point.right * perDegree, y: -point.up * perDegree }
  }
  const stars = chart.stars.map((star) => flat(star.ra, star.dec))
  // A deep-sky object is wider than a star, so it is given some room of its own.
  const sides = [
    ...stars.map((star) => star.x),
    ...(chart.sights ?? []).flatMap((sight) => [flat(sight.ra, sight.dec).x - 7, flat(sight.ra, sight.dec).x + 7]),
  ]
  const half = (Math.max(...sides) - Math.min(...sides)) / 2
  const midX = (Math.max(...sides) + Math.min(...sides)) / 2
  const midY = (Math.max(...stars.map((star) => star.y)) + Math.min(...stars.map((star) => star.y))) / 2
  const x0 = half * 2 + 8 > width ? width / 2 : Math.min(Math.max(centerX, half + 4), width - half - 4)
  return (ra, dec) => {
    const point = flat(ra, dec)
    return { x: x0 + point.x - midX, y: centerY + point.y - midY }
  }
}

/**
 * The northern constellations on one chart around the pole, as they stand when you face north:
 * each star sits as many degrees from the pole as its declination is short of 90, turned by its
 * right ascension. The chart is centred on (centerX, centerY) and shrunk until the stars fit
 * the room. The deep-sky objects beside them do not count for the fit: one that falls outside
 * the sky is left out instead.
 */
function chartNorth(charts: Constellation[], centerX: number, centerY: number, perDegree: number, room: Point): Place {
  const flat = (ra: number, dec: number) => {
    const fromPole = 90 - dec
    const turn = (ra - NORTH_UP) * RADIANS
    return { x: fromPole * Math.sin(turn), y: -fromPole * Math.cos(turn) }
  }
  const all = charts.flatMap((chart) => chart.stars.map((star) => flat(star.ra, star.dec)))
  const left = Math.min(...all.map((point) => point.x))
  const right = Math.max(...all.map((point) => point.x))
  const top = Math.min(...all.map((point) => point.y))
  const bottom = Math.max(...all.map((point) => point.y))
  const scale = Math.min(perDegree, room.x / (right - left), room.y / (bottom - top))
  return (ra, dec) => {
    const point = flat(ra, dec)
    return { x: centerX + (point.x - (left + right) / 2) * scale, y: centerY + (point.y - (top + bottom) / 2) * scale }
  }
}

/** A place on a chart, with the directions of north and east there, found by taking a small step each way. */
function spotOn(place: Place, ra: number, dec: number): Spot {
  const step = 0.05
  const at = place(ra, dec)
  const north = place(ra, dec + step)
  const east = place(ra + step / Math.cos(dec * RADIANS), dec)
  return {
    ...at,
    north: { x: (north.x - at.x) / step, y: (north.y - at.y) / step },
    east: { x: (east.x - at.x) / step, y: (east.y - at.y) / step },
  }
}

const inBox = (box: Box, x: number, y: number) => x >= box.left && x <= box.right && y >= box.top && y <= box.bottom
const overlap = (a: Box, b: Box) => a.left <= b.right && b.left <= a.right && a.top <= b.bottom && b.top <= a.bottom
const grown = (box: Box, by: number): Box => ({ left: box.left - by, top: box.top - by, right: box.right + by, bottom: box.bottom + by })

/** The box a word takes up when its top left corner is at a point. */
function wordBox(word: string, at: Point): Box {
  return { left: at.x, top: at.y, right: at.x + wordWidth(word) - 1, bottom: at.y + 4 }
}

/**
 * Where a deep-sky object's tag is written: beside its painting, on the first side where the
 * tag covers nothing else. It is tried close to the painting first and then farther off, and on
 * each side in turn, starting with `outward`: the side that faces away from the page.
 */
function tagBeside(tag: string, box: Box, outward: 'left' | 'right', taken: (tag: Box) => boolean): Point {
  const width = wordWidth(tag)
  const centred = Math.round((box.left + box.right + 1 - width) / 2)
  const level = Math.round((box.top + box.bottom) / 2) - 2
  const sides = {
    right: (gap: number) => ({ x: box.right + gap, y: level }),
    left: (gap: number) => ({ x: box.left - gap - width + 1, y: level }),
    below: (gap: number) => ({ x: centred, y: box.bottom + gap }),
    above: (gap: number) => ({ x: centred, y: box.top - gap - 4 }),
  }
  const order = [sides[outward], sides.below, sides.above, sides[outward === 'right' ? 'left' : 'right']]
  for (const gap of [4, 8, 12, 16]) {
    for (const side of order) if (!taken(wordBox(tag, side(gap)))) return side(gap)
  }
  return sides[outward](4)
}

/**
 * The outline of a group of points: the corners of the smallest shape without dents that holds
 * them all, in order around it.
 */
function outlineOf(points: Point[]) {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y)
  const bends = (o: Point, a: Point, b: Point) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
  /** One side of the outline, walked from end to end, dropping every point that would dent it. */
  const side = (walk: Point[]) => {
    const kept: Point[] = []
    for (const point of walk) {
      while (kept.length >= 2 && bends(kept[kept.length - 2], kept[kept.length - 1], point) <= 0) kept.pop()
      kept.push(point)
    }
    return kept.slice(0, -1)
  }
  return [...side(sorted), ...side(sorted.reverse())]
}

/** Whether a point is inside an outline, or no more than `reach` outside it. */
function insideOutline(outline: Point[], x: number, y: number, reach: number) {
  // Stars in a row enclose no space at all.
  if (outline.length < 3) return false
  return outline.every((a, i) => {
    const b = outline[(i + 1) % outline.length]
    const along = Math.hypot(b.x - a.x, b.y - a.y)
    return ((b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x)) / along >= -reach
  })
}

/**
 * Works out a constellation's lines, outline and box from where its stars are now.
 * Lines stop just short of the stars they join, so the stars stay crisp, and they make way for
 * a deep-sky object that lies on them. With a `view`, the lines are only worked out while one
 * of the stars is between its top and bottom.
 */
function trace(figure: Figure, view?: Span) {
  const { stars, sights } = figure
  figure.box = {
    left: Math.min(...stars.map((star) => star.x)) - 3,
    top: Math.min(...stars.map((star) => star.y)) - 3,
    right: Math.max(...stars.map((star) => star.x)) + 3,
    bottom: Math.max(...stars.map((star) => star.y)) + 3,
  }
  figure.outline = outlineOf(stars)
  figure.paths =
    figure.shown > 0 && (!view || stars.some((star) => star.y >= view.top && star.y <= view.bottom))
      ? figure.segments.map(([from, to]) => {
          const pixels = linePoints(from.x, from.y, to.x, to.y)
          const short = pixels.length > 6 ? pixels.slice(2, -2) : pixels.slice(1, -1)
          return short.filter(([x, y]) => !sights.some(({ box }) => inBox(box, x, y)))
        })
      : []
}

/**
 * Puts a constellation's stars, and the deep-sky objects beside it, where they are once the
 * page has scrolled `past` sky pixels beyond the constellation's home. Each has moved by its
 * own drift, where the frame the constellation is drawn in has moved by `pace`; so at home
 * everything is in place, and away from home the near stars have run ahead and the far ones
 * have fallen behind. `view` is the stretch of the sky that the window shows.
 */
export function arrange(figure: Figure, past: number, pace: number, view?: Span) {
  const moves = figure.stars.map((star) => (pace - star.drift) * past)
  figure.stars.forEach((star, i) => (star.y = star.home + Math.round(moves[i])))
  const outOfShape = (Math.max(...moves) - Math.min(...moves)) / figure.extent
  /** From 1, in shape and at home, down to 0 at the limits of how bent and how far it may be. */
  const close = (limit: { lost: number; within: number; fading: number }) =>
    Math.min(1, Math.max(0, (limit.lost - outOfShape) / (limit.lost - IN_SHAPE))) *
    Math.min(1, Math.max(0, (limit.within - Math.abs(past)) / limit.fading))
  figure.shown = close(DRAWN)
  figure.placed = close(IN_PLACE)
  for (const sight of figure.sights) {
    const moved = Math.round((pace - sight.drift) * past)
    const by = moved - sight.moved
    sight.moved = moved
    sight.spot.y += by
    sight.box.top += by
    sight.box.bottom += by
    sight.tag.y += by
  }
  trace(figure, view)
}

/** Turns a constellation and its chart into stars, lines, deep-sky objects, a name and a frame, all lined up. */
function figureFrom(chart: Constellation, place: Place, width: number): Figure {
  // Each star twinkles in a rhythm of its own, the same one every time the sky is built.
  const random = seededRandom([...chart.name].reduce((sum, letter) => sum * 31 + letter.charCodeAt(0), 7) % 100000)
  const stars = chart.stars.map((star): FigureStar => {
    const at = place(star.ra, star.dec)
    const y = Math.round(at.y)
    return {
      x: Math.round(at.x),
      y,
      home: y,
      drift: driftAt(star.ly),
      size: star.size,
      look: star.look ?? 'blue',
      phase: random() * 2 * Math.PI,
      speed: TWINKLE_PACE.slowest + random() * TWINKLE_PACE.spread,
    }
  })
  const found = (chart.sights ?? [])
    .map((sight) => {
      const spot = spotOn(place, sight.ra, sight.dec)
      return { sight, spot, box: sightBox(sight, spot), drift: driftAt(sight.ly), moved: 0 }
    })
    // One that would hang over the edge of the sky is left out.
    .filter(({ box }) => box.left >= 1 && box.right <= width - 2)
  const figure: Figure = {
    name: chart.name,
    lane: chart.lane,
    whisper: chart.whisper,
    stars,
    paths: [],
    segments: chart.lines.map(([from, to]): [FigureStar, FigureStar] => [stars[from], stars[to]]),
    outline: [],
    box: { left: 0, top: 0, right: 0, bottom: 0 },
    label: { x: 0, y: 0 },
    sights: [],
    home: 0,
    extent: 0,
    shown: 1,
    placed: 0,
    settled: false,
    struck: -Infinity,
    frame: { left: 0, top: 0, right: 0, bottom: 0 },
    pen: null,
    glow: 0,
    target: 0,
    since: 0,
    painted: false,
  }
  // The lines make way for the deep-sky objects, so those are needed first, without their tags.
  figure.sights = found.map((sight) => ({ ...sight, tag: { x: 0, y: 0 } }))
  trace(figure)
  const { box, paths } = figure
  // The box leaves three pixels around the stars.
  figure.extent = Math.max(box.right - box.left - 6, box.bottom - box.top - 6, LEAST_EXTENT)
  const labelWidth = wordWidth(chart.name)
  figure.label = {
    x: Math.round(Math.min(Math.max((box.left + box.right - labelWidth) / 2, 2), width - labelWidth - 2)),
    y: chart.nameAbove ? box.top - 9 : box.bottom + 4,
  }
  // A tag keeps clear of the stars, the lines, the name, the other deep-sky objects and their
  // tags, and the edges of the sky.
  const busy = [
    ...stars.map((star) => ({ left: star.x - 2, top: star.y - 2, right: star.x + 2, bottom: star.y + 2 })),
    wordBox(chart.name, figure.label),
    ...found.map((sight) => sight.box),
  ]
  for (const sight of figure.sights) {
    sight.tag = tagBeside(sight.sight.tag, sight.box, chart.lane === 'left' ? 'left' : 'right', (wanted) => {
      const room = grown(wanted, 1)
      return (
        wanted.left < 2 ||
        wanted.right > width - 3 ||
        busy.some((other) => overlap(room, other)) ||
        paths.some((path) => path.some(([x, y]) => inBox(room, x, y)))
      )
    })
    busy.push(wordBox(sight.sight.tag, sight.tag))
  }
  // Each thing that can light up, as a box: the stars, the name, and every deep-sky object with
  // its tag. A constellation can shine before and after it is lined up, with its stars and the
  // objects beside it above or below their places, so there is room for that too.
  const lit = [box, wordBox(chart.name, figure.label), ...figure.sights.flatMap((sight) => [sight.box, wordBox(sight.sight.tag, sight.tag)])]
  figure.frame = {
    left: Math.min(...lit.map((part) => part.left)) - MARGIN,
    top: Math.min(...lit.map((part) => part.top)) - MARGIN - LOOSE_ROOM,
    right: Math.max(...lit.map((part) => part.right)) + MARGIN,
    bottom: Math.max(...lit.map((part) => part.bottom)) + MARGIN + LOOSE_ROOM,
  }
  return figure
}

/** Places every constellation in the room the page leaves for the sky. */
export function placeFigures(room: Room): Figure[] {
  const northern = CONSTELLATIONS.filter((chart) => chart.lane === 'north')
  const north = chartNorth(northern, room.north.x, room.north.y, room.perDegree, { x: room.north.width, y: room.north.height })
  return CONSTELLATIONS.map((chart) => {
    const place =
      chart.lane === 'north'
        ? north
        : chartAlone(chart, room.lanes[chart.lane], room.middles?.[chart.name] ?? room.height * chart.down, room.perDegree, room.width)
    return figureFrom(chart, place, room.width)
  })
}

/** The trail to the Queen, through the stars named in WAY_TO_THE_QUEEN. */
export function trailThrough(figures: Figure[]): Trail | null {
  const found = WAY_TO_THE_QUEEN.map((step) => figures.find((figure) => figure.name === step.name)?.stars[step.star])
  if (found.some((stop) => !stop)) return null
  const stops = found as FigureStar[]
  const northStar = stops[2]
  const xs = [...stops.map((stop) => stop.x), northStar.x + 2 + wordWidth('POLARIS')]
  const ys = [...stops.map((stop) => stop.home), northStar.home - 11]
  const frame = {
    left: Math.min(...xs) - MARGIN,
    top: Math.min(...ys) - MARGIN - LOOSE_ROOM,
    right: Math.max(...xs) + MARGIN,
    bottom: Math.max(...ys) + MARGIN + LOOSE_ROOM,
  }
  return { stops, northStar, frame, pen: null, painted: false }
}

/** The trail's pixels in order, from where its stars are now: dotted, two pixels on and three off. */
export function trailDots(trail: Trail) {
  const dots: [number, number][] = []
  for (let leg = 1; leg < trail.stops.length; leg++) {
    const from = trail.stops[leg - 1]
    const to = trail.stops[leg]
    const pixels = linePoints(from.x, from.y, to.x, to.y).slice(4, -4)
    pixels.forEach((pixel, i) => i % 5 < 2 && dots.push(pixel))
  }
  return dots
}

function distanceToSegment(x: number, y: number, [a, b]: [FigureStar, FigureStar]) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const along = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1)))
  return Math.hypot(x - (a.x + dx * along), y - (a.y + dy * along))
}

/** How far a point is outside a box: nothing while it is inside. */
function distanceToBox(x: number, y: number, box: Box) {
  return Math.hypot(Math.max(box.left - x, 0, x - box.right), Math.max(box.top - y, 0, y - box.bottom))
}

/**
 * The constellation at a point of the sky, if any, and the deep-sky object there. `reach` is how
 * far the cursor reaches: REACH for a mouse, more for a finger. A constellation that is not
 * drawn is not there to be touched.
 */
export function figureAt(figures: Figure[], x: number, y: number, reach: number): Touched | null {
  let touched: Touched | null = null
  let best = Infinity
  for (const figure of figures) {
    if (figure.shown < TOUCHABLE) continue
    const { box } = figure
    let distance = Infinity
    if (x >= box.left - reach && x <= box.right + reach && y >= box.top - reach && y <= box.bottom + reach) {
      distance = Math.min(...figure.segments.map((segment) => distanceToSegment(x, y, segment)))
      // The space between its lines belongs to the constellation too, so the cursor can rest
      // anywhere inside it. A line right under the cursor still counts for more.
      if (distance >= reach) distance = insideOutline(figure.outline, x, y, OUTLINE_REACH) ? reach : Infinity
    }
    // A deep-sky object lights its constellation as well, however far from the lines it lies.
    let sight: PlacedSight | null = null
    let nearest = (SIGHT_REACH * reach) / REACH
    for (const placed of figure.sights) {
      const off = distanceToBox(x, y, placed.box)
      if (off >= nearest) continue
      nearest = off
      sight = placed
    }
    if (sight) distance = Math.min(distance, nearest)
    if (distance < best) {
      best = distance
      touched = { figure, sight }
    }
  }
  return touched
}
