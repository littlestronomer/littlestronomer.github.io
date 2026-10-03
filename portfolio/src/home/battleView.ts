import { BATTLES, type Aim, type Battle, type Mark, type Point, type Stand, type Unit } from './battles'
import { Pixels, bayer, linePoints, rgb, whileVisible } from './pixels'
import { plotWord } from './starChart'
import { seededRandom } from './tinyNet'

// Plays the battles on a small map: white dots for the Turkish side, dark dots for their
// opponents. Each battle runs once from start to finish, one caption at a time, rests on its
// last moment, and makes way for the next.

/** The map is this many pixels across; CSS scales it up four times. */
export const BATTLE_MAP = 72
/** A caption, and the fighting it describes, stays long enough to be read: this long for each
    letter, within limits. */
const READ_MS = 50
const SHORTEST_MS = 4500
const LONGEST_MS = 9000
const REST_MS = 4000
const FPS = 30
/** Dots in a body of soldiers stand this many pixels apart. */
const SPACING = 3
/** How long one arrow or one shot takes to fly. */
const FLIGHT_MS = 420
/** How long a blast shows, as a share of a caption's time. */
const BLAST = 0.22

const GROUND = rgb('#9c0812')
const GROUND_DARK = rgb('#8a0710')
const GROUND_LIGHT = rgb('#ac0d18')
const HIGH = rgb('#7c0610')
const HILL = rgb('#5c040a')
const HILL_LIGHT = rgb('#c5363f')
const SEA = rgb('#1c7c84')
const WAVE = rgb('#3fa3a4')
const SURF = rgb('#9fd9cf')
const SAND = rgb('#f2d08a')
const WOOD = rgb('#6b3a12')
const TURK = rgb('#ffffff')
const FOE = rgb('#1a0103')
const SHADOW = rgb('#2a0004')
const FLASH = rgb('#fff3b0')
const SMOKE = rgb('#f6c4c7')
const LABEL = rgb('#ffe1c2')

const WATER = 1
const MARSH = 2
const HEIGHTS = 3
const KINDS = { water: WATER, marsh: MARSH, heights: HEIGHTS }

const AIMS: Record<Aim, Point> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }

export type BattleStatus = {
  /** Which battle is on the map, as a place in BATTLES. */
  battle: number
  /** Which of its captions has been reached. */
  phase: number
}

export type BattleControls = {
  setPaused: (paused: boolean) => void
  /** Puts another battle on the map, from its start. */
  show: (battle: number) => void
  /** Jumps to one caption of the battle on the map. */
  toPhase: (phase: number) => void
  stop: () => void
}

type Full = Required<Stand>
const PARTS = ['x', 'y', 'loose', 'left', 'bend'] as const

/** A path with every stand spelled out: anything left unsaid carries over from the stand before. */
function spellOut(path: Stand[]): Full[] {
  let last: Full = { at: 0, x: 0, y: 0, loose: 1, left: 1, bend: 0 }
  return path.map((stand) => (last = { ...last, ...stand }))
}

/**
 * How fast each part of a stand is changing as the body passes through it. A body that keeps
 * going in the same direction passes through without slowing; one that halts or turns back
 * comes to rest first. (These are the slopes of a monotone cubic curve, so nothing overshoots.)
 */
function slopes(path: Full[]) {
  return path.map((stand, i) => {
    const slope = { x: 0, y: 0, loose: 0, left: 0, bend: 0 }
    if (i === 0 || i === path.length - 1) return slope
    const before = path[i - 1]
    const after = path[i + 1]
    const gapIn = stand.at - before.at
    const gapOut = after.at - stand.at
    for (const part of PARTS) {
      const into = (stand[part] - before[part]) / gapIn
      const out = (after[part] - stand[part]) / gapOut
      if (into * out > 0) slope[part] = (3 * (gapIn + gapOut)) / ((2 * gapOut + gapIn) / into + (gapOut + 2 * gapIn) / out)
    }
    return slope
  })
}

type Slopes = ReturnType<typeof slopes>

