import { useEffect, useRef, useState } from 'react'
import { startNightSky, type NightSky } from './nightSky'

/** Where Betelgeuse's link goes: its Wikipedia article, a long and well-sourced science page. */
const BETELGEUSE_PAGE = 'https://en.wikipedia.org/wiki/Betelgeuse'

type MastheadProps = {
  /** Under the Turkish flag the header shows the crescent and star, so Orion's buttons rest. */
  turkish: boolean
}

// The header: my handle over a pixel night sky, with Orion drawn as a neural network. Clicking
// Orion sends a signal through it, clicking Betelgeuse opens its page, and clicking the little
// astronomer brings a shooting star.
export default function Masthead({ turkish }: MastheadProps) {
  const sky = useRef<HTMLCanvasElement>(null)
  const words = useRef<HTMLDivElement>(null)
  const orion = useRef<HTMLButtonElement>(null)
  const betelgeuse = useRef<HTMLAnchorElement>(null)
  const astronomer = useRef<HTMLButtonElement>(null)
  const night = useRef<NightSky | null>(null)
  // Nothing is shown over the sky until it is drawn, so every button sits over what it names.
  const [drawn, setDrawn] = useState(false)
  const [moving, setMoving] = useState(false)

  useEffect(() => {
    if (!sky.current) return
    const started = startNightSky(sky.current, words.current, {
      orion: orion.current,
      betelgeuse: betelgeuse.current,
      astronomer: astronomer.current,
    })
    night.current = started
    setDrawn(true)
    setMoving(started.moving)
    return () => {
      started.stop()
      night.current = null
    }
  }, [])

  const glow = (on: boolean) => night.current?.glow(on)
  const flare = (on: boolean) => {
    night.current?.glow(on)
    night.current?.flare(on)
  }

  return (
    <header className="masthead">
      <canvas className="masthead-sky" ref={sky} aria-hidden="true" />
      <div className="masthead-words" ref={words}>
        <p className="wordmark">littlestronomer</p>
        {/* Under the flag the rider gets a traveler's blessing instead. */}
        <p className="tagline">
          {turkish ? 'Yolun açık olsun: may your road be open.' : 'Per aspera ad astra'}
        </p>
      </div>
      <button
        type="button"
        className="sky-spot"
        ref={orion}
        hidden={!moving || turkish}
        title="Orion, my favorite constellation. Click to send a signal through it."
        aria-label="Send a signal through Orion, my favorite constellation"
        onClick={() => night.current?.fire()}
        onPointerEnter={() => glow(true)}
        onPointerLeave={() => glow(false)}
        onFocus={() => glow(true)}
        onBlur={() => glow(false)}
      />
      <a
        className="sky-spot"
        ref={betelgeuse}
        hidden={!drawn || turkish}
        href={BETELGEUSE_PAGE}
        target="_blank"
        rel="noopener noreferrer"
        title="Betelgeuse, a red supergiant near the end of its life. Click to read about it."
        aria-label="Betelgeuse, the red supergiant on Orion's shoulder: read about it on Wikipedia (opens in a new tab)"
        onPointerEnter={() => flare(true)}
        onPointerLeave={() => flare(false)}
        onFocus={() => flare(true)}
        onBlur={() => flare(false)}
      />
      <button
        type="button"
        className="sky-spot"
        ref={astronomer}
        hidden={!moving || turkish}
        title="Click for a shooting star"
        aria-label="Ask the little astronomer for a shooting star"
        onClick={() => night.current?.shootingStar()}
      />
    </header>
  )
}
