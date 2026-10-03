import { CONSTELLATIONS, NORTH_UP, WAY_TO_THE_QUEEN, type Constellation } from './constellations'
import { Pixels, bayer, linePoints, mix, prefersReducedMotion, rgb, type Rgb } from './pixels'
import { plotStar, plotWord, shineAt, skyMap, wordWidth, type ChartStar, type Plot } from './starChart'
import { currentTheme, watchTheme } from './theme'
import { seededRandom } from './tinyNet'

// The sky behind the page: faint stars, a band of Milky Way, and real constellations joined by
// thin lines. It drifts more slowly than the page scrolls, so the page seems to float in front
// of it. Under the cursor a constellation shines: a crest of light crosses its lines from the
// upper left to the lower right, again and again, like a Mexican wave.
//
// The northern constellations share the patch of open sky above the footer, placed around the
// pole as they really are. Touching Cassiopeia, the Queen, lights the trail stargazers follow
// to find her: from the Great Bear's pointer stars, through the North Star, and on to her.
//
// In the Turkish theme there is no sky at all: the background is a wall of small Turkish flags,
// side by side and row on row.

/** One sky pixel is this many screen pixels, finer than the header's so the lines stay thin. */
const SCALE = 2
/** How far the sky moves for each pixel the page scrolls. */
const DRIFT = 0.3
/** Sky pixels per degree, the same scale as Orion in the header. */
const PIXELS_PER_DEGREE = { wide: 5.2, narrow: 3.6 }
/** How close the cursor must come to a line, in sky pixels, to light it. */
const REACH = 7
/** Room around a constellation for its stars' arms and its lines' halo. */
const MARGIN = 5
const GLOW_IN_MS = 140
const GLOW_OUT_MS = 420
const HALO_AROUND = [[1, 0], [-1, 0], [0, 1], [0, -1]]

const INK = {
  sky: rgb('#100f2b'),
  haze: rgb('#191642'),
  stars: ['#2c2969', '#48449a', '#8a86d0', '#d9d6ff'].map(rgb),
  line: rgb('#35317f'),
  name: rgb('#443f96'),
  lit: rgb('#e3f4ff'),
  halo: rgb('#6fbcff'),
  litName: rgb('#ffe7a3'),
}

type Ink = typeof INK
type Box = { left: number; top: number; right: number; bottom: number }
type Point = { x: number; y: number }

