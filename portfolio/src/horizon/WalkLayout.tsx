import type { ReactNode, Ref } from 'react'
import Notes from '../content/Notes'

const SECTIONS = [
  { note: 'note-hello', label: 'About' },
  { note: 'note-work', label: 'Work' },
  { note: 'note-built', label: 'Projects' },
  { note: 'note-awards', label: 'Awards' },
  { note: 'note-contact', label: 'Contact' },
]

type WalkLayoutProps = {
  /** Set when WebGL is unavailable, so the plain painting and boat picture show instead. */
  flat?: boolean
  /** The moving painting and the paper boat. The prerendered HTML leaves them out. */
  sky?: ReactNode
  boat?: ReactNode
  rootRef?: Ref<HTMLDivElement>
  stageRef?: Ref<HTMLDivElement>
  trackRef?: Ref<HTMLElement>
  navRef?: Ref<HTMLElement>
}

// The walk's page structure. The live page fills in the moving parts; the build renders it
// as plain HTML, so the notes are readable before any JavaScript runs.
export default function WalkLayout({ flat = false, sky, boat, rootRef, stageRef, trackRef, navRef }: WalkLayoutProps) {
  return (
    <div className="horizon" ref={rootRef}>
      <div className={flat ? 'horizon-stage is-flat' : 'horizon-stage'} ref={stageRef}>
        {sky}

        <main className="horizon-track" ref={trackRef}>
          <Notes />
        </main>

        <nav className="horizon-nav" ref={navRef} aria-label="Sections">
          {SECTIONS.map((section) => (
            <a key={section.note} href={`#${section.note}`}>
              {section.label}
            </a>
          ))}
          <a className="horizon-nav-page" href="/walk/page/">
            One page
          </a>
          <a className="horizon-nav-home" href="/">
            Portfolio
          </a>
        </nav>

        {boat}
        <p className="horizon-hint" aria-hidden="true">
          Scroll to sail along
        </p>
      </div>
    </div>
  )
}
