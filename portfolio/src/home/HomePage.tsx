import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import {
  AwardsNote,
  BuiltNote,
  ContactNote,
  HelloNote,
  LatestCommits,
  NowNote,
  PapersNote,
  StudyNote,
  WorkNote,
} from '../content/Notes'
import { SITE_URL } from '../content/profile'
import BattleMap from './BattleMap'
import Masthead from './Masthead'
import SkyBackground from './SkyBackground'
import { setTheme } from './theme'
import { shiftTheme } from './themeShift'
import TinyNet from './TinyNet'
import { TurkHello, TurkNotes, TurkSide } from './TurkishNotes'

const TABS = [
  { href: '#note-hello', label: 'About' },
  { href: '#note-papers', label: 'Papers' },
  { href: '#note-work', label: 'Work' },
  { href: '#note-built', label: 'Projects' },
  { href: '#note-awards', label: 'Awards' },
  { href: '#note-study', label: 'Study' },
  { href: '#note-contact', label: 'Contact' },
  { href: '/walk/', label: 'The walk' },
]

// In the Turkish theme the page is about food, tea, customs and history instead.
const TURKISH_TABS = [
  { href: '#turk-hello', label: 'Merhaba' },
  { href: '#turk-battle', label: 'Battles' },
  { href: '#turk-sofra', label: 'Sofra' },
  { href: '#turk-cay', label: 'Çay' },
  { href: '#turk-culture', label: 'Customs' },
  { href: '#turk-memes', label: 'Memes' },
  { href: '#turk-words', label: 'Words' },
  { href: '#turk-trabzon', label: 'Trabzon' },
]

// 88×31 buttons, the old web's way of saying hello. Mine is first; the rest are for fun.
const BUTTONS = [
  { file: 'littlestronomer.png', alt: 'littlestronomer' },
  { file: 'agi-loading.png', alt: 'AGI loading, 42 percent' },
  { file: 'loss-going-down.png', alt: 'Loss going down' },
  { file: 'attention.png', alt: 'Attention is all you need' },
  { file: 'fast-kernels.png', alt: 'Fast kernels inside' },
  { file: 'night-owl.png', alt: 'Best viewed at night' },
  { file: 'trabzon.png', alt: 'Made in Trabzon' },
  { file: 'no-cookies.png', alt: 'No cookies here' },
]

// In the Turkish theme the strip is about tea, cats and the evil eye instead. These carry
// Turkish words, so each says what it means when the cursor rests on it.
const TURKISH_BUTTONS = [
  { file: 'turkey-mentioned.png', alt: 'Turkey mentioned' },
  { file: 'powered-by-cay.png', alt: 'Powered by çay (tea)' },
  { file: 'nazar.png', alt: 'Nazar değmesin: may the evil eye not touch you' },
  { file: 'street-cat.png', alt: 'Approved by street cats' },
  { file: 'kahve.png', alt: 'A proverb: one cup of coffee is remembered for forty years' },
  { file: 'simit.png', alt: 'Taze simit: fresh sesame rings' },
  { file: 'tavla.png', alt: 'Şeş beş: a six and a five at tavla (backgammon)' },
  { file: 'trabzon.png', alt: 'Made in Trabzon' },
]

const MY_BUTTON = `${SITE_URL}buttons/littlestronomer.png`
const LINK_CODE = `<a href="${SITE_URL}"><img src="${MY_BUTTON}" width="88" height="31" alt="littlestronomer"></a>`

function LinkToMe() {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(LINK_CODE).then(
      () => setCopied(true),
      () => setCopied(false),
    )
  }

  return (
    <section className="box link-box" aria-labelledby="link-title">
      <h2 id="link-title">Link to me</h2>
      <img className="pixel-button" src="/buttons/littlestronomer.png" width={88} height={31} alt="littlestronomer" />
      <p>Have a site of your own? You&apos;re welcome to put my button on it:</p>
      <pre className="link-code">
        <code>{LINK_CODE}</code>
      </pre>
      <button type="button" className="pixel-action" onClick={copy}>
        {copied ? 'Copied' : 'Copy the code'}
      </button>
    </section>
  )
}