/** Where a body of soldiers stands at moment `t`. */
function standAt(path: Full[], pace: Slopes, t: number): Full {
  const next = path.findIndex((stand) => stand.at >= t)
  if (next <= 0) return next === 0 ? path[0] : path[path.length - 1]
  const from = path[next - 1]
  const to = path[next]
  const gap = to.at - from.at
  const s = (t - from.at) / gap
  const stand = { ...to, at: t }
  for (const part of PARTS) {
    stand[part] =
      (2 * s ** 3 - 3 * s ** 2 + 1) * from[part] +
      (s ** 3 - 2 * s ** 2 + s) * gap * pace[next - 1][part] +
      (-2 * s ** 3 + 3 * s ** 2) * to[part] +
      (s ** 3 - s ** 2) * gap * pace[next][part]
  }
  return stand
}

/** A unit ready to draw: its path, and for each dot a small offset and a turn to fall. */
type Body = { unit: Unit; path: Full[]; pace: Slopes; nudges: Point[]; falls: number[] }

/** A battle ready to play: its ground painted once, its bodies of soldiers, and the time in
    milliseconds at which each caption ends. */
export type Scene = { battle: Battle; ground: Pixels; bodies: Body[]; ends: number[] }

type Spot = { x: number; y: number; strength: number }

function muster(battle: Battle): Body[] {
  const random = seededRandom(battle.name.length * 97 + battle.units.length)
  return battle.units.map((unit) => {
    // The order in which dots drop out as the body breaks, shuffled so the gaps look ragged.
    const falls = Array.from({ length: unit.dots }, (_, i) => i)
    for (let i = falls.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      const swap = falls[i]
      falls[i] = falls[j]
      falls[j] = swap
    }
    const path = spellOut(unit.path)
    // Soldiers stand a little unevenly; ships and wagons keep their places.
    const ragged = unit.kind === undefined || unit.kind === 'men'
    const nudges = falls.map((): Point => (ragged ? [random() - 0.5, random() - 0.5] : [0, 0]))
    return { unit, path, pace: slopes(path), nudges, falls }
  })
}

/** Whether a point lies inside a shape given by its corners. */
function inside(shape: Point[], x: number, y: number) {
  let within = false
  for (let i = 0, j = shape.length - 1; i < shape.length; j = i++) {
    const [xi, yi] = shape[i]
    const [xj, yj] = shape[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) within = !within
  }
  return within
}

/** Evenly spaced points from one end of a row to the other, about `gap` pixels apart. */
function along([[x0, y0], [x1, y1]]: [Point, Point], gap: number, count?: number): Point[] {
  const places = count ?? Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / gap) + 1)
  return Array.from({ length: places }, (_, i): Point => {
    const t = places === 1 ? 0 : i / (places - 1)
    return [Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t)]
  })
}

/** Every pixel of a line drawn through several points. */
function trace(line: Point[]) {
  return line.slice(1).flatMap(([x, y], i) => linePoints(line[i][0], line[i][1], x, y).slice(i === 0 ? 0 : 1))
}

function hill(picture: Pixels, x: number, y: number) {
  for (let row = 0; row < 3; row++) {
    for (let dx = -row; dx <= row; dx++) picture.set(x + dx, y + row, dx === -row ? HILL_LIGHT : HILL)
  }
}

