import { Pixels, bayer, linePoints, mix, prefersReducedMotion, rgb, whileVisible, type Rgb } from './pixels'
import { plotStar, plotWord, shineAt, wordWidth, type ChartStar, type Look } from './starChart'
import { STEPPE_SKY, drawSteppe, type Steppe } from './steppe'
import { currentTheme, watchTheme, type Theme } from './theme'
import { seededRandom } from './tinyNet'

// The header: a pixel night sky with Orion, my favorite constellation, wired up as a small
// neural network. Its layers run from the head through the shoulders and the belt down to the
// feet. Every few seconds a signal runs down through it and the error flows back up, the way a
// network learns. A little astronomer watches through a telescope, and now and then a shooting
// star goes by.
//
// In the Turkish theme the header becomes the steppe at dusk: the flag's crescent and star hang
// in a red sky, and a rider gallops across the land below (see steppe.ts).

// The header's colors by night, and in the red and white of the Turkish flag.
const INKS = {
  night: {
    sky: ['#07061a', '#0b0a24', '#100e2f', '#16133b', '#1d1948', '#252056', '#2e2765'].map(rgb),
    stars: ['#3a3680', '#6a65b6', '#b2aeee', '#f4f2ff'].map(rgb),
    gold: rgb('#ffe7a3'),
    edge: rgb('#3a358f'),
    signal: rgb('#bfe6ff'),
    errorFlow: rgb('#ff9a52'),
    hillFar: rgb('#110f2e'),
    hillNear: rgb('#06051a'),
    rim: rgb('#2b2662'),
    scarf: rgb('#d9b25c'),
    label: rgb('#5f5aae'),
    nebula: rgb('#b77fc4'),
    lit: rgb('#e3f4ff'),
    halo: rgb('#6fbcff'),
  },
  turk: {
    sky: STEPPE_SKY,
    stars: ['#b2262f', '#d9575f', '#f8a9ae', '#ffffff'].map(rgb),
    gold: rgb('#ffffff'),
    edge: rgb('#f08088'),
    signal: rgb('#ffffff'),
    errorFlow: rgb('#ffffff'),
    hillFar: rgb('#a00710'),
    hillNear: rgb('#74050c'),
    rim: rgb('#c5363f'),
    scarf: rgb('#ffffff'),
    label: rgb('#f9b4b8'),
    nebula: rgb('#ffffff'),
    lit: rgb('#ffffff'),
    halo: rgb('#ffffff'),
  },
}

type Ink = (typeof INKS)['night']

const AROUND = [[1, 0], [-1, 0], [0, 1], [0, -1]]

// Orion's main stars by right ascension and declination (degrees, J2000), layer by layer:
// Meissa (the head); Betelgeuse and Bellatrix (the shoulders); Alnitak, Alnilam and Mintaka
// (the belt); Saiph and Rigel (the feet). `size` 2 marks the two brightest, 0 the faint head.
const ORION: { ra: number; dec: number; size: number; look: Look }[][] = [
  [{ ra: 83.78, dec: 9.93, size: 0, look: 'blue' }],
  [
    { ra: 88.79, dec: 7.41, size: 2, look: 'red' },
    { ra: 81.28, dec: 6.35, size: 1, look: 'blue' },
  ],
  [
    { ra: 85.19, dec: -1.94, size: 1, look: 'blue' },
    { ra: 84.05, dec: -1.2, size: 1, look: 'blue' },
    { ra: 83.0, dec: -0.3, size: 1, look: 'blue' },
  ],
  [
    { ra: 86.94, dec: -9.67, size: 1, look: 'blue' },
    { ra: 78.63, dec: -8.2, size: 2, look: 'blue' },
  ],
]
// The sword hanging below the belt, with the Orion Nebula in the middle of it.
const SWORD = [
  { ra: 83.85, dec: -4.84 },
  { ra: 83.86, dec: -5.91 },
]
const NEBULA_AT = { ra: 83.82, dec: -5.39 }
const MIDDLE = { ra: 83.7, dec: 0.13 }
const SPAN = { ra: 11, dec: 20.5 }

