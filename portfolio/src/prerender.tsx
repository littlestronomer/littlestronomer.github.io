import { renderToStaticMarkup } from 'react-dom/server'
import Notes from './content/Notes'
import { LINKS, PROFILE, SITE_URL } from './content/profile'
import HomePage from './home/HomePage'
import OnePage from './horizon/OnePage'
import WalkLayout from './horizon/WalkLayout'

// Renders the site without a browser, for scripts/prerender.mjs. The HTML it fills in is what
// search engines, link previews and AI tools read, since many of them never run JavaScript.

/** The portfolio at /. */
export function renderHome() {
  return renderToStaticMarkup(<HomePage />)
}

/** The walk along the water at /walk/. */
export function renderWalk() {
  return renderToStaticMarkup(<WalkLayout />)
}

/** The walk's notes as one plain page, at /walk/page/. */
export function renderWalkPage() {
  return renderToStaticMarkup(<OnePage />)
}

/** A schema.org profile, for a <script type="application/ld+json"> tag. */
export function structuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: PROFILE.name,
    alternateName: PROFILE.handle,
    url: SITE_URL,
    jobTitle: PROFILE.role,
    description: PROFILE.summary,
    email: PROFILE.email,
    alumniOf: PROFILE.schools.map((name) => ({ '@type': 'CollegeOrUniversity', name })),
    knowsAbout: PROFILE.topics,
    knowsLanguage: ['tr', 'en'],
    award: PROFILE.awards,
    sameAs: [LINKS.github, LINKS.linkedin, LINKS.kaggle, LINKS.youtube],
  }
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', '#x27': "'", '#39': "'", nbsp: ' ' }

// Turns the notes' HTML into Markdown. It only needs to handle the few tags the notes use.
function toMarkdown(html: string) {
  const absolute = (href: string) => (href.startsWith('/') ? new URL(href, SITE_URL).href : href)
  return html
    .replace(/<\/a>\s*<a /g, '</a>, <a ')
    .replace(/<a [^>]*?href="([^"]*)"[^>]*>(.*?)<\/a>/g, (_, href: string, text: string) => `[${text}](${absolute(href)})`)
    .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
    .replace(/<h1[^>]*>(.*?)<\/h1>/g, '\n# $1\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/g, '\n## $1\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/g, '\n### $1\n')
    .replace(/<\/?(ul|dl)[^>]*>/g, '\n')
    .replace(/<li[^>]*>(.*?)<\/li>/g, '- $1\n')
    .replace(/<dt[^>]*>(.*?)<\/dt>\s*<dd[^>]*>(.*?)<\/dd>/g, '- $1: $2\n')
    .replace(/<p[^>]*>(.*?)<\/p>/g, '\n$1\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#x27|#39|amp|lt|gt|quot|nbsp);/g, (_, name: string) => ENTITIES[name])
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** /llms.txt: the whole site as Markdown, a convention some AI tools look for. */
export function llmsText() {
  const notes = toMarkdown(renderToStaticMarkup(<Notes />))
  const link = (path: string) => new URL(path, SITE_URL).href
  return `${notes}

## About this site

- [Portfolio](${SITE_URL}): these notes on a pixel-art night sky, next to a small neural network that trains live in the browser
- [A walk along the water](${link('/walk/')}): my hobby corner, the same notes on a painted shore that scrolls sideways
`
}
