import { bayer, prefersReducedMotion } from './pixels'

// How the site changes between the night sky and the flag, in either direction. First the page
// glides to its top: slowly at first, fast in the middle, slowly again. Then the new page takes
// the old one's place a pixel at a time. The change starts in the top left corner and spreads
// as a widening arc until it reaches the bottom right.

/** The glide to the top takes this long: more from far down the page, within limits. */
const GLIDE_MS = { shortest: 450, longest: 1500, perPixel: 0.3 }
/** The spreading change takes this long, in steps of about one frame each. */
const WIPE_MS = 1400
const STEP_MS = 16
/** The window is about this many of the wipe's pixels across its longer side. */
const PIXELS_ACROSS = 80
/** The edge of the change is no clean line: over this many pixels it thins out in a pattern. */
const EDGE = 6

/** Slow at both ends and fast in the middle. */
function easeInOut(t: number, power: number) {
  return t < 0.5 ? 2 ** (power - 1) * t ** power : 1 - (-2 * t + 2) ** power / 2
}

/** Scrolls the page to its top, however far down it is. */
function glideToTop() {
  const from = window.scrollY
  if (from < 1) return Promise.resolve()
  const duration = Math.min(GLIDE_MS.longest, GLIDE_MS.shortest + from * GLIDE_MS.perPixel)
  return new Promise<void>((resolve) => {
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      window.scrollTo({ top: from * (1 - easeInOut(t, 3)), behavior: 'instant' })
      if (t < 1) requestAnimationFrame(step)
      else resolve()
    }
    requestAnimationFrame(step)
  })
}

/**
 * The steps of the wipe, from nothing changed to everything changed, for a window of this size.
 * Each step is the part of the window that has changed so far, as a CSS shape.
 */
function wipeSteps(width: number, height: number) {
  const pixel = Math.max(10, Math.min(24, Math.round(Math.max(width, height) / PIXELS_ACROSS)))
  const columns = Math.ceil(width / pixel)
  const rows = Math.ceil(height / pixel)

  // A pixel changes when the arc reaches it: that is its distance from the top left corner, put
  // a little earlier or later by the same ordered dither that shades the sky.
  const turns = new Float32Array(columns * rows)
  let last = 0
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const turn = Math.hypot(x + 0.5, y + 0.5) + (bayer(x, y) - 0.5) * EDGE
      turns[y * columns + x] = turn
      last = Math.max(last, turn)
    }
  }

  const count = Math.round(WIPE_MS / STEP_MS)
  return Array.from({ length: count }, (_, step) => {
    if (step === count - 1) return 'inset(0)'
    const reached = (last + EDGE) * easeInOut(step / (count - 1), 2) - EDGE / 2
    // The changed pixels of each row, gathered into runs.
    let shape = ''
    for (let y = 0; y < rows; y++) {
      let run = -1
      for (let x = 0; x <= columns; x++) {
        const changed = x < columns && turns[y * columns + x] <= reached
        if (changed && run < 0) run = x
        if (!changed && run >= 0) {
          const long = (x - run) * pixel
          shape += `M${run * pixel} ${y * pixel}h${long}v${pixel}h${-long}z`
          run = -1
        }
      }
    }
    return shape ? `path("${shape}")` : 'inset(100%)'
  })
}

/**
 * Changes the site between its two themes. `change` must put the new page in place at once;
 * it is called when the show is ready for it.
 */
export async function shiftTheme(change: () => void) {
  if (prefersReducedMotion()) return change()
  await glideToTop()
  if (!('startViewTransition' in document)) return change()

  // The browser keeps a picture of the old page and shows the new one over it, and the new one
  // spreads across the old.
  const steps = wipeSteps(window.innerWidth, window.innerHeight)
  const root = document.documentElement
  root.classList.add('theme-wipe')
  const transition = document.startViewTransition(change)
  let wipe: Animation | undefined
  try {
    await transition.ready
    wipe = root.animate(
      steps.map((clipPath) => ({ clipPath, easing: 'step-end' })),
      { duration: WIPE_MS, fill: 'both', pseudoElement: '::view-transition-new(root)' },
    )
    await transition.finished
  } catch {
    // The browser may skip the show, when the window is hidden for one. The page has changed
    // all the same.
  } finally {
    // The wipe holds its last step until it is taken away, and would otherwise still be there
    // for the next change.
    wipe?.cancel()
    root.classList.remove('theme-wipe')
  }
}
