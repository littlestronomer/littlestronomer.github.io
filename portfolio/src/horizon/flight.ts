import { PAINTING_PIXELS } from './painting'

// The paper plane's flight across the painting, worked out from the time alone so it needs
// no state. Distances are in the painting's own pixels (y down); the plane starts where the
// painter put it.
const START = { x: 140, y: 252 }
// The clouds drift about 2.8 pixels a second; the plane flies about seven times faster.
const SPEED = 20
// The flight is split into stretches. Halfway through the first one, and through about half
// of the later ones, the plane flies a loop.
const STRETCH_SECONDS = 20
const LOOP_SECONDS = 3.8
const LOOP_RADIUS = 28
// It swoops up and down as it goes: a long, deep swell with a quicker bob on top.
const SWOOP = { height: 26, speed: 0.42 }
const BOB = { height: 8, speed: 1.1 }
// It flies off the right edge and comes back in on the left.
const MARGIN = 60

/** The plane's width, as a fraction of the painting's height. */
export const PLANE_WIDTH = 30 / PAINTING_PIXELS.height

export type PlanePose = {
  /** Position in texture space: 0 to 1 across, 0 at the bottom edge. */
  u: number
  v: number
  /** Direction of flight in radians, anticlockwise; 0 is flying right. */
  heading: number
}

function loopsIn(stretch: number) {
  if (stretch === 0) return true
  const random = Math.sin(stretch * 127.1) * 43758.5453
  return random - Math.floor(random) < 0.55
}

function position(t: number) {
  let x = START.x + SPEED * t
  let y = START.y + SWOOP.height * Math.sin(t * SWOOP.speed) + BOB.height * Math.sin(t * BOB.speed + 1)
  const stretch = Math.floor(t / STRETCH_SECONDS)
  const intoLoop = (t - stretch * STRETCH_SECONDS - (STRETCH_SECONDS - LOOP_SECONDS) / 2) / LOOP_SECONDS
  if (intoLoop > 0 && intoLoop < 1 && loopsIn(stretch)) {
    // Ease in and out of the loop, climbing first, over the top, then down and level again.
    const turn = Math.PI * (1 - Math.cos(Math.PI * intoLoop))
    x += LOOP_RADIUS * Math.sin(turn)
    y -= LOOP_RADIUS * (1 - Math.cos(turn))
  }
  return { x, y }
}

export function planeAt(t: number): PlanePose {
  const here = position(t)
  const ahead = position(t + 0.05)
  const span = PAINTING_PIXELS.width + 2 * MARGIN
  const x = ((((here.x + MARGIN) % span) + span) % span) - MARGIN
  return {
    u: x / PAINTING_PIXELS.width,
    v: 1 - here.y / PAINTING_PIXELS.height,
    heading: Math.atan2(here.y - ahead.y, ahead.x - here.x),
  }
}