/** The things on the ground that never change: drawn once, onto the painted ground. */
function drawMark(picture: Pixels, mark: Mark) {
  switch (mark.kind) {
    case 'hills':
      along(mark.line, 5).forEach(([x, y], i) => hill(picture, x, y + (i % 2 === 0 ? -1 : 1)))
      break
    case 'stakes':
      for (const [x, y] of along(mark.line, 3)) {
        picture.set(x, y, SAND)
        picture.set(x + 1, y - 1, SAND)
      }
      break
    case 'carts':
      for (const [x, y] of along(mark.line, 5)) {
        picture.rect(x - 1, y, 3, 2, SAND)
        picture.set(x - 1, y + 2, WOOD)
        picture.set(x + 1, y + 2, WOOD)
      }
      break
    case 'tents':
      for (const [x, y] of along(mark.line, 5)) {
        picture.set(x, y - 1, SAND)
        picture.rect(x - 1, y, 3, 1, SAND)
        picture.set(x, y, WOOD)
      }
      break
    case 'guns': {
      const [ax, ay] = AIMS[mark.aim]
      for (const [x, y] of along(mark.line, 4)) {
        picture.set(x, y, SAND)
        picture.set(x + ax, y + ay, WOOD)
      }
      break
    }
    case 'wall':
      trace(mark.line).forEach(([x, y], i) => {
        picture.rect(x, y, 2, 2, SAND)
        // A tower every few steps.
        if (i % 6 === 0) {
          picture.rect(x - 1, y - 1, 3, 3, SAND)
          picture.set(x, y, WOOD)
        }
      })
      break
    case 'river':
      for (const [x, y] of trace(mark.line)) {
        picture.rect(x, y, 2, 2, SEA)
        if ((x + y) % 5 === 0) picture.set(x, y, WAVE)
      }
      break
    case 'rail':
      trace(mark.line).forEach(([x, y], i) => i % 3 !== 2 && picture.set(x, y, SAND, 0.75))
      break
    case 'chain':
      trace(mark.line).forEach(([x, y], i) => picture.set(x, y, i % 2 === 0 ? SAND : WOOD))
      break
    case 'town':
      picture.rect(mark.x - 2, mark.y, 5, 2, SAND)
      for (const dx of [-2, 0, 2]) picture.set(mark.x + dx, mark.y - 1, SAND)
      picture.set(mark.x, mark.y + 1, WOOD)
      break
    case 'mines':
      if (!mark.laid) for (const [x, y] of along(mark.line, 0, mark.count)) picture.set(x, y, SAND)
      break
    case 'label':
      plotWord((x, y, color, alpha) => picture.set(x, y, color, alpha), mark.text, mark.x, mark.y, LABEL, 0.42)
      break
  }
}

/** The bare field: land, water, marsh and high ground, with everything that stands on it. */
function paintGround(battle: Battle) {
  const size = BATTLE_MAP
  const kinds = new Uint8Array(size * size)
  for (const ground of battle.ground ?? []) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (inside(ground.shape, x + 0.5, y + 0.5)) kinds[y * size + x] = KINDS[ground.kind]
      }
    }
  }
  const kindAt = (x: number, y: number) => (x < 0 || y < 0 || x >= size || y >= size ? -1 : kinds[y * size + x])
  /** Whether a pixel of one kind touches a pixel of another. */
  const onEdge = (x: number, y: number, kind: number) =>
    [kindAt(x - 1, y), kindAt(x + 1, y), kindAt(x, y - 1), kindAt(x, y + 1)].some((near) => near !== kind && near !== -1)

  const random = seededRandom(1453)
  const picture = new Pixels(size, size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const roll = random()
      const kind = kindAt(x, y)
      if (kind === WATER) {
        // Short dashes for waves, and a pale line of surf along every shore.
        const wave = y % 3 === 1 && (x + y * 5) % 9 < 2
        picture.set(x, y, onEdge(x, y, WATER) ? SURF : wave ? WAVE : SEA)
      } else if (kind === HEIGHTS) {
        picture.set(x, y, onEdge(x, y, HEIGHTS) || roll < 0.07 ? HILL : HIGH)
      } else {
        picture.set(x, y, roll < 0.05 ? GROUND_DARK : roll > 0.96 ? GROUND_LIGHT : GROUND)
        if (kind === MARSH && bayer(x, y) < 0.3) picture.set(x, y, SEA, 0.8)
      }
    }
  }
  // High ground is covered in small hills, set out like bricks in a wall.
  for (let row = 0, y = 2; y < size - 3; row++, y += 5) {
    for (let x = row % 2 === 0 ? 3 : 6; x < size; x += 7) {
      if ([kindAt(x, y), kindAt(x - 2, y + 2), kindAt(x + 2, y + 2)].every((kind) => kind === HEIGHTS)) hill(picture, x, y)
    }
  }
  for (const mark of battle.marks ?? []) drawMark(picture, mark)
  return picture
}

/** Gets a battle ready to play. */
export function stage(battle: Battle): Scene {
  let end = 0
  const ends = battle.phases.map((says) => (end += Math.max(SHORTEST_MS, Math.min(LONGEST_MS, says.length * READ_MS))))
  return { battle, ground: paintGround(battle), bodies: muster(battle), ends }
}

