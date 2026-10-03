import Notes from '../content/Notes'

// The same notes as the walk, stacked in one column with nothing moving: quick to skim,
// easy to print, and light on slow phones.
export default function OnePage() {
  return (
    <div className="one-page">
      <div className="one-page-painting" aria-hidden="true" />
      <nav className="one-page-nav" aria-label="Views">
        <a href="/walk/">Walk along the water</a>
        <a href="/">Portfolio</a>
      </nav>
      <main className="one-page-notes">
        <Notes />
      </main>
    </div>
  )
}
