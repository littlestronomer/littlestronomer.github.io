import { Pixels, mix, rgb, whileVisible, type Rgb } from './pixels'
import { PUZZLES, TinyNet, seededRandom, type Dot } from './tinyNet'

// Trains the tiny network and draws it: a map of its guesses with the dots on top, and a
// diagram where every neuron is a small square showing what it responds to. It trains without
// stopping: when it has learned one puzzle, it moves on to the next.

const SIZES = [2, 6, 6, 1]
/** The map is this many pixels across; CSS scales it up four times. */
export const MAP_SIZE = 72
export const GRAPH_WIDTH = 144
export const GRAPH_HEIGHT = 92
const NODE = 12
const STEPS_PER_SECOND = 30
const LEARNED_LOSS = 0.04
const GIVE_UP_STEPS = 2500
const SHOW_LEARNED_MS = 3500
const FPS = 30

const GROUND = rgb('#141236')
const BLUE = rgb('#4aa8ff')
const ORANGE = rgb('#ff944d')
const BLUE_DOT = rgb('#d4edff')
const ORANGE_DOT = rgb('#ffe0c2')
const DOT_EDGE = rgb('#05040f')
const FRAME = rgb('#5b55c7')
/** How strongly the map is tinted, by how sure the network is (five steps, for a banded look). */
const SURENESS = [0.05, 0.15, 0.25, 0.36, 0.5]

export type NetStatus = {
  puzzle: string
  steps: number
  loss: number | null
  accuracy: number | null
  learned: boolean
}

export type NetControls = {
  setPaused: (paused: boolean) => void
  nextPuzzle: () => void
  stop: () => void
}

// Neuron squares sit in four columns: the two inputs, two hidden layers and the output.
const columnLeft = (layer: number) => Math.round(2 + ((GRAPH_WIDTH - 4 - NODE) * layer) / (SIZES.length - 1))

/** Where each column of neurons is centred in the diagram, as a fraction of its width. */
export function graphColumns() {
  return SIZES.map((_, layer) => (columnLeft(layer) + NODE / 2) / GRAPH_WIDTH)
}

/** A value between -1 (orange) and 1 (blue) as a tinted map color. */
function tint(value: number): Rgb {
  const sureness = SURENESS[Math.min(SURENESS.length - 1, Math.floor(Math.abs(value) * SURENESS.length))]
  return mix(GROUND, value > 0 ? BLUE : ORANGE, sureness)
}

