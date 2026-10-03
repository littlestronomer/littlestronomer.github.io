import { WAY_TO_THE_QUEEN } from './constellations'
import { Pixels, clearPlot, prefersReducedMotion, whileVisible, type Rgb } from './pixels'
import { REACH, figureAt, placeFigures, trailThrough, type Box, type Figure, type Trail } from './skyFigures'
import { INK, paintFar, paintFlags, paintLit, paintMiddle } from './skyPaint'
import { plotWord, shineAt, type Plot } from './starChart'
import { drawField, plotField, scatterField, starSheet, type FieldStar } from './starField'
import { currentTheme, watchTheme } from './theme'

// The sky behind the page: stars, a band of Milky Way, and real constellations joined by thin
// lines, with the galaxies, nebulae and star clusters that lie beside them. It drifts more
// slowly than the page scrolls, so the page seems to float in front of it. The sky itself has
// depth. The Milky Way is the farthest thing in it and barely moves; the constellations move a
// little; and every loose star has a depth of its own, so the near ones pass the far ones as
// the page scrolls. About half of the loose stars twinkle. Under the cursor a constellation shines: a crest of light crosses its
// lines from the upper left to the lower right, again and again, like a Mexican wave.
//
// The northern constellations share the patch of open sky above the footer, placed around the
// pole as they really are. Touching Cassiopeia, the Queen, lights the trail stargazers follow
// to find her: from the Great Bear's pointer stars, through the North Star, and on to her.
//
// This file fits the sky to the page and answers the cursor. skyFigures.ts works out where
// everything stands, skyPaint.ts paints it, and starField.ts scatters and draws the loose stars.

/** One sky pixel is this many screen pixels, finer than the header's so the lines stay thin. */
const SCALE = 2
/**
 * How far the two painted layers of the sky move for each pixel the page scrolls: the Milky
 * Way, far off, and the constellations. The loose stars each have a drift of their own.
 */
const DRIFT = { far: 0.12, middle: 0.3 }
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
 * Draws the constellations into `still`, the Milky Way into the far canvas, the loose stars
 * into the two canvases behind and in front of the constellations, and each constellation's
 * shine into a small canvas of its own inside the lit layer. Returns a function that stops it.
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

  /** Draws the loose stars where the scrolling has brought them, as they twinkle at this moment. */
  const drawStars = (now: number) => {
    starsDrawn = now
    for (const { canvas, stars } of loose) {
      const pen = canvas.getContext('2d')
      if (pen) drawField(pen, sheet, stars, SCALE, window.scrollY, now)
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

    // Under the flags there are no constellations to touch.
    figures = flags
      ? []
      : placeFigures({
          width: columns,
          height: rows,
          perDegree,
          lanes: { left: lanes.left / SCALE, right: lanes.right / SCALE, side: lanes.side / SCALE },
          north: {
            x: width / 2 / SCALE,
            y: (skyHeight - patchFromEnd) / SCALE,
            width: patchWidth / SCALE,
            height: (patchHeight - 56) / SCALE,
          },
        })
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
      // The Milky Way and the constellations are painted once, and each slides at its own pace.
      const middle = new Pixels(columns, rows)
      paintMiddle(clearPlot(middle), figures)
      show(far, paintFar(columns, Math.ceil(tall(DRIFT.far) / SCALE)))
      show(still, middle)
      // The loose stars are drawn again at every scroll, each where its own depth puts it.
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
      paintMiddle(plot, figures)
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
    follow()
  }

  const queueRebuild = () => {
    if (!pending) pending = requestAnimationFrame(rebuild)
  }

  /** Slides the sky to match the scroll position, then checks what the cursor now rests on. */
  const follow = () => {
    slid = moving ? Math.round(window.scrollY * slide) : window.scrollY
    if (moving) {
      for (const layer of [still, lit]) layer.style.transform = `translate3d(0, ${-slid}px, 0)`
      far.style.transform = `translate3d(0, ${-Math.round(window.scrollY * farSlide)}px, 0)`
    }
    drawStars(performance.now())
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
    paintLit(plot, figure)
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
      if (figure.glow > 0 || figure.painted) paintShine(figure, now)
      busy ||= figure.glow !== figure.target || (moving && figure.glow > 0)
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