/** Where every dot of a body stands, and how much of each is left. */
function spots(body: Body, stand: Full): Spot[] {
  const { unit } = body
  const rows = Math.ceil(unit.dots / unit.wide)
  const angle = ((unit.facing ?? 0) * Math.PI) / 180
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const standing = unit.dots * Math.max(0, Math.min(1, stand.left))
  const halfWide = Math.max(1, ((unit.wide - 1) / 2) * SPACING * stand.loose)
  return body.falls.map((fall, i) => {
    const across = ((i % unit.wide) - (unit.wide - 1) / 2) * SPACING * stand.loose + body.nudges[i][0]
    const deep = (Math.floor(i / unit.wide) - (rows - 1) / 2) * SPACING * stand.loose + body.nudges[i][1]
    // A bent line has its two ends ahead of its middle, like the horns of a crescent.
    const ahead = stand.bend * (across / halfWide) ** 2 - deep
    return {
      x: stand.x + across * cos + ahead * sin,
      y: stand.y + across * sin - ahead * cos,
      // The dot's share of what is left: whole, gone, or the one just now fading out.
      strength: Math.max(0, Math.min(1, standing - fall)),
    }
  })
}

/** The pixels of one dot and of the shadow it casts, as offsets from its place. */
const SHAPES = {
  men: { body: [[0, 0], [1, 0], [0, 1], [1, 1]], shadow: [[2, 1], [1, 2], [2, 2]] },
  // A hull four pixels long with a cabin on top.
  ships: { body: [[1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [3, 1]], shadow: [[1, 2], [2, 2], [3, 2]] },
  carts: { body: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]], shadow: [[0, 2], [2, 2]] },
}

function drawDot(picture: Pixels, unit: Unit, spot: Spot, part: 'body' | 'shadow') {
  const x = Math.round(spot.x)
  const y = Math.round(spot.y)
  const kind = unit.kind ?? 'men'
  const color = part === 'shadow' ? SHADOW : kind === 'carts' ? SAND : unit.side === 'turk' ? TURK : FOE
  const alpha = part === 'shadow' ? 0.5 * spot.strength : spot.strength
  for (const [dx, dy] of SHAPES[kind][part]) picture.set(x + dx, y + dy, color, alpha)
}

/** The things on the ground that change as the battle goes: guns firing, mines being laid. */
function drawLive(picture: Pixels, mark: Mark, t: number, now: number) {
  if (mark.kind === 'mines' && mark.laid) {
    const [from, until] = mark.laid
    along(mark.line, 0, mark.count).forEach(([x, y], i) => {
      if (t >= from + ((until - from) * i) / Math.max(1, mark.count - 1)) picture.set(x, y, SAND)
    })
  }
  if (mark.kind !== 'guns' || !mark.fires?.some(([from, until]) => t >= from && t <= until)) return
  const [ax, ay] = AIMS[mark.aim]
  const reach = mark.reach ?? 9
  along(mark.line, 4).forEach(([x, y], i) => {
    // Each gun fires on its own beat: a flash at the muzzle, smoke, and the shot flying off.
    const beat = (Math.floor(now / 110) + i * 7) % 7
    if (beat === 0) {
      picture.set(x + 2 * ax, y + 2 * ay, FLASH)
      picture.set(x + 3 * ax, y + 3 * ay, FLASH, 0.6)
    } else if (beat <= 3) {
      picture.set(x + 2 * ax, y + 2 * ay, SMOKE, 0.75 - beat * 0.18)
      const far = 2 + (beat * reach) / 3
      picture.set(x + far * ax, y + far * ay, FLASH, 0.9 - beat * 0.15)
    }
  })
}

