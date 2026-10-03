import { useEffect, useRef } from 'react'
import { startSkyBackground } from './skyBackground'

// The sky behind the page: stars and constellations that shine under the cursor, and a small
// label that follows the cursor with a few words about the one it is on. It is decoration only,
// so screen readers skip it.
export default function SkyBackground() {
  const still = useRef<HTMLCanvasElement>(null)
  const lit = useRef<HTMLDivElement>(null)
  const whisper = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (!still.current || !lit.current) return
    return startSkyBackground(still.current, { lit: lit.current, whisper: whisper.current })
  }, [])

  return (
    <>
      <div className="sky" aria-hidden="true">
        <canvas ref={still} />
        <div className="sky-lit" ref={lit} />
      </div>
      <p className="sky-whisper" ref={whisper} aria-hidden="true" hidden />
    </>
  )
}
