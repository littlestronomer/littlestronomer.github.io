import { useRef, useState, useSyncExternalStore } from 'react'
import { invalidate } from '@react-three/fiber'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import PaintedSky from './PaintedSky'
import PaperBoat from './PaperBoat'
import WalkLayout from './WalkLayout'
import { PAINTING_ASPECT } from './painting'
import { createWalk } from './walk'

gsap.registerPlugin(useGSAP, ScrollTrigger)

// The painting moves at most this fraction of the walk's speed, so it reads as far away.
const SKY_SPEED = 0.6

// One arrow-key press moves the walk this many pixels.
const ARROW_STEP = 120

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

function subscribeToReducedMotion(onChange: () => void) {
  reducedMotionQuery.addEventListener('change', onChange)
  return () => reducedMotionQuery.removeEventListener('change', onChange)
}

export default function HorizonPage() {
  const root = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLElement>(null)
  const [walk] = useState(createWalk)
  // Without WebGL the painting stays still and the boat is drawn as a plain picture.
  const [paintingIsFlat, setPaintingIsFlat] = useState(false)
  const reducedMotion = useSyncExternalStore(subscribeToReducedMotion, () => reducedMotionQuery.matches)

  useGSAP(
    () => {
      const stageEl = stage.current
      const trackEl = track.current
      if (!stageEl || !trackEl) return

      const walkLength = () => Math.max(0, trackEl.offsetWidth - stageEl.clientWidth)

      // Slide the painting along with the walk, slower than it.
      const placeSky = (progress: number) => {
        const width = stageEl.clientWidth
        const paintingWidth = Math.max(stageEl.clientHeight, width / PAINTING_ASPECT) * PAINTING_ASPECT
        const skyLength = Math.max(0, Math.min(paintingWidth - width, walkLength() * SKY_SPEED))
        walk.progress = progress
        walk.skyX = skyLength * progress
        stageEl.style.setProperty('--sky-x', `${walk.skyX}px`)
        stageEl.style.setProperty('--progress', progress.toFixed(4))
        invalidate()
      }

      // Scrolling down moves the shore left. The scroll distance equals the walk length,
      // so a scroll position maps straight to how far along the walk you are.
      gsap.to(trackEl, {
        x: () => -walkLength(),
        ease: 'none',
        onUpdate: () => placeSky(-Number(gsap.getProperty(trackEl, 'x')) / (walkLength() || 1)),
        scrollTrigger: {
          trigger: stageEl,
          pin: true,
          start: 'top top',
          end: () => `+=${walkLength()}`,
          scrub: reducedMotion ? true : 0.8,
          invalidateOnRefresh: true,
          onRefresh: (self) => placeSky(self.progress),
        },
      })

      // Sideways trackpad swipes and the left/right arrow keys also walk along.
      const onWheel = (event: WheelEvent) => {
        if (event.ctrlKey || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return
        event.preventDefault()
        window.scrollBy(0, event.deltaMode === WheelEvent.DOM_DELTA_LINE ? event.deltaX * 16 : event.deltaX)
      }

      const onKeyDown = (event: KeyboardEvent) => {
        const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
        if (!direction || event.altKey || event.ctrlKey || event.metaKey) return
        if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable]')) return
        event.preventDefault()
        window.scrollBy(0, direction * ARROW_STEP)
      }

      window.addEventListener('wheel', onWheel, { passive: false })
      window.addEventListener('keydown', onKeyDown)
      document.fonts.ready.then(() => ScrollTrigger.refresh())

      return () => {
        window.removeEventListener('wheel', onWheel)
        window.removeEventListener('keydown', onKeyDown)
      }
    },
    { scope: root, dependencies: [reducedMotion], revertOnUpdate: true },
  )

  return (
    <WalkLayout
      flat={paintingIsFlat}
      rootRef={root}
      stageRef={stage}
      trackRef={track}
      sky={<PaintedSky walk={walk} animate={!reducedMotion} onUnavailable={() => setPaintingIsFlat(true)} />}
      boat={<PaperBoat walk={walk} still={reducedMotion} />}
    />
  )
}