/** A constellation placed on the sky, in sky pixels. */
type Figure = {
  name: string
  whisper?: string
  stars: ChartStar[]
  /** The pixels of each line between two stars. */
  paths: [number, number][][]
  /** The same lines as end points, for measuring how close the cursor is. */
  segments: [ChartStar, ChartStar][]
  box: Box
  label: Point
  /** Everything that can light up, with room to spare: the stars, the lines and the name. */
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
type Trail = {
  /** Its pixels in order, from the first pointer star to Cassiopeia. */
  dots: [number, number][]
  northStar: Point
  frame: Box
  pen: CanvasRenderingContext2D | null
  painted: boolean
}

/** The middle of a group of stars on the sky, found by averaging their directions. */
function middleOf(stars: { ra: number; dec: number }[]) {
  let x = 0
  let y = 0
  let z = 0
  for (const star of stars) {
    const ra = (star.ra * Math.PI) / 180
    const dec = (star.dec * Math.PI) / 180
    x += Math.cos(dec) * Math.cos(ra)
    y += Math.cos(dec) * Math.sin(ra)
    z += Math.sin(dec)
  }
  return { ra: (Math.atan2(y, x) * 180) / Math.PI, dec: (Math.atan2(z, Math.hypot(x, y)) * 180) / Math.PI }
}

/** A constellation on a chart of its own, north up, centred as near (centerX, centerY) as fits. */
function chartAlone(chart: Constellation, centerX: number, centerY: number, perDegree: number, width: number): Point[] {
  const middle = middleOf(chart.stars)
  const map = skyMap(middle.ra, middle.dec)
  const flat = chart.stars.map((star) => map(star.ra, star.dec))
  const rights = flat.map((point) => point.right * perDegree)
  const ups = flat.map((point) => point.up * perDegree)
  const half = (Math.max(...rights) - Math.min(...rights)) / 2
  const midRight = (Math.max(...rights) + Math.min(...rights)) / 2
  const midUp = (Math.max(...ups) + Math.min(...ups)) / 2
  const x0 = half * 2 + 8 > width ? width / 2 : Math.min(Math.max(centerX, half + 4), width - half - 4)
  return flat.map((_, i) => ({ x: x0 + rights[i] - midRight, y: centerY - (ups[i] - midUp) }))
}

/**
 * The northern constellations on one chart around the pole, as they stand when you face north:
 * each star sits as many degrees from the pole as its declination is short of 90, turned by its
 * right ascension. The chart is centred on (centerX, centerY) and shrunk to fit the room.
 */
function chartNorth(charts: Constellation[], centerX: number, centerY: number, perDegree: number, room: Point) {
  const flat = charts.map((chart) =>
    chart.stars.map((star) => {
      const fromPole = 90 - star.dec
      const turn = ((star.ra - NORTH_UP) * Math.PI) / 180
      return { x: fromPole * Math.sin(turn), y: -fromPole * Math.cos(turn) }
    }),
  )
  const all = flat.flat()
  const left = Math.min(...all.map((point) => point.x))
  const right = Math.max(...all.map((point) => point.x))
  const top = Math.min(...all.map((point) => point.y))
  const bottom = Math.max(...all.map((point) => point.y))
  const scale = Math.min(perDegree, room.x / (right - left), room.y / (bottom - top))
  return flat.map((points) =>
    points.map((point) => ({
      x: centerX + (point.x - (left + right) / 2) * scale,
      y: centerY + (point.y - (top + bottom) / 2) * scale,
    })),
  )
}

/** Turns a constellation and the places of its stars into lines, a name and a frame. */
function figureFrom(chart: Constellation, points: Point[], width: number): Figure {
  const stars = chart.stars.map((star, i) => ({
    x: Math.round(points[i].x),
    y: Math.round(points[i].y),
    size: star.size,
    look: star.look ?? 'blue',
  }))
  const segments = chart.lines.map(([from, to]): [ChartStar, ChartStar] => [stars[from], stars[to]])
  // Lines stop just short of the stars they join, so the stars stay crisp.
  const paths = segments.map(([from, to]) => {
    const pixels = linePoints(from.x, from.y, to.x, to.y)
    return pixels.length > 6 ? pixels.slice(2, -2) : pixels.slice(1, -1)
  })
  const box = {
    left: Math.min(...stars.map((star) => star.x)) - 3,
    top: Math.min(...stars.map((star) => star.y)) - 3,
    right: Math.max(...stars.map((star) => star.x)) + 3,
    bottom: Math.max(...stars.map((star) => star.y)) + 3,
  }
  const labelWidth = wordWidth(chart.name)
  const label = {
    x: Math.round(Math.min(Math.max((box.left + box.right - labelWidth) / 2, 2), width - labelWidth - 2)),
    y: chart.nameAbove ? box.top - 9 : box.bottom + 4,
  }
  const frame = {
    left: Math.min(box.left, label.x) - MARGIN,
    top: Math.min(box.top, label.y) - MARGIN,
    right: Math.max(box.right, label.x + labelWidth) + MARGIN,
    bottom: Math.max(box.bottom, label.y + 5) + MARGIN,
  }
  return {
    name: chart.name,
    whisper: chart.whisper,
    stars,
    paths,
    segments,
    box,
    label,
    frame,
    pen: null,
    glow: 0,
    target: 0,
    since: 0,
    painted: false,
  }
}

/** The dotted trail to the Queen, through the stars named in WAY_TO_THE_QUEEN. */
function trailThrough(figures: Figure[]): Trail | null {
  const stops = WAY_TO_THE_QUEEN.map((step) => figures.find((figure) => figure.name === step.name)?.stars[step.star])
  if (stops.some((stop) => !stop)) return null
  const stars = stops as ChartStar[]
  const dots: [number, number][] = []
  for (let leg = 1; leg < stars.length; leg++) {
    const pixels = linePoints(stars[leg - 1].x, stars[leg - 1].y, stars[leg].x, stars[leg].y).slice(4, -4)
    // Two pixels on, three off.
    pixels.forEach((pixel, i) => i % 5 < 2 && dots.push(pixel))
  }
  const northStar = stars[2]
  const xs = [...dots.map((dot) => dot[0]), northStar.x + 2, northStar.x + 2 + wordWidth('POLARIS')]
  const ys = [...dots.map((dot) => dot[1]), northStar.y - 11]
  const frame = {
    left: Math.min(...xs) - MARGIN,
    top: Math.min(...ys) - MARGIN,
    right: Math.max(...xs) + MARGIN,
    bottom: Math.max(...ys) + MARGIN,
  }
  return { dots, northStar, frame, pen: null, painted: false }
}

function distanceToSegment(x: number, y: number, [a, b]: [ChartStar, ChartStar]) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const along = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1)))
  return Math.hypot(x - (a.x + dx * along), y - (a.y + dy * along))
}

