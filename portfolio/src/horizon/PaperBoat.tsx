import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import paperBoatUrl from './assets/paper-boat.svg'
import { BOAT_WATERLINE, type Walk } from './walk'

type PaperBoatProps = {
  walk: Walk
  /** Drop the rocking and drifting when the visitor prefers reduced motion. */
  still: boolean
}

// How quickly the boat catches up with the scroll position, per second.
const FOLLOW = 4.5
// Sailing at this many pixels per second or faster counts as full speed.
const FULL_SPEED = 700

// Sails the paper boat along the bottom of the stage to show how far along the walk you
// are. The painted sky draws it, sitting in the water; these elements only measure its
// size and stand in for that drawing when WebGL is unavailable.
export default function PaperBoat({ walk, still }: PaperBoatProps) {
  const boat = useRef<HTMLDivElement>(null)
  const reflection = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const boatEl = boat.current
      const reflectionEl = reflection.current
      const stage = boatEl?.offsetParent
      if (!boatEl || !reflectionEl || !(stage instanceof HTMLElement)) return

      let x = Number.NaN
      let speed = 0

      // time is in seconds and deltaMs in milliseconds, as GSAP's ticker passes them.
      const sail = (time: number, deltaMs: number) => {
        const dt = Math.min(deltaMs / 1000, 0.1) || 1 / 60
        const width = stage.clientWidth
        const margin = Math.max(56, width * 0.07)
        const target = margin + walk.progress * (width - 2 * margin)
        const previous = Number.isNaN(x) ? target : x
        x = still ? target : previous + (target - previous) * (1 - Math.exp(-FOLLOW * dt))
        const velocity = (x - previous) / dt
        speed += (Math.min(Math.abs(velocity) / FULL_SPEED, 1) - speed) * (1 - Math.exp(-3 * dt))

        // Two out-of-step swells make the bobbing feel natural rather than mechanical;
        // sailing faster adds a quicker chop. The bow lifts as the boat speeds up.
        const bob = still
          ? 0
          : 2.6 * Math.sin(time * 1.9) + 1.1 * Math.sin(time * 3.3 + 1.2) + 1.6 * speed * Math.sin(time * 5.2)
        const roll = still ? 0 : 2.8 * Math.sin(time * 1.5 + 0.6) + 0.9 * Math.sin(time * 2.7)
        const pitch = still ? 0 : gsap.utils.clamp(-7, 7, -velocity * 0.012)
        const tilt = roll + pitch

        boatEl.style.transform = `translate3d(${x}px, ${-bob}px, 0) rotate(${tilt}deg)`
        reflectionEl.style.transform = `translate3d(${x}px, ${bob}px, 0) rotate(${-tilt}deg) scaleY(-1)`

        walk.boatX = x
        walk.boatWidth = boatEl.offsetWidth
        walk.boatHeight = boatEl.offsetHeight
        walk.boatLevel = stage.clientHeight - (boatEl.offsetTop + boatEl.offsetHeight) + boatEl.offsetHeight * BOAT_WATERLINE
        walk.boatBob = bob
        walk.boatTilt = (tilt * Math.PI) / 180
        walk.boatStir = still ? 0 : 0.35 + 0.65 * speed
      }

      gsap.ticker.add(sail)
      return () => gsap.ticker.remove(sail)
    },
    { dependencies: [still], revertOnUpdate: true },
  )

  return (
    <>
      <div className="paper-boat-reflection" ref={reflection} aria-hidden="true">
        <img src={paperBoatUrl} alt="" />
      </div>
      <div className="paper-boat" ref={boat} aria-hidden="true">
        <img src={paperBoatUrl} alt="" />
      </div>
    </>
  )
}
