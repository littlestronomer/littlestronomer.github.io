import { useEffect, useRef } from 'react'
import arrowPicture from './assets/cursor-arrow.svg'
import handPicture from './assets/cursor-hand.svg'
import textPicture from './assets/cursor-text.svg'
import { linePoints, prefersReducedMotion } from './pixels'

// A street cat asleep on top of a box. Poke it and it wakes, gets up and sits, and bats the
// cursor away with a front paw. Poked again while it sits, it bats again at once. Left alone
// for a while, it lies down and goes back to sleep.
//
// A page cannot move the real cursor. But the cursors on this page are pictures of its own
// (see home.css), so it can draw them too. For a swat the real cursor is hidden and a picture
// of the same cursor stands exactly where it was; the paw knocks that picture away, it drifts
// back to where the mouse really is, and the real cursor takes over again.

/** The cat's pictures are this many pixels square. On the page each pixel is three screen pixels. */
const SIZE = 24
/** Where each picture is in sleeping-cat.png (see scripts/make_pixel_assets.py). The first two are the cat asleep. */
const PICTURE = { awake: 2, rising: 3, sitting: 4, leftPawUp: 5, rightPawUp: 6 }
const PICTURES = 7

// The sitting cat, in its picture's pixels.
/** The middle of its chest. A blow goes outward from here. */
const CHEST = { x: 12, y: 15 }
/** Its two front legs: where each joins the body, where its paw stands, and which way is outward. */
const LEGS = [
  { shoulder: { x: 8.5, y: 13.5 }, ground: { x: 8, y: 22 }, outward: -1, picture: PICTURE.leftPawUp },
  { shoulder: { x: 15.5, y: 13.5 }, ground: { x: 16, y: 22 }, outward: 1, picture: PICTURE.rightPawUp },
]
/** The two halves of a front leg, from the shoulder to the elbow and from the elbow to the paw. */
const BONE = 4.7
/** The farthest a paw can strike from its shoulder. A cursor beyond that is swung at and missed. */
const REACH = 13
/** How far the paw is drawn back before the blow, and how far it carries on after it lands. */
const DRAWN_BACK = 5
const FOLLOW_THROUGH = 2.5
/** With no cursor to hit, as when a key wakes it, the cat bats at the air beside its head. */
const THE_AIR = { x: 19, y: 9 }
/** Room around the cat for a paw that reaches past its picture, in the cat's pixels. */
const ROOM = 8
/** How far the cursor is knocked, in screen pixels. */
const KNOCK = 26
/**
 * The page's cursors: each one's picture, its size on screen, and the point of it that does the
 * pointing. They are the ones home.css sets, named here by the system cursor each stands in for.
 */
const CURSORS = {
  pointer: { src: handPicture, width: 20, height: 24, tip: { x: 7, y: 1 } },
  text: { src: textPicture, width: 14, height: 26, tip: { x: 7, y: 13 } },
  auto: { src: arrowPicture, width: 16, height: 26, tip: { x: 0, y: 0 } },
}
const FUR = { coat: '#f29a3f', stripe: '#c46c22', sock: '#fff1da', bean: '#f27f8f' }
const SPARK = ['#ffe7a3', '#ffffff']

// How long each part takes, in milliseconds.
const MS = {
  /** Getting up: eyes open, half up, then a look at the cursor before the first blow. */
  wake: 170,
  rise: 140,
  look: 120,
  /** One swat: the paw comes off the ground and is drawn back, strikes, carries on, and goes back down. */
  lift: 100,
  strike: 55,
  through: 50,
  back: 200,
  /** The cursor flies off, rests where it landed, and drifts back to the mouse. */
  fly: 100,
  rest: 70,
  drift: 240,
  /** The spark where the paw landed. */
  spark: 100,
  /** Once the real cursor is shown again, its picture stays this much longer, so that there is never no cursor. */
  overlap: 160,
  /** Left alone this long, the cat lies down: half down, eyes still open, then asleep. */
  patience: 4500,
  settle: 180,
  drowse: 600,
}

type Point = { x: number; y: number }

/** A poke: where it was, in the window, or nowhere for a key press; and whether a cursor came with it. */
type Poke = { at: Point | null; cursor: boolean }