/** The still part of the sky: night, Milky Way haze, stars and the constellations at rest. */
function paintSky(width: number, height: number, figures: Figure[], ink: Ink) {
  const random = seededRandom(2026)
  const sky = new Pixels(width, height)
  const data = sky.image.data
  const hazed = mix(ink.sky, ink.haze, 0.75)

  // The Milky Way runs from the upper right to the lower left as a dithered band.
  const bandMiddle = (y: number) => width * (0.88 - (0.76 * y) / height)
  const bandHalf = Math.max(34, width * 0.15)
  for (let y = 0; y < height; y++) {
    const middle = bandMiddle(y)
    for (let x = 0; x < width; x++) {
      const strength = 0.7 * (1 - Math.abs(x - middle) / bandHalf)
      const color = strength > bayer(x, y) ? hazed : ink.sky
      const k = (y * width + x) * 4
      data[k] = color[0]
      data[k + 1] = color[1]
      data[k + 2] = color[2]
      data[k + 3] = 255
    }
  }

  // Stars everywhere, and more of them along the Milky Way.
  const scatter = (count: number, x: (y: number) => number) => {
    for (let i = 0; i < count; i++) {
      const y = Math.floor(random() * height)
      const roll = random()
      sky.set(x(y), y, ink.stars[roll < 0.6 ? 0 : roll < 0.88 ? 1 : roll < 0.98 ? 2 : 3])
    }
  }
  scatter(Math.round((width * height) / 130), () => Math.floor(random() * width))
  scatter(Math.round((width * height) / 260), (y) => bandMiddle(y) + (random() + random() - 1) * bandHalf)

  const plot: Plot = (x, y, color, alpha = 1) => sky.set(x, y, color, alpha)
  for (const figure of figures) {
    for (const path of figure.paths) for (const [x, y] of path) plot(x, y, ink.line)
    for (const star of figure.stars) plotStar(plot, star)
    plotWord(plot, figure.name, figure.label.x, figure.label.y, ink.name)
  }
  return sky
}

/** One small Turkish flag, 30 sky pixels by 20, with a thin dark seam on its right and bottom. */
function smallFlag() {
  const width = 30
  const height = 20
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

/** The Turkish theme's background: small flags side by side and row on row. */
function paintFlags(width: number, height: number) {
  const flag = smallFlag()
  const wall = new Pixels(width, height)
  const from = flag.image.data
  const to = wall.image.data
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const source = ((y % flag.height) * flag.width + (x % flag.width)) * 4
      const target = (y * width + x) * 4
      to[target] = from[source]
      to[target + 1] = from[source + 1]
      to[target + 2] = from[source + 2]
      to[target + 3] = 255
    }
  }
  return wall
}

// Canvas colors as text, made once for each color.
const inks = new Map<Rgb, string>()
function css(color: Rgb) {
  let text = inks.get(color)
  if (!text) inks.set(color, (text = `rgb(${color[0]} ${color[1]} ${color[2]})`))
  return text
}