type TurkishSwitchProps = { on: boolean; onToggle: () => void }

/** The word "Turkish", which turns the whole site Turkish when clicked. */
function TurkishSwitch({ on, onToggle }: TurkishSwitchProps) {
  return (
    <button
      type="button"
      className="word-switch"
      aria-pressed={on}
      aria-label="Turkish: turn the whole site Turkish"
      onClick={onToggle}
    >
      Turkish
    </button>
  )
}

/** The strip across the top while the site wears the flag, shouting the way the meme does. */
function TurkishBanner({ onClose }: { onClose: () => void }) {
  return (
    <div className="turk-banner">
      <p className="turk-shout" role="status">
        <span className="visually-hidden">
          Turkey mentioned. The site is now in the colors of the Turkish flag, and about Turkish food, customs
          and history.
        </span>
        {/* The shout is written twice so it can loop without a gap. */}
        <span className="turk-marquee" aria-hidden="true">
          {[0, 1].map((copy) => (
            <span key={copy}>
              {Array.from({ length: 6 }, (_, i) => (
                <span key={i}>cCc TURKEY MENTIONED cCc</span>
              ))}
            </span>
          ))}
        </span>
      </p>
      <button type="button" onClick={onClose}>
        Back to the night
      </button>
    </div>
  )
}

type Tab = { href: string; label: string }

/** Which note is being read, so its tab can light up. */
function useCurrentNote(tabs: Tab[]) {
  const [current, setCurrent] = useState<string | null>(null)
  useEffect(() => {
    const notes = tabs.flatMap((tab) => {
      const note = tab.href.startsWith('#') ? document.getElementById(tab.href.slice(1)) : null
      return note ? [note] : []
    })
    // A note counts as current while it crosses a band about a third of the way down.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setCurrent(entry.target.id)
      },
      { rootMargin: '-30% 0px -65% 0px' },
    )
    for (const note of notes) observer.observe(note)
    return () => observer.disconnect()
  }, [tabs])
  return current
}