const easeOut = (t: number) => 1 - (1 - t) ** 3
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)
const between = (a: Point, b: Point, t: number): Point => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })

/** The cursor that shows at a place in the window, going by what the page's styles say for the element there. */
function cursorAt(at: Point) {
  const under = document.elementFromPoint(at.x, at.y)
  const named = under ? getComputedStyle(under).cursor : ''
  return named.endsWith('pointer') ? CURSORS.pointer : named.endsWith('text') ? CURSORS.text : CURSORS.auto
}

/** Where the elbow is, for a leg from a shoulder to a paw: it bends outward, away from the cat's middle. */
function elbowOf(shoulder: Point, paw: Point, outward: number): Point {
  const dx = paw.x - shoulder.x
  const dy = paw.y - shoulder.y
  const far = Math.hypot(dx, dy) || 0.001
  // A leg stretched as far as it goes is straight.
  if (far >= BONE * 2) return between(shoulder, paw, 0.5)
  const bend = Math.sqrt(BONE * BONE - (far / 2) ** 2)
  // Of the two ways across the leg, the one that points outward. A leg that lies level bends downward.
  const across = { x: -dy / far, y: dx / far }
  const side = across.x * outward > 0.01 || (Math.abs(across.x) <= 0.01 && across.y > 0) ? 1 : -1
  return { x: shoulder.x + dx / 2 + across.x * bend * side, y: shoulder.y + dy / 2 + across.y * bend * side }
}

/** Draws a front leg from its shoulder to its paw, and the spark of a hit. */
function drawLeg(pen: CanvasRenderingContext2D, shoulder: Point, paw: Point, outward: number, spark: Point | null) {
  const dot = (x: number, y: number, width: number, height: number, color: string) => {
    pen.fillStyle = color
    pen.fillRect(x + ROOM, y + ROOM, width, height)
  }
  const elbow = elbowOf(shoulder, paw, outward)
  const leg = [...linePoints(shoulder.x, shoulder.y, elbow.x, elbow.y), ...linePoints(elbow.x, elbow.y, paw.x, paw.y)]
  // The leg is three pixels thick, with the darker fur of the stripes along its outer and lower edge.
  for (const [x, y] of leg) dot(x - 1 + outward, y, 3, 2, FUR.stripe)
  for (const [x, y] of leg) dot(x - 1, y - 1, 3, 2, FUR.coat)
  // The paw: a cream sock, darker underneath, showing a pink toe bean.
  const [x, y] = leg[leg.length - 1]
  dot(x - 1, y, 3, 2, FUR.stripe)
  dot(x - 1, y - 1, 3, 2, FUR.sock)
  dot(x, y - 1, 1, 1, FUR.bean)
  if (spark) {
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      dot(Math.round(spark.x) + dx * 3, Math.round(spark.y) + dy * 3, 1, 1, SPARK[0])
      dot(Math.round(spark.x) + dx * 4, Math.round(spark.y) + dy * 4, 1, 1, SPARK[1])
    }
  }
}

/**
 * Brings the cat to life: `cat` is its button. Returns a way to poke it, and a way to stop
 * everything and tidy up.
 */
