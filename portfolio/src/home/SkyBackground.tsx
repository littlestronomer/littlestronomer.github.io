import { useEffect, useRef } from 'react'
import { startSkyBackground } from './skyBackground'

// The sky behind the page: stars, and constellations that shine under the cursor together with
// the galaxies, nebulae and star clusters beside them. A small label follows the cursor with a
// few words about what it is on. The sky has depth: the Milky Way lies far behind, the
// constellations in the middle, and the loose stars at every depth behind and in front of them,
// so they move at different speeds as the page scrolls. It is decoration only, so screen
// readers skip it.
export default function SkyBackground() {
  const far = useRef<HTMLCanvasElement>(null)
  const behind = useRef<HTMLCanvasElement>(null)
  const still = useRef<HTMLCanvasElement>(null)
  const near = useRef<HTMLCanvasElement>(null)
  const lit = useRef<HTMLDivElement>(null)
  const whisper = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (!far.current || !behind.current || !still.current || !near.current || !lit.current) return
    return startSkyBackground(still.current, {
      far: far.current,
      behind: behind.current,
      near: near.current,
      lit: lit.current,
      whisper: whisper.current,
    })
  }, [])

  return (
    <>
      <div className="sky" aria-hidden="true">
        <canvas ref={far} />
        <canvas ref={behind} />
        <canvas ref={still} />
        <div className="sky-lit" ref={lit} />
        <canvas ref={near} />
      </div>
      <p className="sky-whisper" ref={whisper} aria-hidden="true" hidden />
    </>
  )
}