export default function HomePage() {
  // Clicking "Turkish" among my languages turns the whole site Turkish: the flag's colors, a
  // rider on the steppe, and food, customs and history in place of the engineering.
  const [turkish, setTurkish] = useState(false)
  const shown = useRef(turkish)
  useLayoutEffect(() => {
    setTheme(turkish ? 'turk' : 'night')
    // The two versions are different pages in all but name, so each one starts from its top.
    // The change itself glides there first (see switchTo); this jump is for when it could not.
    // It is made once the new page is in place, and again on the next frame in case a smooth
    // scroll was still under way and carried the page on.
    const toTop = () => window.scrollTo({ top: 0, behavior: 'instant' })
    let again = 0
    if (shown.current !== turkish) {
      toTop()
      again = requestAnimationFrame(toTop)
    }
    shown.current = turkish
    return () => {
      cancelAnimationFrame(again)
      setTheme('night')
    }
  }, [turkish])
  // The page glides to its top and the new theme spreads over the old one, pixel by pixel.
  // While that plays, further clicks wait their turn.
  const shifting = useRef(false)
  const switchTo = async (next: boolean) => {
    if (shifting.current) return
    shifting.current = true
    try {
      await shiftTheme(() => flushSync(() => setTurkish(next)))
    } finally {
      shifting.current = false
    }
  }
  const turkishSwitch = () => <TurkishSwitch on={turkish} onToggle={() => switchTo(!turkish)} />
  const tabs = turkish ? TURKISH_TABS : TABS
  const current = useCurrentNote(tabs)

  return (
    <div className="home">
      {turkish && <TurkishBanner onClose={() => switchTo(false)} />}
      <SkyBackground />
      <Masthead turkish={turkish} />

      <nav className="tabs" aria-label="Sections">
        {tabs.map((tab) => (
          <a key={tab.href} href={tab.href} aria-current={tab.href === `#${current}` ? 'location' : undefined}>
            {tab.label}
          </a>
        ))}
      </nav>

      {turkish ? (
        <main className="home-body">
          <TurkHello onLeave={() => switchTo(false)} />
          <BattleMap />
          <div className="home-notes">
            <TurkNotes />
          </div>
          <aside className="home-side" aria-label="Around the site">
            <TurkSide />
          </aside>
        </main>
      ) : (
        <main className="home-body">
          <HelloNote />
          <TinyNet />
          <div className="home-notes">
            <NowNote />
            <PapersNote />
            <WorkNote />
            <BuiltNote />
            <AwardsNote />
            <StudyNote turkish={turkishSwitch()} />
            <ContactNote commits={false} />
          </div>

          <aside className="home-side" aria-label="Around the site">
            <section className="box log-box">
              <LatestCommits title="Training log" level={2} />
            </section>

            <section className="box card-box" aria-labelledby="card-title">
              <h2 id="card-title">Model card</h2>
              <p>If I were a model on a hub, my card would read:</p>
              <dl className="model-card">
                <dt>Architecture</dt>
                <dd>Biological neural network, about 86 billion neurons</dd>
                <dt>Pretraining</dt>
                <dd>AI and Data Engineering, Istanbul Technical University, 2022 to 2026</dd>
                <dt>Fine-tuning</dt>
                <dd>Computer science exchange term, University of Waterloo</dd>
                <dt>Evaluation</dt>
                <dd>4th place at NVIDIA MLSys 2026, Kaggle silver medal</dd>
                <dt>Publications</dt>
                <dd>A poster at Agenthon 2026, a NeurIPS workshop</dd>
                <dt>Languages</dt>
                <dd>{turkishSwitch()}, English; Japanese and Chinese still training</dd>
                <dt>Intended use</dt>
                <dd>Research collaborations, internships and ML systems roles</dd>
              </dl>
            </section>

            <section className="box walk-box" aria-labelledby="walk-title">
              <h2 id="walk-title">Hobby corner</h2>
              <a className="walk-picture" href="/walk/">
                <img src="/images/walk.png" width={288} height={96} alt="" />
              </a>
              <p>
                A slower page I made for fun: a walk along a painted shore, with drifting clouds, a
                paper boat and a paper plane.
              </p>
              <p>
                <a href="/walk/">Take the walk</a>
              </p>
            </section>

            <LinkToMe />
          </aside>
        </main>
      )}

      {/* A patch of open sky, where the northern constellations rest when the page ends. */}
      <div className="open-sky" aria-hidden="true" />

      <footer className="home-footer">
        <div className="button-strip">
          {/* The buttons are listed twice so the strip can loop without a gap; the copy is
              hidden from screen readers. */}
          <ul className="button-wall" aria-label="Buttons">
            {[false, true].flatMap((copy) =>
              (turkish ? TURKISH_BUTTONS : BUTTONS).map((button) => (
                <li key={`${button.file}${copy ? '-copy' : ''}`} aria-hidden={copy || undefined}>
                  <img
                    className="pixel-button"
                    src={`/buttons/${button.file}`}
                    width={88}
                    height={31}
                    alt={copy ? '' : button.alt}
                    title={turkish ? button.alt : undefined}
                    loading="lazy"
                  />
                </li>
              )),
            )}
          </ul>
        </div>
        {turkish ? (
          <p>Göktürk Batın Dervişoğlu, 2026. Güle güle: go smiling.</p>
        ) : (
          <p>
            Göktürk Batın Dervişoğlu, 2026. The network at the top trains on your own device, and the
            constellations behind the page light up when you touch them.
          </p>
        )}
      </footer>
    </div>
  )
}
