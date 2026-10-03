// A small neural network that learns to tell two kinds of dots apart, trained in the visitor's
// browser. It takes a dot's position (x, y), passes it through two hidden layers of tanh
// neurons, and outputs the chance that the dot is blue. Plain arrays, no libraries.

export type Dot = { x: number; y: number; blue: boolean }

export type Puzzle = { id: string; name: string; make: (random: () => number) => Dot[] }

/** Repeatable random numbers, so every visit starts from the same puzzles. */
export function seededRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const DOTS_PER_COLOR = 80

function gaussian(random: () => number) {
  return Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random())
}

// The puzzles, from easy to hard. Dots live in the square from -1 to 1 on both axes.
export const PUZZLES: Puzzle[] = [
  {
    id: 'ring',
    name: 'a disc inside a ring',
    make(random) {
      const dots: Dot[] = []
      for (let i = 0; i < DOTS_PER_COLOR * 2; i++) {
        const blue = i < DOTS_PER_COLOR
        const radius = blue ? 0.42 * Math.sqrt(random()) : 0.62 + 0.3 * random()
        const angle = 2 * Math.PI * random()
        dots.push({ x: radius * Math.cos(angle), y: radius * Math.sin(angle), blue })
      }
      return dots
    },
  },
  {
    id: 'xor',
    name: 'four corners',
    make(random) {
      const dots: Dot[] = []
      while (dots.length < DOTS_PER_COLOR * 2) {
        const x = random() * 1.9 - 0.95
        const y = random() * 1.9 - 0.95
        if (Math.abs(x) < 0.1 || Math.abs(y) < 0.1) continue
        dots.push({ x, y, blue: x * y > 0 })
      }
      return dots
    },
  },
  {
    id: 'moons',
    name: 'two moons',
    make(random) {
      const dots: Dot[] = []
      for (let i = 0; i < DOTS_PER_COLOR * 2; i++) {
        const blue = i < DOTS_PER_COLOR
        const t = Math.PI * random()
        const x = blue ? Math.cos(t) : 1 - Math.cos(t)
        const y = blue ? Math.sin(t) : 0.5 - Math.sin(t)
        dots.push({
          x: (x - 0.5) * 0.85 + 0.07 * gaussian(random),
          y: (y - 0.25) * 0.85 + 0.07 * gaussian(random),
          blue,
        })
      }
      return dots
    },
  },
  {
    id: 'spiral',
    name: 'a spiral',
    make(random) {
      const dots: Dot[] = []
      for (let i = 0; i < DOTS_PER_COLOR * 2; i++) {
        const blue = i < DOTS_PER_COLOR
        const t = 0.12 + 0.88 * ((i % DOTS_PER_COLOR) / DOTS_PER_COLOR)
        const angle = 2.6 * Math.PI * t + (blue ? 0 : Math.PI)
        dots.push({
          x: 0.92 * t * Math.cos(angle) + 0.025 * gaussian(random),
          y: 0.92 * t * Math.sin(angle) + 0.025 * gaussian(random),
          blue,
        })
      }
      return dots
    },
  },
]

const LEARNING_RATE = 0.03
const BETA1 = 0.9
const BETA2 = 0.999

/** A fully connected network: tanh hidden layers and a sigmoid output, trained with Adam. */
export class TinyNet {
  readonly sizes: readonly number[]
  /** weights[l][o * inputs + i] connects input i of layer l to its output o. */
  readonly weights: Float64Array[]
  readonly biases: Float64Array[]
  steps = 0

  private readonly moments: { weights: Float64Array[]; biases: Float64Array[] }[]
  private readonly gradients: { weights: Float64Array[]; biases: Float64Array[] }
  /** Each layer's outputs for the dot being worked on; layer 0 is the dot itself. */
  private readonly values: Float64Array[]
  private readonly errors: Float64Array[]

  constructor(sizes: readonly number[], random: () => number) {
    this.sizes = sizes
    const layers = sizes.slice(1).map((outputs, l) => ({ inputs: sizes[l], outputs }))
    const zeros = () => ({
      weights: layers.map((layer) => new Float64Array(layer.inputs * layer.outputs)),
      biases: layers.map((layer) => new Float64Array(layer.outputs)),
    })
    this.weights = zeros().weights
    this.biases = zeros().biases
    this.moments = [zeros(), zeros()]
    this.gradients = zeros()
    this.values = sizes.map((size) => new Float64Array(size))
    this.errors = sizes.map((size) => new Float64Array(size))
    this.reset(random)
  }