const CYCLE_MS = 8000
const FPS = 20
const METEOR_MS = 650

type Box = { left: number; top: number; right: number; bottom: number }
type Star = { x: number; y: number; level: number; sky: Rgb; phase: number; speed: number }
type Node = ChartStar
type Meteor = { start: number; x: number; y: number }

type Scene = {
  ink: Ink
  base: Pixels
  frame: Pixels
  twinklers: Star[]
  /** Orion's stars by layer, or nothing under the flag. */
  nodes: Node[][]
  /** For each pair of neighbouring layers, the pixels of every line between them. */
  edges: [number, number][][][]
  /** Where Orion, Betelgeuse and the astronomer are, in canvas pixels, for the buttons over them. */
  orion: Box | null
  betelgeuse: Box | null
  astronomer: Box
  hill: (x: number) => number
  /** Under the flag, the land the rider gallops across. */
  steppe: Steppe | null
}

export type NightSky = {
  /** Whether the sky moves; with reduced motion it is drawn once and stays still. */
  moving: boolean
  /** Sends a signal through Orion right away. */
  fire: () => void
  /** Lights Orion's lines while the cursor is over it. */
  glow: (on: boolean) => void
  /** Makes Betelgeuse flare while the cursor is on it. */
  flare: (on: boolean) => void
  /** Sends a shooting star across the sky. */
  shootingStar: () => void
  stop: () => void
}

function skyColor(ink: Ink, x: number, y: number, height: number) {
  const t = (y / Math.max(1, height - 1)) ** 1.25 * (ink.sky.length - 1)
  const band = Math.floor(t)
  return t - band > bayer(x, y) ? ink.sky[Math.min(band + 1, ink.sky.length - 1)] : ink.sky[band]
}

