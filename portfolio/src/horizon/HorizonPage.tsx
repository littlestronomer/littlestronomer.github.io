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

// The painting moves at most this fraction of the notes' speed, so it reads as far away.
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
  const nav = useRef<HTMLElement>(null)
  const [walk] = useState(createWalk)
  // Without WebGL the painting stays still and the boat is drawn as a plain picture.
  const [paintingIsFlat, setPaintingIsFlat] = useState(false)
  const reducedMotion = useSyncExternalStore(subscribeToReducedMotion, () => reducedMotionQuery.matches)

  useGSAP(
    () => {
      const stageEl = stage.current
      const trackEl = track.current
      const navEl = nav.current
      if (!stageEl || !trackEl || !navEl) return

      const walkLength = () => Math.max(0, trackEl.offsetWidth - stageEl.clientWidth)

      // Slide the painting along with the notes, slower than them.
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

      // Scrolling down moves the notes left. The scroll distance equals the walk length,
      // so a scroll position maps straight to how far along the walk you are.
      const walkTween = gsap.to(trackEl, {
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

      const scrollToNote = (note: HTMLElement, smooth: boolean) => {
        const trigger = walkTween.scrollTrigger
        if (!trigger) return
        const offset = gsap.utils.clamp(0, walkLength(), note.offsetLeft - stageEl.clientWidth * 0.08)
        window.scrollTo({ top: trigger.start + offset, behavior: smooth && !reducedMotion ? 'smooth' : 'auto' })
      }

      // Tabbing into a note that is off screen brings it into view.
      const onFocusIn = (event: FocusEvent) => {
        const note = event.target instanceof Element ? event.target.closest<HTMLElement>('.note') : null
        if (note) scrollToNote(note, false)
      }

      // The section links sail to their note and move keyboard focus there.
      const onNavClick = (event: MouseEvent) => {
        const link = event.target instanceof Element ? event.target.closest('a') : null
        const note = link && document.getElementById(link.hash.slice(1))
        if (!note) return
        event.preventDefault()
        scrollToNote(note, true)
        note.focus({ preventScroll: true })
      }

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

      trackEl.addEventListener('focusin', onFocusIn)
      navEl.addEventListener('click', onNavClick)
      window.addEventListener('wheel', onWheel, { passive: false })
      window.addEventListener('keydown', onKeyDown)
      document.fonts.ready.then(() => ScrollTrigger.refresh())

      return () => {
        trackEl.removeEventListener('focusin', onFocusIn)
        navEl.removeEventListener('click', onNavClick)
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
      navRef={nav}
      sky={<PaintedSky walk={walk} animate={!reducedMotion} onUnavailable={() => setPaintingIsFlat(true)} />}
      boat={<PaperBoat walk={walk} still={reducedMotion} />}
    />
  )
}
