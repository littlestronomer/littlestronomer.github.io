import type { ReactNode, Ref } from 'react'

type WalkLayoutProps = {
  /** Set when WebGL is unavailable, so the plain painting and boat picture show instead. */
  flat?: boolean
  /** The moving painting and the paper boat. The prerendered HTML leaves them out. */
  sky?: ReactNode
  boat?: ReactNode
  rootRef?: Ref<HTMLDivElement>
  stageRef?: Ref<HTMLDivElement>
  trackRef?: Ref<HTMLElement>
}

// The walk's page structure. The live page fills in the moving parts; the build renders it
// as plain HTML. There is nothing to read on the walk: what I do is on the portfolio, and
// this is only the painted shore to sail along.
export default function WalkLayout({ flat = false, sky, boat, rootRef, stageRef, trackRef }: WalkLayoutProps) {
  return (
    <div className="horizon" ref={rootRef}>
      <div className={flat ? 'horizon-stage is-flat' : 'horizon-stage'} ref={stageRef}>
        {sky}

        {/* The stretch of shore to walk: as long as the walk, with nothing on it. */}
        <main className="horizon-track" ref={trackRef}>
          <h1 className="visually-hidden">A walk along the water</h1>
        </main>

        <nav className="horizon-nav" aria-label="Site">
          <a href="/">Portfolio</a>
        </nav>

        {boat}
        <p className="horizon-hint" aria-hidden="true">
          Scroll to sail along
        </p>
      </div>
    </div>
  )
}