function buildScene(width: number, height: number, narrow: boolean, avoid: Box | null, theme: Theme): Scene {
  const ink = INKS[theme]
  const flag = theme === 'turk'
  const random = seededRandom(1999)
  const base = new Pixels(width, height)
  const sky = (x: number, y: number) => skyColor(ink, x, y, height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) base.set(x, y, sky(x, y))
  }

  // Where Orion goes, as fractions of the width and height, and how many pixels a degree is.
  const area: Box = narrow
    ? { left: 0.56, top: 0.33, right: 0.88, bottom: 0.88 }
    : { left: 0.66, top: 0.06, right: 0.88, bottom: 0.8 }
  const degree = Math.min(((area.right - area.left) * width) / SPAN.ra, ((area.bottom - area.top) * height) / SPAN.dec)
  const centerX = ((area.left + area.right) / 2) * width
  const centerY = ((area.top + area.bottom) / 2) * height
  // East is on the left when you face Orion, so right ascension grows to the left.
  const place = (ra: number, dec: number) => ({
    x: Math.round(centerX + (MIDDLE.ra - ra) * degree),
    y: Math.round(centerY - (dec - MIDDLE.dec) * degree),
  })

  const astronomerX = Math.round(width * (narrow ? 0.2 : 0.5))
  const ground = height * (narrow ? 0.92 : 0.88)

  // Two rows of hills; the near one rises into a small crest for the astronomer to stand on.
  const farHill = (x: number) => Math.round(ground - 5 - 2.5 * Math.sin(x * 0.045 + 1.3) - 1.5 * Math.sin(x * 0.13))
  const crest = (x: number) => 4.5 * Math.exp(-(((x - astronomerX) / 22) ** 2))
  const nearHill = (x: number) => Math.round(ground + 1.5 * Math.sin(x * 0.03 + 0.4) + Math.sin(x * 0.11) - crest(x))

  const nodes = flag
    ? []
    : ORION.map((layer) => layer.map((star) => ({ ...place(star.ra, star.dec), size: star.size, look: star.look })))
  const all = nodes.flat()
  // The part of the sky kept clear of bright stars: Orion, or the flag's crescent and star,
  // which hang high enough to clear the mountains and the rider.
  const emblem = narrow
    ? { x: Math.round(width * 0.8), y: Math.round(height * 0.42), unit: height * 0.42 }
    : { x: Math.round(centerX), y: Math.round(height * 0.33), unit: Math.min(84, height * 1.05) }
  const focus: Box = flag
    ? {
        left: emblem.x - emblem.unit * 0.36,
        top: emblem.y - emblem.unit * 0.27,
        right: emblem.x + emblem.unit * 0.36,
        bottom: emblem.y + emblem.unit * 0.27,
      }
    : {
        left: Math.min(...all.map((node) => node.x)) - 4,
        top: Math.min(...all.map((node) => node.y)) - 4,
        right: Math.max(...all.map((node) => node.x)) + 4,
        bottom: Math.max(...all.map((node) => node.y)) + 4,
      }
  const near = (x: number, y: number, box: Box, pad: number) =>
    x >= box.left - pad && x <= box.right + pad && y >= box.top - pad && y <= box.bottom + pad

  // Background stars, fewer and fainter behind the words and around Orion. The flag's sky has
  // only a few, so the red stays clean.
  const stars: Star[] = []
  const count = Math.round((width * height) / (flag ? 150 : 48))
  for (let i = 0; i < count; i++) {
    const x = Math.floor(random() * width)
    const y = Math.floor(random() * (farHill(x) - 2))
    const roll = random()
    let level = roll < 0.56 ? 0 : roll < 0.84 ? 1 : roll < 0.96 ? 2 : 3
    if ((avoid && near(x, y, avoid, 0)) || near(x, y, focus, 0)) level = Math.min(level, 1)
    if (flag && near(x, y, focus, 2)) continue
    stars.push({ x, y, level, sky: sky(x, y), phase: random() * Math.PI * 2, speed: 0.5 + random() * 1.8 })
  }
  for (const star of stars) base.set(star.x, star.y, ink.stars[star.level])
  const twinklers = stars.filter((star) => star.level > 0 && random() < 0.45)

  let edges: [number, number][][][] = []
  if (flag) {
    drawCrescentAndStar(base, emblem.x, emblem.y, emblem.unit)
  } else {
    // A few golden four-pointed stars, away from the words and from Orion.
    for (let placed = 0, tries = 0; placed < (narrow ? 2 : 4) && tries < 80; tries++) {
      const x = Math.round(width * (0.05 + random() * 0.9))
      const y = Math.round(height * (0.08 + random() * 0.45))
      if ((avoid && near(x, y, avoid, 3)) || near(x, y, focus, 6)) continue
      base.set(x, y, ink.stars[3])
      for (const [dx, dy] of AROUND) base.set(x + dx, y + dy, ink.gold)
      placed++
    }

    // The Orion Nebula: a soft violet glow in the sword, dithered into the sky.
    const nebula = place(NEBULA_AT.ra, NEBULA_AT.dec)
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const strength = 1 - Math.hypot(dx * 0.9, dy) / 2.6
        if (strength > bayer(nebula.x + dx, nebula.y + dy) * 0.9) {
          base.set(nebula.x + dx, nebula.y + dy, ink.nebula, 0.25 + 0.45 * strength)
        }
      }
    }
    base.set(nebula.x, nebula.y, ink.stars[2])
    for (const star of SWORD) {
      const { x, y } = place(star.ra, star.dec)
      base.set(x, y, ink.stars[1])
    }

    // Every star in one layer is joined to every star in the next, with dotted lines like a
    // star chart's. Signals still run along every pixel of them.
    edges = nodes.slice(0, -1).map((layer, l) =>
      layer.flatMap((from) => nodes[l + 1].map((to) => linePoints(from.x, from.y, to.x, to.y).slice(2, -2))),
    )
    for (const gap of edges) {
      for (const points of gap) points.forEach(([x, y], i) => i % 2 === 0 && base.set(x, y, ink.edge))
    }
    for (const node of all) drawStar(base, node, null)

    // The name, small and quiet, the way star charts label constellations.
    const labelWidth = wordWidth('ORION')
    const labelX = focus.right + 3 + labelWidth < width - 2 ? focus.right + 3 : focus.left - 3 - labelWidth
    plotWord((x, y, color) => base.set(x, y, color), 'ORION', labelX, nodes[2][1].y - 2, ink.label)
  }

  const footY = nearHill(astronomerX)
  if (!flag) {
    // The hills, each with a faint rim of starlight along the top.
    for (let x = 0; x < width; x++) {
      const far = farHill(x)
      for (let y = far; y < height; y++) base.set(x, y, y === far ? mix(ink.hillFar, ink.rim, 0.5) : ink.hillFar)
      const top = nearHill(x)
      for (let y = top; y < height; y++) base.set(x, y, y === top ? ink.rim : ink.hillNear)
    }
    drawAstronomer(base, ink, astronomerX, footY, nodes[2][1])
  }
  const astronomer = { left: astronomerX - 8, top: footY - 22, right: astronomerX + 18, bottom: footY + 1 }

  // Betelgeuse is the first shoulder; a finger needs a bigger target than a mouse.
  const giant = flag ? null : nodes[1][0]
  const reach = narrow ? 8 : 6
  return {
    ink,
    base,
    frame: new Pixels(width, height),
    twinklers,
    nodes,
    edges,
    orion: flag ? null : focus,
    betelgeuse: giant && { left: giant.x - reach, top: giant.y - reach, right: giant.x + reach + 1, bottom: giant.y + reach + 1 },
    astronomer,
    hill: farHill,
    // The rider keeps to the middle of the header while the land runs past.
    steppe: flag ? { ground: Math.round(ground), riderX: Math.round(width / 2) } : null,
  }
}

