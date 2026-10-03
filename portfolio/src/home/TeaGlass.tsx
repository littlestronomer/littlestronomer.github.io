import { useEffect, useRef, useState } from 'react'
import { Pixels, mix, prefersReducedMotion, rgb } from './pixels'

// A tulip-shaped glass of tea that can be filled again and again, the way it goes at any
// Turkish table. Once poured it is drunk, sip by sip, and when the glass is empty it is wished
// well: "Yarasın!", may it do you good. It counts the glasses and has something to say about
// the total.

const WIDTH = 24
const HEIGHT = 26
/** How wide the glass is at each row from the rim down, as pixels either side of the middle. */
const SHAPE = [6, 6, 6, 5, 5, 4, 4, 4, 4, 5, 6, 6, 6, 6, 6, 5, 4, 4]
const RIM = 3
/** The foot of the glass is solid: the tea stands on these last rows. */
const FOOT = 2
/** Tea is never poured to the brim. The gap has a name: the lip's share (dudak payı). */
const LIPS_SHARE = 2

/** Pouring a glass takes this long. */
const FILL_MS = 620
/** A glass is drunk in this many sips, each after a pause. */
const SIPS = 5
const PAUSE_MS = 900
const SIP_MS = 450
/** Finishing a full glass in one go, to make room for the next, takes this long. */
const GULP_MS = 320

const GLASS = rgb('#ffffff')
const TEA_TOP = rgb('#f08a24')
const TEA_DEEP = rgb('#a02c0c')
const SAUCER = rgb('#ffffff')
const SAUCER_RED = rgb('#e30a17')
const SAUCER_UNDER = rgb('#e6cfd1')

/** What the tea house thinks of you, by how many glasses you have had. */
const REMARKS: [number, string][] = [
  [0, 'An empty glass. Nobody here will allow that for long.'],
  [1, 'Afiyet olsun: may it do you good.'],
  [2, 'One glass is never one glass.'],
  [3, 'Now it is a conversation.'],
  [5, 'A normal afternoon.'],
  [8, 'The tea house knows your name by now.'],
  [12, 'This is the color they call rabbit’s blood (tavşan kanı), and so are you.'],
  [20, 'Somewhere above Rize, a tea grower nods with respect.'],
]

function paint(canvas: HTMLCanvasElement, level: number) {
  const picture = new Pixels(WIDTH, HEIGHT)
  const middle = WIDTH / 2
  const floor = RIM + SHAPE.length - FOOT
  const surface = floor - level * (floor - RIM - LIPS_SHARE)

  SHAPE.forEach((half, i) => {
    const y = RIM + i
    const left = middle - half
    const right = middle + half - 1
    for (let x = left; x <= right; x++) {
      const wall = x === left || x === right
      if (wall) picture.set(x, y, GLASS, 0.95)
      else if (y >= floor) picture.set(x, y, GLASS, 0.6)
      else if (level > 0 && y >= surface) {
        // Deeper tea is darker, with a streak of light down the left side of the glass.
        const depth = (y - surface) / Math.max(1, floor - RIM)
        picture.set(x, y, mix(TEA_TOP, TEA_DEEP, Math.min(1, depth * 1.4)), x === left + 1 ? 0.8 : 1)
      } else picture.set(x, y, GLASS, 0.1)
    }
  })

  // The saucer, with the red marks around its edge, and two sugar cubes on it.
  const plate = RIM + SHAPE.length
  for (let x = middle - 10; x < middle + 10; x++) picture.set(x, plate, x % 3 === 0 ? SAUCER_RED : SAUCER)
  for (let x = middle - 7; x < middle + 7; x++) picture.set(x, plate + 1, SAUCER_UNDER)
  picture.rect(middle - 9, plate - 2, 2, 2, SAUCER)
  picture.rect(middle + 7, plate - 2, 2, 2, SAUCER)

  // A full glass steams.
  if (level > 0.95) {
    picture.set(middle - 2, 1, GLASS, 0.5)
    picture.set(middle - 1, 0, GLASS, 0.3)
    picture.set(middle + 2, 1, GLASS, 0.4)
  }
  picture.show(canvas)
}

/**
 * How full the glass is, `elapsed` milliseconds after a glass was poured into one that stood at
 * `from`: what was left is finished, the glass is filled, and then it is drunk in sips. Without
 * motion each of these happens in one step instead of gradually.
 */
function levelAt(elapsed: number, from: number, still: boolean) {
  const gulp = still ? 0 : from * GULP_MS
  if (elapsed < gulp) return from * (1 - elapsed / gulp)
  const filling = elapsed - gulp
  if (filling < FILL_MS) return still ? 1 : filling / FILL_MS
  const drinking = filling - FILL_MS
  const sip = Math.floor(drinking / (PAUSE_MS + SIP_MS))
  if (sip >= SIPS) return 0
  const swallow = Math.max(0, (drinking - sip * (PAUSE_MS + SIP_MS) - PAUSE_MS) / SIP_MS)
  return 1 - (sip + (still ? 0 : swallow * swallow * (3 - 2 * swallow))) / SIPS
}

export default function TeaGlass() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const frame = useRef(0)
  const level = useRef(0)
  const [glasses, setGlasses] = useState(0)
  /** How many glasses have been finished. Each one sets off a new "Yarasın!". */
  const [finished, setFinished] = useState(0)

  useEffect(() => {
    if (canvas.current) paint(canvas.current, 0)
    return () => cancelAnimationFrame(frame.current)
  }, [])

  const pour = () => {
    setGlasses(glasses + 1)
    const target = canvas.current
    if (!target) return
    cancelAnimationFrame(frame.current)
    const still = prefersReducedMotion()
    const start = performance.now()
    const from = level.current
    // Whatever is left in the glass is finished first; then the new glass is drunk to the end.
    const gulped = still ? 0 : from * GULP_MS
    const dry = gulped + FILL_MS + SIPS * (PAUSE_MS + SIP_MS)
    let leftovers = from > 0
    const step = (now: number) => {
      const elapsed = now - start
      level.current = levelAt(elapsed, from, still)
      paint(target, level.current)
      if (leftovers && elapsed >= gulped) {
        leftovers = false
        setFinished((count) => count + 1)
      }
      if (elapsed >= dry) setFinished((count) => count + 1)
      else frame.current = requestAnimationFrame(step)
    }
    frame.current = requestAnimationFrame(step)
  }

  const remark = [...REMARKS].reverse().find(([from]) => glasses >= from)

  return (
    <section className="box tea-box" id="turk-glass" aria-labelledby="tea-glass-title">
      <h2 id="tea-glass-title">Bir çay?</h2>
      <div className="tea-stage">
        <canvas ref={canvas} className="tea-glass" width={WIDTH} height={HEIGHT} aria-hidden="true" />
        {finished > 0 && (
          <span key={finished} className="tea-cheer" aria-hidden="true">
            Yarasın!
          </span>
        )}
      </div>
      <p className="tea-count" aria-live="polite">
        Glasses so far: <strong>{glasses}</strong>
      </p>
      <p>{remark?.[1]}</p>
      <button type="button" className="pixel-action" onClick={pour}>
        {glasses === 0 ? 'Pour a glass' : 'Bir çay daha (one more)'}
      </button>
    </section>
  )
}