export function startNetView(
  map: HTMLCanvasElement,
  graph: HTMLCanvasElement,
  { animate, onStatus }: { animate: boolean; onStatus: (status: NetStatus) => void },
): NetControls {
  const random = seededRandom(20261003)
  const net = new TinyNet(SIZES, random)
  let puzzle = 0
  let dots: Dot[] = PUZZLES[0].make(random)
  let latest = { loss: null as number | null, accuracy: null as number | null }
  let learnedAt: number | null = null
  let paused = false
  let owed = 0
  let lastTime: number | null = null

  const mapPixels = new Pixels(MAP_SIZE, MAP_SIZE)
  const graphPixels = new Pixels(GRAPH_WIDTH, GRAPH_HEIGHT)

  const report = () =>
    onStatus({
      puzzle: PUZZLES[puzzle].name,
      steps: net.steps,
      loss: latest.loss,
      accuracy: latest.accuracy,
      learned: learnedAt !== null,
    })

  const drawMap = () => {
    for (let row = 0; row < MAP_SIZE; row++) {
      const y = 1 - ((row + 0.5) / MAP_SIZE) * 2
      for (let column = 0; column < MAP_SIZE; column++) {
        const x = ((column + 0.5) / MAP_SIZE) * 2 - 1
        mapPixels.set(column, row, tint(net.predict(x, y) * 2 - 1))
      }
    }
    // Each dot is a 2×2 block with a dark shadow, so it stands out from the tint beneath it.
    for (const dot of dots) {
      const column = Math.floor(((dot.x + 1) / 2) * MAP_SIZE - 0.5)
      const row = Math.floor(((1 - dot.y) / 2) * MAP_SIZE - 0.5)
      mapPixels.rect(column + 1, row + 1, 2, 2, DOT_EDGE)
      mapPixels.rect(column, row, 2, 2, dot.blue ? BLUE_DOT : ORANGE_DOT)
      mapPixels.set(column + 1, row + 1, dot.blue ? BLUE : ORANGE)
    }
    mapPixels.show(map)
  }

  const nodeTop = (layer: number, index: number) => {
    const gap = 4
    const total = SIZES[layer] * NODE + (SIZES[layer] - 1) * gap
    return Math.round((GRAPH_HEIGHT - total) / 2 + index * (NODE + gap))
  }

  const drawGraph = () => {
    graphPixels.image.data.fill(0)
    // Weights as lines: blue ones add, orange ones subtract, brighter ones count for more.
    for (let layer = 0; layer < SIZES.length - 1; layer++) {
      const weights = net.weights[layer]
      for (let to = 0; to < SIZES[layer + 1]; to++) {
        for (let from = 0; from < SIZES[layer]; from++) {
          const weight = weights[to * SIZES[layer] + from]
          const strength = Math.abs(weight)
          const color = mix(GROUND, weight > 0 ? BLUE : ORANGE, strength < 0.4 ? 0.22 : strength < 1.2 ? 0.5 : 0.95)
          graphPixels.line(
            columnLeft(layer) + NODE,
            nodeTop(layer, from) + NODE / 2,
            columnLeft(layer + 1) - 1,
            nodeTop(layer + 1, to) + NODE / 2,
            color,
          )
        }
      }
    }
    // Each neuron's square shows its output across the whole map, in the map's colors.
    const inner = NODE - 2
    for (let row = 0; row < inner; row++) {
      const y = 1 - ((row + 0.5) / inner) * 2
      for (let column = 0; column < inner; column++) {
        const x = ((column + 0.5) / inner) * 2 - 1
        const values = net.layers(x, y)
        for (let layer = 0; layer < SIZES.length; layer++) {
          for (let index = 0; index < SIZES[layer]; index++) {
            let value = values[layer][index]
            if (layer === SIZES.length - 1) value = value * 2 - 1
            graphPixels.set(columnLeft(layer) + 1 + column, nodeTop(layer, index) + 1 + row, tint(value))
          }
        }
      }
    }
    for (let layer = 0; layer < SIZES.length; layer++) {
      for (let index = 0; index < SIZES[layer]; index++) {
        const left = columnLeft(layer)
        const top = nodeTop(layer, index)
        for (let k = 0; k < NODE; k++) {
          graphPixels.set(left + k, top, FRAME)
          graphPixels.set(left + k, top + NODE - 1, FRAME)
          graphPixels.set(left, top + k, FRAME)
          graphPixels.set(left + NODE - 1, top + k, FRAME)
        }
      }
    }
    graphPixels.show(graph)
  }

  const draw = () => {
    drawMap()
    drawGraph()
  }

  const startPuzzle = (index: number) => {
    puzzle = index % PUZZLES.length
    dots = PUZZLES[puzzle].make(random)
    net.reset(random)
    latest = { loss: null, accuracy: null }
    learnedAt = null
    owed = 0
  }

  const trainStep = () => {
    const result = net.train(dots)
    latest = result
    return result.loss < LEARNED_LOSS || net.steps >= GIVE_UP_STEPS
  }

  if (!animate) {
    // With reduced motion the network trains out of sight, a slice at a time so the page
    // stays responsive, and only the finished result is drawn.
    let job = 0
    const learnQuietly = () => {
      clearTimeout(job)
      const slice = () => {
        for (let i = 0; i < 150; i++) {
          if (trainStep()) {
            learnedAt = 0
            draw()
            report()
            return
          }
        }
        job = window.setTimeout(slice, 0)
      }
      slice()
    }
    draw()
    report()
    learnQuietly()
    return {
      setPaused: () => {},
      nextPuzzle: () => {
        startPuzzle(puzzle + 1)
        report()
        learnQuietly()
      },
      stop: () => clearTimeout(job),
    }
  }

  let lastReport = 0
  const tick = (now: number) => {
    const elapsed = lastTime === null ? 0 : Math.min(now - lastTime, 100)
    lastTime = now
    if (paused) return

    if (learnedAt !== null) {
      if (now - learnedAt > SHOW_LEARNED_MS) {
        startPuzzle(puzzle + 1)
        draw()
        report()
      }
      return
    }

    owed += (elapsed / 1000) * STEPS_PER_SECOND
    let changed = false
    while (owed >= 1) {
      owed--
      changed = true
      if (trainStep()) {
        learnedAt = now
        owed = 0
        break
      }
    }
    if (!changed) return
    draw()
    if (learnedAt !== null || now - lastReport > 120) {
      lastReport = now
      report()
    }
  }

  draw()
  report()
  const stopLoop = whileVisible(map, FPS, tick)
  return {
    setPaused: (value) => {
      paused = value
      lastTime = null
    },
    nextPuzzle: () => {
      startPuzzle(puzzle + 1)
      draw()
      report()
    },
    stop: stopLoop,
  }
}