/** Draws one of Orion's stars; `glow` lights it up while a signal passes through. */
function drawStar(pixels: Pixels, node: Node, glow: Rgb | null) {
  plotStar((x, y, color, alpha) => pixels.set(x, y, color, alpha), node, glow)
}

/**
 * The crescent and star of the Turkish flag in white, centred on (centerX, centerY), with the
 * proportions the flag law gives in terms of the flag's height (`unit`): an outer circle half
 * that wide, an inner circle 0.4 wide set 1/16 toward the star, and a star in a circle a quarter
 * wide, with one point toward the crescent.
 */
function drawCrescentAndStar(pixels: Pixels, centerX: number, centerY: number, unit: number) {
  const white = rgb('#ffffff')
  // The emblem runs from the crescent's back to the star's far points; centre that span.
  const outerX = centerX - 0.0979 * unit
  const innerX = outerX + 0.0625 * unit
  const starX = outerX + 0.3208 * unit
  const starRadius = 0.125 * unit
  // The ten corners of the star: five points, the first aimed at the crescent, and the five
  // notches between them.
  const corners = Array.from({ length: 10 }, (_, i) => {
    const angle = Math.PI + (i * Math.PI) / 5
    const radius = i % 2 === 0 ? starRadius : starRadius * 0.382
    return [starX + radius * Math.cos(angle), centerY + radius * Math.sin(angle)]
  })
  const inStar = (x: number, y: number) => {
    let inside = false
    for (let i = 0, j = corners.length - 1; i < corners.length; j = i++) {
      const [xi, yi] = corners[i]
      const [xj, yj] = corners[j]
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
    }
    return inside
  }
  for (let y = Math.floor(centerY - unit * 0.26); y <= centerY + unit * 0.26; y++) {
    for (let x = Math.floor(outerX - unit * 0.26); x <= starX + starRadius + 1; x++) {
      const crescent =
        Math.hypot(x - outerX, y - centerY) <= unit * 0.25 && Math.hypot(x - innerX, y - centerY) > unit * 0.2
      if (crescent || inStar(x, y)) pixels.set(x, y, white)
    }
  }
}

