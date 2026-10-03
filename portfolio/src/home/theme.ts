// Which colors the site is wearing: the night sky, or the red and white of the Turkish flag.
// CSS reads the choice from <html data-theme>; the canvases ask for it here and are told when
// it changes.

export type Theme = 'night' | 'turk'

let theme: Theme = 'night'
const watchers = new Set<() => void>()

export function currentTheme() {
  return theme
}

/** Switches the whole site, CSS and canvases alike. */
export function setTheme(next: Theme) {
  if (next === theme) return
  theme = next
  if (next === 'night') delete document.documentElement.dataset.theme
  else document.documentElement.dataset.theme = next
  for (const watcher of watchers) watcher()
}

/** Calls `watcher` whenever the theme changes. Returns a function that stops watching. */
export function watchTheme(watcher: () => void) {
  watchers.add(watcher)
  return () => {
    watchers.delete(watcher)
  }
}