type Layers = {
  /** The layer that holds each constellation's small canvas of shine. */
  lit: HTMLElement
  /** The little label that follows the cursor. */
  whisper: HTMLElement | null
}

/**
 * Draws the sky into `still`, and each constellation's shine into a small canvas of its own
 * inside the lit layer. Returns a function that stops it.
 */
export function startSkyBackground(still: HTMLCanvasElement, { lit, whisper }: Layers) {
  const holder = still.parentElement
  const page = document.querySelector<HTMLElement>('.home')
  if (!holder || !page) return () => {}

  const moving = !prefersReducedMotion()
  // With reduced motion the sky is fastened to the page and scrolls with it, and a lit
  // constellation glows evenly instead of in a wave.
  holder.classList.toggle('is-fastened', !moving)

  const ink = INK
  let figures: Figure[] = []
  let trail: Trail | null = null
  let queen: Figure | undefined
  let built = ''
  /** How far the sky has slid up behind the window, in screen pixels. */
  let slid = 0
  let slide = 0
  let pointer: { x: number; y: number; mouse: boolean } | null = null
  let frame = 0
  let lastFrame = 0
  let pending = 0

  /** A small canvas over one part of the sky, so lighting it never repaints the whole sky. */
  const canvasOver = (box: Box) => {
    const canvas = document.createElement('canvas')
    canvas.width = box.right - box.left + 1
    canvas.height = box.bottom - box.top + 1
    canvas.style.left = `${box.left * SCALE}px`
    canvas.style.top = `${box.top * SCALE}px`
    canvas.style.width = `${canvas.width * SCALE}px`
    canvas.style.height = `${canvas.height * SCALE}px`
    lit.append(canvas)
    return canvas.getContext('2d')
  }

  const rebuild = () => {
    pending = 0
    const width = document.documentElement.clientWidth
    const windowHeight = window.innerHeight
    const pageBox = page.getBoundingClientRect()
    const pageHeight = Math.max(windowHeight, Math.ceil(pageBox.bottom + window.scrollY))
    const skyHeight = moving ? Math.round(windowHeight + DRIFT * (pageHeight - windowHeight)) : pageHeight
    const key = `${width}×${windowHeight}×${pageHeight}×${currentTheme()}`
    if (key === built) return
    built = key
    const flags = currentTheme() === 'turk'
    slide = (skyHeight - windowHeight) / Math.max(1, pageHeight - windowHeight)

    const columns = Math.ceil(width / SCALE)
    const rows = Math.ceil(skyHeight / SCALE)
    const narrow = width < 720
    const perDegree = narrow ? PIXELS_PER_DEGREE.narrow : PIXELS_PER_DEGREE.wide

    // Where each lane runs. Beside the page when there is room, otherwise behind it.
    const beside = pageBox.left + 16
    const sideBox = document.querySelector('.home-side')?.getBoundingClientRect()
    const lanes = {
      left: beside >= 150 ? beside / 2 : width * (narrow ? 0.27 : 0.1),
      right: beside >= 150 ? width - beside / 2 : width * (narrow ? 0.73 : 0.9),
      side: sideBox ? (sideBox.left + sideBox.right) / 2 : width * 0.72,
    }
    // The northern constellations rest in the patch of open sky above the footer once the page
    // is scrolled to its end.
    const patch = document.querySelector('.open-sky')?.getBoundingClientRect()
    const patchHeight = patch ? patch.height : 190
    const patchFromEnd = patch ? pageHeight - ((patch.top + patch.bottom) / 2 + window.scrollY) : 160
    const patchWidth = Math.min(width, pageBox.width) - 40
    const northern = CONSTELLATIONS.filter((chart) => chart.lane === 'north')
    const north = chartNorth(northern, width / 2 / SCALE, (skyHeight - patchFromEnd) / SCALE, perDegree, {
      x: patchWidth / SCALE,
      y: (patchHeight - 56) / SCALE,
    })

    // Under the flags there are no constellations to touch.
    figures = flags
      ? []
      : CONSTELLATIONS.map((chart) => {
          const points =
            chart.lane === 'north'
              ? north[northern.indexOf(chart)]
              : chartAlone(chart, lanes[chart.lane] / SCALE, (skyHeight * chart.down) / SCALE, perDegree, columns)
          return figureFrom(chart, points, columns)
        })
    queen = figures.find((figure) => figure.name === WAY_TO_THE_QUEEN[WAY_TO_THE_QUEEN.length - 1].name)
    trail = trailThrough(figures)

    const picture = flags ? paintFlags(columns, rows) : paintSky(columns, rows, figures, ink)
    picture.show(still)
    still.style.width = `${columns * SCALE}px`
    still.style.height = `${rows * SCALE}px`

    lit.replaceChildren()
    for (const figure of figures) figure.pen = canvasOver(figure.frame)
    if (trail) trail.pen = canvasOver(trail.frame)
    if (!moving) holder.style.height = `${skyHeight}px`
    follow()
  }

  const queueRebuild = () => {
    if (!pending) pending = requestAnimationFrame(rebuild)
  }

  /** Slides the sky to match the scroll position, then checks what the cursor now rests on. */
  const follow = () => {
    slid = moving ? Math.round(window.scrollY * slide) : window.scrollY
    if (moving) for (const layer of [still, lit]) layer.style.transform = `translate3d(0, ${-slid}px, 0)`
    if (pointer?.mouse) touch()
  }

  /** Draws one constellation's shine as it is at this moment. */
  const paintShine = (figure: Figure, now: number) => {
    const { pen, frame: bounds } = figure
    if (!pen) return
    pen.clearRect(0, 0, pen.canvas.width, pen.canvas.height)
    figure.painted = figure.glow > 0
    if (!figure.painted) return

    // The wave runs along the diagonal: 0 at the upper left corner, 1 at the lower right.
    const diagonal = bounds.right - bounds.left + (bounds.bottom - bounds.top)
    const elapsed = now - figure.since
    const plot: Plot = (x, y, color, alpha = 1) => {
      const along = (x - bounds.left + (y - bounds.top)) / diagonal
      pen.globalAlpha = alpha * figure.glow * (moving ? shineAt(along, elapsed) : 1)
      pen.fillStyle = css(color)
      pen.fillRect(x - bounds.left, y - bounds.top, 1, 1)
    }
    // A halo around each line, then the bright line itself, the stars and the name.
    for (const path of figure.paths) {
      for (const [x, y] of path) for (const [dx, dy] of HALO_AROUND) plot(x + dx, y + dy, ink.halo, 0.3)
    }
    for (const path of figure.paths) for (const [x, y] of path) plot(x, y, ink.lit)
    for (const star of figure.stars) plotStar(plot, star, ink.lit)
    plotWord(plot, figure.name, figure.label.x, figure.label.y, ink.litName)
  }

  /** Draws the trail to the Queen: the light runs along it from the Great Bear to her. */
  const paintTrail = (now: number) => {
    const lady = queen
    if (!trail?.pen || !lady) return
    const { pen, frame: bounds, dots, northStar } = trail
    pen.clearRect(0, 0, pen.canvas.width, pen.canvas.height)
    trail.painted = lady.glow > 0
    if (!trail.painted) return
    const elapsed = now - lady.since
    const level = (along: number) => lady.glow * (moving ? shineAt(along, elapsed) : 1)
    pen.fillStyle = css(ink.litName)
    dots.forEach(([x, y], i) => {
      pen.globalAlpha = level(i / dots.length)
      pen.fillRect(x - bounds.left, y - bounds.top, 1, 1)
    })
    const plot: Plot = (x, y, color, alpha = 1) => {
      pen.globalAlpha = alpha * level(0.5)
      pen.fillStyle = css(color)
      pen.fillRect(x - bounds.left, y - bounds.top, 1, 1)
    }
    plotWord(plot, 'POLARIS', northStar.x + 3, northStar.y - 9, ink.litName)
  }

  /** Fades constellations in and out and keeps the wave moving through the lit ones. */
  const shine = (now: number) => {
    const elapsed = lastFrame ? Math.min(now - lastFrame, 50) : 16
    lastFrame = now
    let busy = false
    for (const figure of figures) {
      if (figure.glow !== figure.target) {
        const step = moving ? elapsed / (figure.target > figure.glow ? GLOW_IN_MS : GLOW_OUT_MS) : 1
        figure.glow =
          figure.target > figure.glow ? Math.min(figure.target, figure.glow + step) : Math.max(figure.target, figure.glow - step)
      }
      if (figure.glow > 0 || figure.painted) paintShine(figure, now)
      busy ||= figure.glow !== figure.target || (moving && figure.glow > 0)
    }
    if (trail && queen && (queen.glow > 0 || trail.painted)) paintTrail(now)
    frame = busy ? requestAnimationFrame(shine) : 0
    if (!busy) lastFrame = 0
  }

  /** Shows a constellation's few words beside the cursor, or puts them away. */
  const say = (figure: Figure | null) => {
    if (!whisper) return
    if (!figure?.whisper || !pointer) {
      whisper.hidden = true
      return
    }
    whisper.textContent = figure.whisper
    whisper.hidden = false
    // Below and to the right of the cursor, unless that would leave the window.
    const { offsetWidth, offsetHeight } = whisper
    const x = pointer.x + 16 + offsetWidth > window.innerWidth - 8 ? pointer.x - offsetWidth - 12 : pointer.x + 16
    const y = pointer.y + 22 + offsetHeight > window.innerHeight - 8 ? pointer.y - offsetHeight - 14 : pointer.y + 22
    whisper.style.transform = `translate(${Math.max(8, x)}px, ${Math.max(8, y)}px)`
  }

  /** Lights the constellation whose lines the cursor is on, and lets the others go dark. */
  const touch = () => {
    let nearest: Figure | null = null
    if (pointer) {
      const x = pointer.x / SCALE
      const y = (pointer.y + slid) / SCALE
      // A finger is less exact than a mouse, so it reaches a little farther.
      let best = pointer.mouse ? REACH : REACH * 1.6
      for (const figure of figures) {
        const { box } = figure
        if (x < box.left - best || x > box.right + best || y < box.top - best || y > box.bottom + best) continue
        for (const segment of figure.segments) {
          const distance = distanceToSegment(x, y, segment)
          if (distance < best) {
            best = distance
            nearest = figure
          }
        }
      }
    }
    let changed = false
    for (const figure of figures) {
      const target = figure === nearest ? 1 : 0
      if (target === figure.target) continue
      changed = true
      figure.target = target
      // The wave sets off from the upper left the moment the cursor arrives.
      if (target) figure.since = performance.now()
    }
    say(nearest)
    if (changed && !frame) frame = requestAnimationFrame(shine)
  }

  const onPointer = (event: PointerEvent) => {
    pointer = { x: event.clientX, y: event.clientY, mouse: event.pointerType === 'mouse' }
    touch()
  }
  const onLeave = () => {
    pointer = null
    touch()
  }

  const sizes = new ResizeObserver(queueRebuild)
  sizes.observe(page)
  const unwatch = watchTheme(queueRebuild)
  window.addEventListener('resize', queueRebuild)
  window.addEventListener('scroll', follow, { passive: true })
  window.addEventListener('pointermove', onPointer, { passive: true })
  window.addEventListener('pointerdown', onPointer, { passive: true })
  document.documentElement.addEventListener('pointerleave', onLeave)
  rebuild()

  return () => {
    sizes.disconnect()
    unwatch()
    cancelAnimationFrame(frame)
    cancelAnimationFrame(pending)
    window.removeEventListener('resize', queueRebuild)
    window.removeEventListener('scroll', follow)
    window.removeEventListener('pointermove', onPointer)
    window.removeEventListener('pointerdown', onPointer)
    document.documentElement.removeEventListener('pointerleave', onLeave)
    lit.replaceChildren()
    if (whisper) whisper.hidden = true
  }
}