/** A child in a scarf at a telescope on a tripod, as a silhouette against the sky. */
function drawAstronomer(pixels: Pixels, ink: Ink, footX: number, footY: number, target: { x: number; y: number }) {
  const shape = new Set<number>()
  const scarf = new Set<number>()
  const key = (x: number, y: number) => y * 4096 + x
  const put = (x: number, y: number, into = shape) => into.add(key(Math.round(x), Math.round(y)))

  // Legs and a coat that widens toward the hem.
  for (let y = footY - 3; y < footY; y++) {
    put(footX - 1, y)
    put(footX + 1, y)
  }
  for (let row = 0; row < 6; row++) {
    const y = footY - 4 - row
    const half = row < 2 ? 2 : 1
    for (let x = footX - half; x <= footX + half; x++) put(x, y)
  }
  // Head, leaning toward the eyepiece.
  for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, -1], [1, -1], [-1, -1], [0, 1], [1, 1], [-1, 1], [0, -2], [2, -1], [2, 0]]) {
    put(footX + dx, footY - 12 + dy)
  }
  // A scarf blowing back in the wind.
  for (const [dx, dy] of [[-1, -10], [0, -10], [1, -10], [-2, -10], [-3, -11], [-4, -11], [-5, -12]]) {
    put(footX + dx, footY + dy, scarf)
  }

  // The telescope points at Orion's belt, from an eyepiece just ahead of the face.
  const eyepiece = { x: footX + 3, y: footY - 12 }
  let angle = Math.atan2(eyepiece.y - target.y, target.x - eyepiece.x)
  angle = Math.min(Math.max(angle, 0.2), 1.05)
  const direction = { x: Math.cos(angle), y: -Math.sin(angle) }
  for (let step = 0; step <= 11; step++) {
    const x = eyepiece.x + direction.x * step
    const y = eyepiece.y + direction.y * step
    put(x, y)
    put(x + 1, y)
    if (step > 7) put(x, y - 1)
  }
  // The arm reaching to the eyepiece, and the tripod.
  for (const [x, y] of linePoints(footX + 1, footY - 8, eyepiece.x, eyepiece.y + 1)) put(x, y)
  const mount = { x: Math.round(eyepiece.x + direction.x * 5), y: Math.round(eyepiece.y + direction.y * 5) + 1 }
  for (const legX of [mount.x - 3, mount.x + 1, mount.x + 4]) {
    for (const [x, y] of linePoints(mount.x, mount.y, legX, footY)) put(x, y)
  }

  for (const k of shape) {
    const x = k % 4096
    const y = Math.floor(k / 4096)
    pixels.set(x, y, shape.has(key(x, y - 1)) ? ink.hillNear : ink.rim)
  }
  for (const k of scarf) pixels.set(k % 4096, Math.floor(k / 4096), ink.scarf)
  // Starlight caught in the lens.
  pixels.set(eyepiece.x + direction.x * 11 + 1, eyepiece.y + direction.y * 11 - 1, ink.gold)
}

/** What the cursor is doing to Orion: lighting its lines, and making Betelgeuse flare. */
type Hover = { glow: number; since: number; flare: boolean }