  /** Starts over from small random weights (Glorot uniform). */
  reset(random: () => number) {
    this.weights.forEach((layer, l) => {
      const limit = Math.sqrt(6 / (this.sizes[l] + this.sizes[l + 1]))
      for (let k = 0; k < layer.length; k++) layer[k] = (random() * 2 - 1) * limit
    })
    for (const layer of this.biases) layer.fill(0)
    for (const moment of this.moments) {
      for (const layer of [...moment.weights, ...moment.biases]) layer.fill(0)
    }
    this.steps = 0
  }

  /** Runs one dot through the network and returns the chance that it is blue. */
  predict(x: number, y: number) {
    const values = this.values
    values[0][0] = x
    values[0][1] = y
    const last = this.weights.length - 1
    for (let l = 0; l <= last; l++) {
      const inputs = values[l]
      const outputs = values[l + 1]
      const weights = this.weights[l]
      const biases = this.biases[l]
      for (let o = 0; o < outputs.length; o++) {
        let sum = biases[o]
        for (let i = 0; i < inputs.length; i++) sum += weights[o * inputs.length + i] * inputs[i]
        outputs[o] = l === last ? 1 / (1 + Math.exp(-sum)) : Math.tanh(sum)
      }
    }
    return values[last + 1][0]
  }

  /** Every neuron's output for a dot at (x, y), layer by layer; layer 0 is the dot itself. */
  layers(x: number, y: number): readonly Float64Array[] {
    this.predict(x, y)
    return this.values
  }

  /** One step of full-batch Adam on the dots. Returns the loss and accuracy before the step. */
  train(dots: readonly Dot[]) {
    const { weights: weightGrads, biases: biasGrads } = this.gradients
    for (const layer of [...weightGrads, ...biasGrads]) layer.fill(0)

    let loss = 0
    let correct = 0
    const last = this.weights.length - 1
    for (const dot of dots) {
      const chance = this.predict(dot.x, dot.y)
      const target = dot.blue ? 1 : 0
      loss -= Math.log(Math.max(1e-12, dot.blue ? chance : 1 - chance))
      if (chance > 0.5 === dot.blue) correct++

      // Backpropagation: how much each neuron's input sum should change to lower the loss.
      this.errors[last + 1][0] = chance - target
      for (let l = last; l >= 0; l--) {
        const inputs = this.values[l]
        const errors = this.errors[l + 1]
        const weights = this.weights[l]
        const weightGrad = weightGrads[l]
        const biasGrad = biasGrads[l]
        for (let o = 0; o < errors.length; o++) {
          biasGrad[o] += errors[o]
          for (let i = 0; i < inputs.length; i++) weightGrad[o * inputs.length + i] += errors[o] * inputs[i]
        }
        if (l === 0) break
        const below = this.errors[l]
        for (let i = 0; i < inputs.length; i++) {
          let sum = 0
          for (let o = 0; o < errors.length; o++) sum += weights[o * inputs.length + i] * errors[o]
          below[i] = sum * (1 - inputs[i] * inputs[i])
        }
      }
    }

    this.steps++
    const [first, second] = this.moments
    const fix1 = 1 - BETA1 ** this.steps
    const fix2 = 1 - BETA2 ** this.steps
    const update = (params: Float64Array[], grads: Float64Array[], m: Float64Array[], v: Float64Array[]) => {
      params.forEach((layer, l) => {
        for (let k = 0; k < layer.length; k++) {
          const grad = grads[l][k] / dots.length
          m[l][k] = BETA1 * m[l][k] + (1 - BETA1) * grad
          v[l][k] = BETA2 * v[l][k] + (1 - BETA2) * grad * grad
          layer[k] -= (LEARNING_RATE * (m[l][k] / fix1)) / (Math.sqrt(v[l][k] / fix2) + 1e-8)
        }
      })
    }
    update(this.weights, weightGrads, first.weights, second.weights)
    update(this.biases, biasGrads, first.biases, second.biases)

    return { loss: loss / dots.length, accuracy: correct / dots.length }
  }
}
