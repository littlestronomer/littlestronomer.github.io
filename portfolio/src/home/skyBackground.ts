import { CONSTELLATIONS, WAY_TO_THE_QUEEN } from './constellations'
import { Pixels, prefersReducedMotion, whileVisible, type Rgb } from './pixels'
import {
  DRIFT,
  REACH,
  arrange,
  figureAt,
  placeFigures,
  trailDots,
  trailThrough,
  type Box,
  type Figure,
  type Trail,
} from './skyFigures'
import { INK, paintFar, paintFigure, paintFlags, paintLit } from './skyPaint'
import { crestAt, plotWord, shineAt, type Plot } from './starChart'
import { drawField, plotField, scatterField, starSheet, type FieldStar } from './starField'
import { currentTheme, watchTheme } from './theme'

// The sky behind the page: stars, a band of Milky Way, and real constellations joined by thin
// lines, with the galaxies, nebulae and star clusters that lie beside them. It drifts more
// slowly than the page scrolls, so the page seems to float in front of it. The sky itself has
// depth. The Milky Way is the farthest thing in it and barely moves. Every star has a depth of
// its own, so the near ones pass the far ones as the page scrolls; that goes for the stars of
// a constellation too, which only line up into their figure at one place in the scrolling.
// Far from it they are stars like the others. As the figure nears its shape its lines and its
// name come, and at the moment it comes right a crest of light crosses it and leaves it
// glowing. About half of the loose stars twinkle, and so does every star of a constellation,
// which is brighter to begin with. Under the cursor a constellation shines: a crest of light
// crosses its lines from the upper left to the lower right, again and again, like a Mexican
// wave.
//
// The northern constellations share the patch of open sky above the footer, placed around the
// pole as they really are, and line up when the page is scrolled to its end. Touching
// Cassiopeia, the Queen, lights the trail stargazers follow to find her: from the Great Bear's
// pointer stars, through the North Star, and on to her.
//
// This file fits the sky to the page and answers the cursor. skyFigures.ts works out where
// everything stands, skyPaint.ts paints it, and starField.ts scatters and draws the loose stars.

/** One sky pixel is this many screen pixels, finer than the header's so the lines stay thin. */
const SCALE = 2
/** A constellation beside the page is lined up when it stands this far down the window. */
const HOME_IN_WINDOW = 0.45
/**
 * Where in the open stretch of the sidebar's column each constellation of that lane stands,
 * from its top (0) to its bottom (1), if the stretch is at least so many pixels tall.
 */
const SIDE_STRETCH = { places: [0.16, 0.64], least: 420 }
/**
 * The glow of a constellation that is in place. It comes into place once it is this much in
 * place, and can do so again after it has fallen back to the second amount. A crest of light
 * then takes this long to cross it, and afterwards it keeps this share of its full shine.
 */
const ARRIVAL = { sets: 0.6, resets: 0.15, ms: 1100, glow: 0.24 }
/** The loose stars are scattered the same way every time. */
const STAR_SEED = 1054
/** How many times a second the loose stars are drawn again while nothing scrolls, so that they twinkle. */
const TWINKLE_FPS = 10
/** Sky pixels per degree, the same scale as Orion in the header. */
const PIXELS_PER_DEGREE = { wide: 5.2, narrow: 3.6 }
const GLOW_IN_MS = 140
const GLOW_OUT_MS = 420
/** The constellation the trail of light leads to. */
const QUEEN = WAY_TO_THE_QUEEN[WAY_TO_THE_QUEEN.length - 1].name

// Canvas colors as text, made once for each color.
const inks = new Map<Rgb, string>()
function css(color: Rgb) {
  let text = inks.get(color)
  if (!text) inks.set(color, (text = `rgb(${color[0]} ${color[1]} ${color[2]})`))
  return text
}

type Layers = {
  /** The canvas behind everything else: the Milky Way and the faintest stars. */
  far: HTMLCanvasElement
  /** Two canvases the size of the window, for the loose stars farther than the constellations and nearer. */
  behind: HTMLCanvasElement
  near: HTMLCanvasElement
  /** The layer that holds each constellation's small canvas of shine. */
  lit: HTMLElement
  /** The little label that follows the cursor. */
  whisper: HTMLElement | null
}

/**
 * Draws the Milky Way into the far canvas, the loose stars into the two canvases behind and in
 * front of the constellations, the constellations themselves onto the first of those two, and
 * each constellation's shine into a small canvas of its own inside the lit layer. `still` holds
 * the whole sky when it is fastened to the page, and the wall of flags. Returns a function that
 * stops it.
 */