function drawFrame(scene: Scene, now: number, cycleStart: number, meteors: Meteor[], hover: Hover) {
  const { frame, nodes, edges, orion, ink } = scene
  frame.copyFrom(scene.base)

  // Under the cursor, Orion's lines fill in and shine like the constellations behind the page:
  // a crest of light crosses them from the upper left to the lower right.
  if (orion && hover.glow > 0.02) {
    const diagonal = orion.right - orion.left + (orion.bottom - orion.top)
    const level = (x: number, y: number) =>
      hover.glow * shineAt((x - orion.left + (y - orion.top)) / diagonal, now - hover.since)
    for (const gap of edges) {
      for (const points of gap) {
        for (const [x, y] of points) {
          const halo = 0.24 * level(x, y)
          for (const [dx, dy] of AROUND) frame.set(x + dx, y + dy, ink.halo, halo)
        }
      }
    }
    for (const gap of edges) for (const points of gap) for (const [x, y] of points) frame.set(x, y, ink.lit, level(x, y))
    for (const node of nodes.flat()) drawStar(frame, node, null)
  }

  for (const star of scene.twinklers) {
    const wave = Math.sin((now / 1000) * star.speed + star.phase)
    const level = star.level + (wave > 0.75 ? 1 : wave < -0.8 ? -1 : 0)
    frame.set(star.x, star.y, level < 0 ? star.sky : ink.stars[Math.min(level, 3)])
  }

  // Shooting stars: a bright head with a fading tail, gone before they reach the hills.
  for (const meteor of meteors) {
    const progress = (now - meteor.start) / METEOR_MS
    if (progress < 0 || progress > 1) continue
    const headX = meteor.x - progress * 36
    const headY = meteor.y + progress * 16
    for (let i = 0; i < 8; i++) {
      const x = Math.round(headX + i * 0.9)
      const y = Math.round(headY - i * 0.4)
      if (y >= scene.hill(x) - 1) continue
      frame.set(x, y, i === 0 ? ink.stars[3] : ink.signal, Math.max(0, (1 - i / 8) * (1 - progress * 0.6)))
    }
  }

  if (scene.steppe) drawSteppe(frame, scene.steppe, now)
  if (nodes.length === 0) return

  // Betelgeuse is a variable star: its glow slowly swells and fades. It flares under the cursor,
  // where a click opens its page.
  const giant = nodes[1][0]
  if (hover.flare) {
    drawStar(frame, giant, ink.errorFlow)
    for (const [dx, dy] of AROUND) frame.set(giant.x + dx * 3, giant.y + dy * 3, ink.errorFlow, 0.5)
  } else {
    const swell = 0.5 + 0.5 * Math.sin(now / 1100)
    for (const [dx, dy] of AROUND) frame.set(giant.x + dx * 3, giant.y + dy * 3, ink.errorFlow, 0.4 * swell)
  }

  // A signal runs down through Orion, layer by layer, then the error flows back up.
  const t = ((((now - cycleStart) % CYCLE_MS) + CYCLE_MS) % CYCLE_MS) / 1000
  const pulse = (gap: number, progress: number, color: Rgb, forward: boolean) => {
    for (const points of edges[gap]) {
      if (points.length === 0) continue
      const along = forward ? progress : 1 - progress
      const head = Math.min(points.length - 1, Math.floor(along * points.length))
      const behind = forward ? -1 : 1
      frame.set(points[head][0], points[head][1], color)
      const tail = points[head + behind]
      if (tail) frame.set(tail[0], tail[1], mix(ink.edge, color, 0.5))
      const tail2 = points[head + behind * 2]
      if (tail2) frame.set(tail2[0], tail2[1], mix(ink.edge, color, 0.25))
    }
  }
  const flash = (layer: number, start: number, color: Rgb) => {
    if (t >= start && t < start + 0.35) for (const node of nodes[layer]) drawStar(frame, node, color)
  }

  const forwardStart = 0.3
  const forwardStep = 0.75
  flash(0, forwardStart - 0.3, ink.signal)
  for (let gap = 0; gap < edges.length; gap++) {
    const start = forwardStart + gap * forwardStep
    const progress = (t - start) / (forwardStep - 0.05)
    if (progress >= 0 && progress < 1) pulse(gap, progress, ink.signal, true)
    flash(gap + 1, start + forwardStep - 0.05, ink.signal)
  }
  const backwardStart = forwardStart + edges.length * forwardStep + 0.6
  const backwardStep = 0.6
  for (let i = 0; i < edges.length; i++) {
    const gap = edges.length - 1 - i
    const start = backwardStart + i * backwardStep
    const progress = (t - start) / (backwardStep - 0.05)
    if (progress >= 0 && progress < 1) pulse(gap, progress, ink.errorFlow, false)
    flash(gap, start + backwardStep - 0.05, ink.errorFlow)
  }
}