function startCat(cat: HTMLElement) {
  /** What the cat is doing. While it gets up or swats, a new poke waits its turn. */
  let doing: 'sleeping' | 'getting up' | 'sitting' | 'swatting' | 'lying down' = 'sleeping'
  let waiting: Poke | null = null
  /** Where the mouse is now, in the window: the cat aims at this, not at where it was poked. */
  let pointer: Point | null = null
  let timer = 0
  let frame = 0
  /** Stops the swat that is under way and tidies up after it. */
  let stopSwat: (() => void) | null = null

  /** Shows one of the cat's pictures, or lets it sleep: asleep, its breath is a CSS animation. */
  const show = (picture: number | null) => {
    cat.classList.toggle('is-awake', picture !== null)
    cat.classList.toggle('is-up', picture !== null && picture >= PICTURE.rising)
    cat.style.backgroundPositionX = picture === null ? '' : `${(picture / (PICTURES - 1)) * 100}%`
  }
  const after = (ms: number, then: () => void) => {
    window.clearTimeout(timer)
    timer = window.setTimeout(then, ms)
  }
  const track = (event: PointerEvent) => {
    pointer = { x: event.clientX, y: event.clientY }
  }

  /** Sitting with nothing to do: a poke that was waiting is answered at once, or else the cat lies down after a while. */
  const sit = () => {
    doing = 'sitting'
    show(PICTURE.sitting)
    if (waiting) swat(waiting)
    else after(MS.patience, lieDown)
  }

  const getUp = (from: 'lying' | 'half up') => {
    doing = 'getting up'
    window.addEventListener('pointermove', track, { passive: true })
    const rise = () => {
      show(PICTURE.rising)
      after(MS.rise, () => {
        show(PICTURE.sitting)
        after(MS.look, sit)
      })
    }
    if (from === 'half up') return rise()
    show(PICTURE.awake)
    after(MS.wake, rise)
  }

  const lieDown = () => {
    doing = 'lying down'
    show(PICTURE.rising)
    after(MS.settle, () => {
      show(PICTURE.awake)
      after(MS.drowse, () => {
        doing = 'sleeping'
        window.removeEventListener('pointermove', track)
        show(null)
      })
    })
  }

  /** One swat at the cursor, or at where the cat was poked. */
  const swat = (poke: Poke) => {
    doing = 'swatting'
    waiting = null
    window.clearTimeout(timer)

    // Where the blow is aimed, in the cat's pixels. The pictures stand on the bottom of the button.
    const box = cat.getBoundingClientRect()
    const scale = box.width / SIZE
    const aim = poke.cursor ? (pointer ?? poke.at) : poke.at
    const target = aim ? { x: (aim.x - box.left) / scale, y: SIZE - (box.bottom - aim.y) / scale } : THE_AIR
    const leg = target.x < CHEST.x ? LEGS[0] : LEGS[1]
    // The blow goes outward from the cat's chest. Right on its chest, it goes upward.
    const fromChest = Math.hypot(target.x - CHEST.x, target.y - CHEST.y)
    const toward = fromChest < 1.5 ? { x: 0, y: -1 } : { x: (target.x - CHEST.x) / fromChest, y: (target.y - CHEST.y) / fromChest }
    // A paw only reaches so far. Past that it strikes the air on the way to the cursor.
    const fromShoulder = Math.hypot(target.x - leg.shoulder.x, target.y - leg.shoulder.y)
    const inReach = fromShoulder <= REACH
    const lands = inReach ? target : between(leg.shoulder, target, REACH / fromShoulder)
    const drawn = { x: lands.x - toward.x * DRAWN_BACK, y: lands.y - toward.y * DRAWN_BACK }
    const past = { x: lands.x + toward.x * FOLLOW_THROUGH, y: lands.y + toward.y * FOLLOW_THROUGH }

    // The leg is drawn on a canvas of its own, over the cat and over the cursor's picture.
    const canvas = document.createElement('canvas')
    canvas.className = 'cat-paw'
    canvas.width = canvas.height = SIZE + ROOM * 2
    const pen = canvas.getContext('2d')
    document.body.append(canvas)
    // The cursor's picture takes the real cursor's place at once, while both are in the same spot.
    const cursor = cursorAt(aim ?? { x: 0, y: 0 })
    const picture = poke.cursor && aim && inReach ? document.createElement('img') : null
    const at = aim ?? { x: 0, y: 0 }
    if (picture) {
      picture.className = 'knocked-cursor'
      picture.src = cursor.src
      picture.width = cursor.width
      picture.height = cursor.height
      picture.alt = ''
      document.body.append(picture)
      document.documentElement.classList.add('cursor-away')
    }
    show(leg.picture)

    const started = performance.now()
    const landsAt = MS.lift + MS.strike
    const pawDown = landsAt + MS.through + MS.back
    // It is over once the paw is down and the cursor, if it was hit, is back at the mouse.
    const over = Math.max(pawDown, picture ? landsAt + MS.fly + MS.rest + MS.drift : 0)
    let ended = false

    /** The swat is over: the real cursor comes back, under its picture, and the cat can be poked again. */
    const end = () => {
      ended = true
      document.documentElement.classList.remove('cursor-away')
      canvas.remove()
      stopSwat = null
    }
    stopSwat = () => {
      cancelAnimationFrame(frame)
      end()
      picture?.remove()
    }

    const draw = (now: number) => {
      const t = now - started
      const since = t - landsAt
      // Where the paw is: lifted off the ground and drawn back, then out to the cursor, a little past it, and down again.
      const paw =
        t < MS.lift
          ? between(leg.ground, drawn, easeOut(t / MS.lift))
          : since < 0
            ? between(drawn, lands, ((t - MS.lift) / MS.strike) ** 2)
            : since < MS.through
              ? between(lands, past, easeOut(since / MS.through))
              : between(past, leg.ground, easeInOut(Math.min(1, (since - MS.through) / MS.back)))
      // How far the cursor has been knocked: out fast, a rest, then back to the mouse.
      const knocked =
        since < 0
          ? 0
          : since < MS.fly
            ? KNOCK * easeOut(since / MS.fly)
            : since < MS.fly + MS.rest
              ? KNOCK
              : KNOCK * (1 - easeInOut(Math.min(1, (since - MS.fly - MS.rest) / MS.drift)))

      if (!ended) {
        // The cat may have moved with the page since the last frame.
        const place = cat.getBoundingClientRect()
        const size = place.width / SIZE
        canvas.style.width = canvas.style.height = `${canvas.width * size}px`
        canvas.style.transform = `translate(${place.left - ROOM * size}px, ${place.bottom - (SIZE + ROOM) * size}px)`
        if (pen) {
          pen.clearRect(0, 0, canvas.width, canvas.height)
          // Back on the ground, the paw is part of the cat's picture again.
          if (t < pawDown) drawLeg(pen, leg.shoulder, paw, leg.outward, picture && since >= 0 && since < MS.spark ? lands : null)
          else show(PICTURE.sitting)
        }
      }
      if (picture) {
        const here = pointer ?? at
        const x = here.x - cursor.tip.x + toward.x * knocked
        const y = here.y - cursor.tip.y + toward.y * knocked
        picture.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`
      }

      if (t >= over && !ended) {
        end()
        sit()
      }
      // The picture keeps following the mouse for a moment after the real cursor is back.
      if (t < over + (picture ? MS.overlap : 0)) frame = requestAnimationFrame(draw)
      else picture?.remove()
    }
    draw(started)
  }

  return {
    poke(poke: Poke) {
      if (poke.at && poke.cursor) pointer = poke.at
      // With reduced motion the cat only sits up for a while, and lies down again.
      if (prefersReducedMotion()) {
        doing = 'sitting'
        show(PICTURE.sitting)
        after(MS.patience, () => {
          doing = 'sleeping'
          show(null)
        })
        return
      }
      waiting = poke
      if (doing === 'sleeping') getUp('lying')
      else if (doing === 'lying down') getUp('half up')
      else if (doing === 'sitting') swat(poke)
    },
    stop() {
      window.clearTimeout(timer)
      window.removeEventListener('pointermove', track)
      stopSwat?.()
    },
  }
}

export default function SleepingCat() {
  const button = useRef<HTMLButtonElement>(null)
  const cat = useRef<ReturnType<typeof startCat> | null>(null)
  /** What last pressed the cat: a mouse, a finger or a pen. */
  const pressedBy = useRef('mouse')

  useEffect(() => {
    if (!button.current) return
    const started = startCat(button.current)
    cat.current = started
    return () => {
      started.stop()
      cat.current = null
    }
  }, [])

  return (
    <button
      type="button"
      className="sleeping-cat"
      ref={button}
      aria-label="A sleeping street cat. Poke it and it sits up and bats your cursor away."
      onPointerDown={(event) => {
        pressedBy.current = event.pointerType
      }}
      onClick={(event) => {
        // A click made with the keyboard has no place of its own, and only a mouse has a cursor.
        const byKey = event.detail === 0
        cat.current?.poke({
          at: byKey ? null : { x: event.clientX, y: event.clientY },
          cursor: !byKey && pressedBy.current === 'mouse',
        })
      }}
    />
  )
}
