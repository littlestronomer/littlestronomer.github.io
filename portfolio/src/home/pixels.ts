// Helpers for the pixel-art canvases. Each canvas is drawn at a low resolution and scaled up
// by CSS with `image-rendering: pixelated`, so every pixel drawn here shows as a crisp block.

export type Rgb = readonly [number, number, number]

export function rgb(hex: string): Rgb {
  const n = Number.parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

/** A 4×4 ordered-dither threshold for (x, y), between 0 and 1. */
export function bayer(x: number, y: number) {
  return BAYER[(y & 3) * 4 + (x & 3)]
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((n) => (n + 0.5) / 16)

/** The pixels of a straight line from one point to another, ends included (Bresenham). */
export function linePoints(x0: number, y0: number, x1: number, y1: number) {
  const points: [number, number][] = []
  let x = Math.round(x0)
  let y = Math.round(y0)
  const endX = Math.round(x1)
  const endY = Math.round(y1)
  const dx = Math.abs(endX - x)
  const dy = -Math.abs(endY - y)
  const stepX = x < endX ? 1 : -1
  const stepY = y < endY ? 1 : -1
  let error = dx + dy
  for (;;) {
    points.push([x, y])
    if (x === endX && y === endY) return points
    const twice = 2 * error
    if (twice >= dy) {
      error += dy
      x += stepX
    }
    if (twice <= dx) {
      error += dx
      y += stepY
    }
  }
}

/** A grid of pixels to draw into, then show on a canvas in one go. */
export class Pixels {
  readonly width: number
  readonly height: number
  readonly image: ImageData

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
    this.image = new ImageData(width, height)
  }

  /** Paints one pixel, blending over what is there when alpha is below 1. */
  set(x: number, y: number, color: Rgb, alpha = 1) {
    x = Math.round(x)
    y = Math.round(y)
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return
    const data = this.image.data
    const k = (y * this.width + x) * 4
    data[k] = data[k] + (color[0] - data[k]) * alpha
    data[k + 1] = data[k + 1] + (color[1] - data[k + 1]) * alpha
    data[k + 2] = data[k + 2] + (color[2] - data[k + 2]) * alpha
    data[k + 3] = 255
  }

  rect(x: number, y: number, width: number, height: number, color: Rgb) {
    for (let row = y; row < y + height; row++) {
      for (let column = x; column < x + width; column++) this.set(column, row, color)
    }
  }

  line(x0: number, y0: number, x1: number, y1: number, color: Rgb, alpha = 1) {
    for (const [x, y] of linePoints(x0, y0, x1, y1)) this.set(x, y, color, alpha)
  }

  copyFrom(other: Pixels) {
    this.image.data.set(other.image.data)
  }

  /** Sizes the canvas to this grid and draws it. */
  show(canvas: HTMLCanvasElement) {
    if (canvas.width !== this.width) canvas.width = this.width
    if (canvas.height !== this.height) canvas.height = this.height
    canvas.getContext('2d')?.putImageData(this.image, 0, 0)
  }
}

/**
 * A way to paint on a layer that is clear wherever nothing is drawn. A faint pixel stays partly
 * see-through, so whatever lies behind the layer shows, where Pixels.set would mix it with black.
 */
export function clearPlot(layer: Pixels) {
  const data = layer.image.data
  return (x: number, y: number, color: Rgb, alpha = 1) => {
    x = Math.round(x)
    y = Math.round(y)
    if (x < 0 || y < 0 || x >= layer.width || y >= layer.height) return
    const k = (y * layer.width + x) * 4
    const under = (data[k + 3] / 255) * (1 - alpha)
    const cover = alpha + under
    if (cover === 0) return
    for (let part = 0; part < 3; part++) data[k + part] = (color[part] * alpha + data[k + part] * under) / cover
    data[k + 3] = cover * 255
  }
}

/**
 * Calls `tick` about `fps` times a second while the element is on screen and the tab is
 * visible. Returns a function that stops it for good.
 */
export function whileVisible(element: Element, fps: number, tick: (now: number) => void) {
  let frame = 0
  let last = 0
  let onScreen = true

  const loop = (now: number) => {
    frame = requestAnimationFrame(loop)
    if (now - last < 1000 / fps - 4) return
    last = now
    tick(now)
  }
  const start = () => {
    if (!frame && onScreen && !document.hidden) frame = requestAnimationFrame(loop)
  }
  const pause = () => {
    cancelAnimationFrame(frame)
    frame = 0
  }

  const observer = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting
    if (onScreen) start()
    else pause()
  })
  observer.observe(element)
  const onVisibility = () => (document.hidden ? pause() : start())
  document.addEventListener('visibilitychange', onVisibility)
  start()

  return () => {
    pause()
    observer.disconnect()
    document.removeEventListener('visibilitychange', onVisibility)
  }
}

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