type Spots = { orion: HTMLElement | null; betelgeuse: HTMLElement | null; astronomer: HTMLElement | null }

/** Draws the sky into the canvas and keeps it moving. */
export function startNightSky(canvas: HTMLCanvasElement, words: HTMLElement | null, spots: Spots): NightSky {
  const header = canvas.parentElement
  const moving = !prefersReducedMotion()
  let scene: Scene | null = null
  let scale = 3
  let cycleStart = 0
  let meteors: Meteor[] = []
  let nextMeteor = performance.now() + 4000
  const hover: Hover = { glow: 0, since: 0, flare: false }
  /** How lit Orion's lines should become. */
  let glowTarget = 0
  const random = seededRandom(Date.now())

  const redraw = (now: number) => {
    if (!scene) return
    drawFrame(scene, now, cycleStart, meteors, hover)
    scene.frame.show(canvas)
  }

  // The buttons over Orion, Betelgeuse and the astronomer follow them when the header resizes.
  const cover = (spot: HTMLElement | null, box: Box | null) => {
    if (!spot || !box) return
    spot.style.left = `${box.left * scale}px`
    spot.style.top = `${box.top * scale}px`
    spot.style.width = `${(box.right - box.left) * scale}px`
    spot.style.height = `${(box.bottom - box.top) * scale}px`
  }

  const rebuild = () => {
    if (!header) return
    const { width, height } = header.getBoundingClientRect()
    if (width === 0 || height === 0) return
    scale = width < 560 ? 2 : 3
    const narrow = width < 720
    const columns = Math.ceil(width / scale)
    const rows = Math.ceil(height / scale)
    let avoid: Box | null = null
    if (words) {
      const box = words.getBoundingClientRect()
      const origin = header.getBoundingClientRect()
      avoid = {
        left: (box.left - origin.left) / scale,
        top: (box.top - origin.top) / scale,
        right: (box.right - origin.left) / scale,
        bottom: (box.bottom - origin.top) / scale,
      }
    }
    scene = buildScene(columns, rows, narrow, avoid, currentTheme())
    canvas.style.width = `${columns * scale}px`
    canvas.style.height = `${rows * scale}px`
    cover(spots.orion, scene.orion)
    cover(spots.betelgeuse, scene.betelgeuse)
    cover(spots.astronomer, scene.astronomer)
    // A still sky shows the moment between two signals.
    redraw(moving ? performance.now() : CYCLE_MS - 100)
  }

  const shootingStar = (now = performance.now()) => {
    if (!scene || !moving) return
    const width = scene.base.width
    const height = scene.base.height
    meteors = meteors.filter((meteor) => now - meteor.start < METEOR_MS)
    meteors.push({ start: now, x: width * (0.45 + random() * 0.5), y: height * (0.04 + random() * 0.25) })
  }

  const resizes = new ResizeObserver(rebuild)
  if (header) resizes.observe(header)
  const unwatch = watchTheme(rebuild)
  // The words move once the web fonts arrive, and the stars make room for them.
  document.fonts?.ready.then(rebuild)

  const stopLoop =
    moving && header
      ? whileVisible(header, FPS, (now) => {
          if (now > nextMeteor) {
            shootingStar(now)
            nextMeteor = now + 9000 + random() * 12000
          }
          hover.glow += (glowTarget - hover.glow) * 0.4
          redraw(now)
        })
      : () => {}

  return {
    moving,
    fire: () => {
      cycleStart = performance.now()
    },
    glow: (on) => {
      if (on && !glowTarget) hover.since = performance.now()
      glowTarget = on ? 1 : 0
    },
    flare: (on) => {
      hover.flare = on
    },
    shootingStar: () => shootingStar(),
    stop: () => {
      stopLoop()
      unwatch()
      resizes.disconnect()
    },
  }
}