/** Paints one moment of a battle. `t` counts captions; `now` keeps the guns and arrows moving. */
export function paint(picture: Pixels, scene: Scene, t: number, now: number) {
  const { battle, bodies } = scene
  picture.copyFrom(scene.ground)
  for (const mark of battle.marks ?? []) drawLive(picture, mark, t, now)

  const placed = bodies.map((body) => spots(body, standAt(body.path, body.pace, t)))
  // Every shadow goes down before any dot, so that no dot is dimmed by its neighbour's shadow.
  for (const part of ['shadow', 'body'] as const) {
    bodies.forEach((body, i) => {
      for (const spot of placed[i]) if (spot.strength > 0) drawDot(picture, body.unit, spot, part)
    })
  }

  // Arrows and shots fly from one body to another, or to a place on the map.
  bodies.forEach((body, i) => {
    for (const volley of body.unit.shoots ?? []) {
      if (t < volley.from || t > volley.until) continue
      const target = typeof volley.at === 'number' ? placed[volley.at].filter((spot) => spot.strength > 0) : null
      if (target && target.length === 0) continue
      const flights = Math.max(2, Math.ceil(body.unit.dots / 4))
      for (let k = 0; k < flights; k++) {
        const turn = now / FLIGHT_MS + k / flights
        const round = Math.floor(turn)
        const from = placed[i][(k * 7 + round * 3) % placed[i].length]
        if (from.strength === 0) continue
        const to = target
          ? target[(k * 5 + round * 11) % target.length]
          : { x: (volley.at as Point)[0] + ((round * 7 + k * 3) % 5) - 2, y: (volley.at as Point)[1] + ((round * 5 + k) % 5) - 2 }
        const color = body.unit.side === 'turk' ? TURK : FOE
        for (const [back, alpha] of [[0, 0.95], [0.08, 0.45]]) {
          const flown = Math.max(0, turn - round - back)
          picture.set(from.x + (to.x - from.x) * flown, from.y + (to.y - from.y) * flown, color, alpha)
        }
      }
    }
  })

  for (const blast of battle.blasts ?? []) {
    const age = (t - blast.at) / BLAST
    if (age < 0 || age >= 1) continue
    const { x, y } = blast
    if (age < 0.35) {
      for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) picture.set(x + dx, y + dy, FLASH)
    } else if (age < 0.7) {
      for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, -2], [1, 1], [-1, 1], [1, -1], [-1, -1]]) picture.set(x + dx, y + dy, FLASH, 0.85)
      picture.set(x, y, SMOKE, 0.8)
    } else {
      for (const [dx, dy] of [[0, -1], [1, -2], [-1, 0], [2, 0]]) picture.set(x + dx, y + dy, SMOKE, 0.5)
    }
  }
}

export function startBattleView(
  map: HTMLCanvasElement,
  { animate, onStatus }: { animate: boolean; onStatus: (status: BattleStatus) => void },
): BattleControls {
  const picture = new Pixels(BATTLE_MAP, BATTLE_MAP)
  let battle = 0
  let scene = stage(BATTLES[0])
  /** Milliseconds played of the battle on the map. */
  let played = 0
  let phase = -1
  let paused = false
  let lastTime: number | null = null

  /** When a caption starts, in milliseconds. */
  const startOf = (caption: number) => (caption <= 0 ? 0 : scene.ends[caption - 1])

  const draw = (now: number) => {
    const { ends } = scene
    const reached = Math.max(0, ends.findIndex((end) => played < end))
    const last = ends.length - 1
    // Past the last caption the map rests on the battle's final moment.
    const t = played >= ends[last] ? ends.length : reached + (played - startOf(reached)) / (ends[reached] - startOf(reached))
    paint(picture, scene, t, now)
    picture.show(map)
    const caption = played >= ends[last] ? last : reached
    if (caption !== phase) {
      phase = caption
      onStatus({ battle, phase })
    }
  }

  /** Without motion the map shows how each caption ends, instead of playing it. */
  const still = (reached: number) => {
    played = scene.ends[reached] - 1
    draw(0)
  }

  const show = (to: number) => {
    battle = ((to % BATTLES.length) + BATTLES.length) % BATTLES.length
    scene = stage(BATTLES[battle])
    played = 0
    phase = -1
  }

  if (!animate) {
    still(0)
    return {
      setPaused: () => {},
      show: (to) => {
        show(to)
        still(0)
      },
      toPhase: still,
      stop: () => {},
    }
  }

  const tick = (now: number) => {
    const elapsed = lastTime === null ? 0 : Math.min(now - lastTime, 100)
    lastTime = now
    if (!paused) played += elapsed
    if (played > scene.ends[scene.ends.length - 1] + REST_MS) show(battle + 1)
    draw(now)
  }

  draw(0)
  const stopLoop = whileVisible(map, FPS, tick)
  return {
    setPaused: (value) => {
      paused = value
    },
    show: (to) => {
      show(to)
      draw(0)
    },
    toPhase: (to) => {
      played = startOf(to)
      draw(0)
    },
    stop: stopLoop,
  }
}