export function startSkyBackground(still: HTMLCanvasElement, { far, behind, near, lit, whisper }: Layers) {
  const holder = still.parentElement
  const page = document.querySelector<HTMLElement>('.home')
  if (!holder || !page) return () => {}

  const moving = !prefersReducedMotion()
  // With reduced motion the sky is fastened to the page and scrolls with it, and a lit
  // constellation glows evenly instead of in a wave.
  holder.classList.toggle('is-fastened', !moving)

  let figures: Figure[] = []
  let trail: Trail | null = null
  let queen: Figure | undefined
  let built = ''
  /** How far the constellations have slid up behind the window, in screen pixels. */
  let slid = 0
  /** How far each painted layer slides for each pixel the page scrolls. */
  let slide = 0
  let farSlide = 0
  /**
   * The loose stars, with the canvas each lot is drawn on: those behind the constellations and
   * those in front. There are none here under the flags, or when the sky is fastened to the page.
   */
  let loose: { canvas: HTMLCanvasElement; stars: FieldStar[] }[] = []
  /** The pictures of the stars, kept on a canvas so that they can be stamped. */
  const sheet = document.createElement('canvas')
  starSheet().show(sheet)
  /** When the loose stars were last drawn. */
  let starsDrawn = 0

  /**
   * Draws the loose stars where the scrolling has brought them, as they twinkle at this moment,
   * and over the far ones the constellations as they are now.
   */
  const drawStars = (now: number) => {
    starsDrawn = now
    for (const { canvas, stars } of loose) {
      const pen = canvas.getContext('2d')
      if (!pen) continue
      drawField(pen, sheet, stars, SCALE, window.scrollY, now)
      if (canvas !== behind) continue
      const plot: Plot = (x, y, color, alpha = 1) => {
        // Only what is in the window.
        const top = y * SCALE - slid
        if (top < -SCALE || top >= canvas.height) return
        pen.globalAlpha = alpha
        pen.fillStyle = css(color)
        pen.fillRect(x * SCALE, top, SCALE, SCALE)
      }
      for (const figure of figures) paintFigure(plot, figure, now)
      pen.globalAlpha = 1
    }
  }
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
    // A layer is as tall as the window plus however far it will slide by the end of the page.
    const travel = Math.max(1, pageHeight - windowHeight)
    const tall = (drift: number) => (moving ? Math.round(windowHeight + drift * (pageHeight - windowHeight)) : pageHeight)
    const skyHeight = tall(DRIFT.middle)
    const key = `${width}×${windowHeight}×${pageHeight}×${currentTheme()}`
    if (key === built) return
    built = key
    const flags = currentTheme() === 'turk'
    slide = (skyHeight - windowHeight) / travel
    farSlide = (tall(DRIFT.far) - windowHeight) / travel

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

    // The constellations of the sidebar's lane stand in the open stretch of its column, below
    // its last box, one above the other, and line up together when that stretch is in the
    // middle of the window. Without such a stretch they stand where their own places put them.
    const lastBox = document.querySelector('.home-side > :last-child')?.getBoundingClientRect()
    const stretch = sideBox && lastBox ? { top: lastBox.bottom + window.scrollY, tall: sideBox.bottom - lastBox.bottom } : null
    const middles: Record<string, number> = {}
    let sideHome: number | null = null
    if (moving && stretch && stretch.tall >= SIDE_STRETCH.least) {
      const home = Math.min(travel, Math.max(0, stretch.top + stretch.tall / 2 - windowHeight / 2))
      sideHome = home
      CONSTELLATIONS.filter((chart) => chart.lane === 'side').forEach((chart, i) => {
        const onPage = stretch.top + stretch.tall * (SIDE_STRETCH.places[i] ?? 0.5)
        middles[chart.name] = (onPage - home * (1 - slide)) / SCALE
      })
    }

    // Under the flags there are no constellations to touch.
    figures = flags
      ? []
      : placeFigures({
          width: columns,
          height: rows,
          perDegree,
          lanes: { left: lanes.left / SCALE, right: lanes.right / SCALE, side: lanes.side / SCALE },
          middles,
          north: {
            x: width / 2 / SCALE,
            y: (skyHeight - patchFromEnd) / SCALE,
            width: patchWidth / SCALE,
            height: (patchHeight - 56) / SCALE,
          },
        })
    // Where each lines up: the northern ones at the end of the page, the others when they stand
    // a little above the middle of the window, or as near to that as the page goes.
    for (const figure of figures) {
      const middle = ((figure.box.top + figure.box.bottom) / 2) * SCALE
      figure.home =
        figure.lane === 'north'
          ? travel
          : figure.lane === 'side' && sideHome !== null
            ? sideHome
            : Math.min(travel, Math.max(0, (middle - windowHeight * HOME_IN_WINDOW) / slide))
    }
    queen = figures.find((figure) => figure.name === QUEEN)
    trail = trailThrough(figures)

    /** Puts a painted layer on its canvas, or puts the canvas away when there is nothing for it. */
    const show = (canvas: HTMLCanvasElement, picture: Pixels | null) => {
      canvas.style.display = picture ? '' : 'none'
      if (!picture) return
      picture.show(canvas)
      canvas.style.width = `${picture.width * SCALE}px`
      canvas.style.height = `${picture.height * SCALE}px`
    }
    loose = []
    if (flags) {
      show(still, paintFlags(columns, rows))
      show(far, null)
    } else if (moving) {
      // The Milky Way is painted once and slides at its own pace. The stars, loose or in a
      // constellation, are drawn again at every scroll, each where its own depth puts it.
      show(far, paintFar(columns, Math.ceil(tall(DRIFT.far) / SCALE)))
      show(still, null)
      const stars = scatterField(columns, Math.ceil(windowHeight / SCALE), (drift) => tall(drift) / SCALE, STAR_SEED)
      loose = [
        { canvas: behind, stars: stars.filter((star) => star.drift < DRIFT.middle) },
        { canvas: near, stars: stars.filter((star) => star.drift >= DRIFT.middle) },
      ]
    } else {
      // Fastened to the page there is no depth to show, so everything is painted on one layer.
      const sky = paintFar(columns, rows)
      const plot: Plot = (x, y, color, alpha = 1) => sky.set(x, y, color, alpha)
      plotField(plot, scatterField(columns, rows, () => rows, STAR_SEED))
      for (const figure of figures) paintFigure(plot, figure)
      show(still, sky)
      show(far, null)
    }
    for (const canvas of [behind, near]) {
      canvas.style.display = loose.length ? '' : 'none'
      canvas.width = width
      canvas.height = windowHeight
    }

    lit.replaceChildren()
    for (const figure of figures) figure.pen = canvasOver(figure.frame)
    if (trail) trail.pen = canvasOver(trail.frame)
    if (!moving) holder.style.height = `${skyHeight}px`
    // A constellation that is in place as the sky is built has not just come into place.
    if (moving) {
      for (const figure of figures) {
        arrange(figure, (window.scrollY - figure.home) / SCALE, slide)
        figure.settled = figure.placed >= ARRIVAL.sets
      }
    }
    follow()
  }

  const queueRebuild = () => {
    if (!pending) pending = requestAnimationFrame(rebuild)
  }

  /**
   * Slides the sky to match the scroll position and puts every star where its depth has brought
   * it, then checks what the cursor now rests on.
   */
  const follow = () => {
    slid = moving ? Math.round(window.scrollY * slide) : window.scrollY
    if (moving) {
      lit.style.transform = `translate3d(0, ${-slid}px, 0)`
      far.style.transform = `translate3d(0, ${-Math.round(window.scrollY * farSlide)}px, 0)`
      const view = { top: slid / SCALE, bottom: (slid + window.innerHeight) / SCALE }
      let glowing = false
      for (const figure of figures) {
        arrange(figure, (window.scrollY - figure.home) / SCALE, slide, view)
        // The moment a constellation comes into place, the crest of light sets off across it.
        if (figure.placed >= ARRIVAL.sets && !figure.settled) {
          figure.settled = true
          figure.struck = performance.now()
        } else if (figure.placed <= ARRIVAL.resets) {
          figure.settled = false
        }
        glowing ||= figure.placed > 0 || figure.painted
      }
      if (glowing && !frame) frame = requestAnimationFrame(shine)
    }
    drawStars(performance.now())
    if (pointer?.mouse) touch()
  }

  /** Whether the crest of light that greets a constellation coming into place is still crossing it. */
  const arriving = (figure: Figure, now: number) => moving && now - figure.struck < ARRIVAL.ms

  /** Draws one constellation's shine as it is at this moment. */
  const paintShine = (figure: Figure, now: number) => {
    const { pen, frame: bounds } = figure
    if (!pen) return
    pen.clearRect(0, 0, pen.canvas.width, pen.canvas.height)
    const crossing = arriving(figure, now)
    figure.painted = figure.glow > 0 || figure.placed > 0 || crossing
    if (!figure.painted) return

    // Light runs along the diagonal: 0 at the upper left corner, 1 at the lower right.
    const diagonal = bounds.right - bounds.left + (bounds.bottom - bounds.top)
    const shining = (level: (along: number) => number): Plot => {
      return (x, y, color, alpha = 1) => {
        pen.globalAlpha = alpha * level((x - bounds.left + (y - bounds.top)) / diagonal)
        pen.fillStyle = css(color)
        pen.fillRect(x - bounds.left, y - bounds.top, 1, 1)
      }
    }
    // In place, it glows softly by itself, and one crest of light crosses it as it comes right.
    // Under the cursor that gives way to the brighter shine.
    if (figure.glow < 1 && (figure.placed > 0 || crossing)) {
      const since = now - figure.struck
      const own = (along: number) =>
        Math.max(figure.placed * ARRIVAL.glow, crossing ? figure.shown * crestAt(along, since, ARRIVAL.ms) : 0)
      paintLit(shining((along) => (1 - figure.glow) * own(along)), figure, false)
    }
    if (figure.glow > 0) {
      const elapsed = now - figure.since
      paintLit(shining((along) => figure.glow * (moving ? shineAt(along, elapsed) : 1)), figure)
    }
  }

  /** Draws the trail to the Queen: the light runs along it from the Great Bear to her. */
  const paintTrail = (now: number) => {
    const lady = queen
    if (!trail?.pen || !lady) return
    const { pen, frame: bounds, northStar } = trail
    pen.clearRect(0, 0, pen.canvas.width, pen.canvas.height)
    trail.painted = lady.glow > 0
    if (!trail.painted) return
    const elapsed = now - lady.since
    const level = (along: number) => lady.glow * (moving ? shineAt(along, elapsed) : 1)
    const dots = trailDots(trail)
    pen.fillStyle = css(INK.litName)
    dots.forEach(([x, y], i) => {
      pen.globalAlpha = level(i / dots.length)
      pen.fillRect(x - bounds.left, y - bounds.top, 1, 1)
    })
    const plot: Plot = (x, y, color, alpha = 1) => {
      pen.globalAlpha = alpha * level(0.5)
      pen.fillStyle = css(color)
      pen.fillRect(x - bounds.left, y - bounds.top, 1, 1)
    }
    plotWord(plot, 'POLARIS', northStar.x + 3, northStar.y - 9, INK.litName)
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
      if (figure.glow > 0 || figure.placed > 0 || figure.painted || arriving(figure, now)) paintShine(figure, now)
      busy ||= figure.glow !== figure.target || (moving && figure.glow > 0) || arriving(figure, now)
    }
    if (trail && queen && (queen.glow > 0 || trail.painted)) paintTrail(now)
    frame = busy ? requestAnimationFrame(shine) : 0
    if (!busy) lastFrame = 0
  }

  /**
   * Whether the sky can be seen at a place in the window. Beside the page it always can. Inside
   * the page it can where nothing under the cursor, from the element there up to the page
   * itself, is a picture or has a background of its own.
   */
  const skyShowsAt = (x: number, y: number) => {
    for (let element = document.elementFromPoint(x, y); element && element !== page; element = element.parentElement) {
      if (!page.contains(element)) return true
      if (element instanceof HTMLCanvasElement || element instanceof HTMLImageElement) return false
      const style = getComputedStyle(element)
      if (style.backgroundImage !== 'none' || !/\(0, 0, 0, 0\)|transparent/.test(style.backgroundColor)) return false
    }
    return true
  }

  /** Shows a few words beside the cursor, or puts them away. They are not shown over the page's own boxes. */
  const say = (words: string | undefined) => {
    if (!whisper) return
    if (!words || !pointer || !skyShowsAt(pointer.x, pointer.y)) {
      whisper.hidden = true
      return
    }
    whisper.textContent = words
    whisper.hidden = false
    // Below and to the right of the cursor, unless that would leave the window.
    const { offsetWidth, offsetHeight } = whisper
    const x = pointer.x + 16 + offsetWidth > window.innerWidth - 8 ? pointer.x - offsetWidth - 12 : pointer.x + 16
    const y = pointer.y + 22 + offsetHeight > window.innerHeight - 8 ? pointer.y - offsetHeight - 14 : pointer.y + 22
    whisper.style.transform = `translate(${Math.max(8, x)}px, ${Math.max(8, y)}px)`
  }

  /** Lights the constellation the cursor is on, and lets the others go dark. */
  const touch = () => {
    // A finger is less exact than a mouse, so it reaches a little farther.
    const touched = pointer
      ? figureAt(figures, pointer.x / SCALE, (pointer.y + slid) / SCALE, pointer.mouse ? REACH : REACH * 1.6)
      : null
    let changed = false
    for (const figure of figures) {
      const target = figure === touched?.figure ? 1 : 0
      if (target === figure.target) continue
      changed = true
      figure.target = target
      // The wave sets off from the upper left the moment the cursor arrives.
      if (target) figure.since = performance.now()
    }
    // On a galaxy, a nebula or a cluster the words are its name; elsewhere, the constellation's own.
    say(touched?.sight ? touched.sight.sight.name : touched?.figure.whisper)
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

  // The stars twinkle while the page is at rest too. Scrolling draws them anyway, so then this waits.
  const stopTwinkling = moving
    ? whileVisible(holder, TWINKLE_FPS, (now) => {
        if (loose.length && now - starsDrawn > 1000 / TWINKLE_FPS - 4) drawStars(now)
      })
    : () => {}

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
    stopTwinkling()
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
