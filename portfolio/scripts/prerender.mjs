// Fills the built pages with their content as plain HTML, after `vite build`.
//
// Without this the pages hold only an empty <div id="root">, so search engines, link
// previews and AI tools that don't run JavaScript would find nothing. It also adds a
// schema.org profile to every page and writes /llms.txt.
//
// Usage: node scripts/prerender.mjs [build folder]   (defaults to ../dist, Vite's outDir)

import { readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = fileURLToPath(new URL('..', import.meta.url))
const dist = resolve(root, process.argv[2] ?? '../dist')

// Vite loads the TypeScript and JSX for us, the same way the dev server does.
const vite = await createServer({
  root,
  logLevel: 'error',
  appType: 'custom',
  server: { middlewareMode: true, hmr: false },
})

try {
  const { renderHome, renderWalk, structuredData, llmsText } = await vite.ssrLoadModule('/src/prerender.tsx')
  // JSON inside a <script> must not be able to close the tag early.
  const profile = `<script type="application/ld+json">${JSON.stringify(structuredData()).replace(/</g, '\\u003c')}</script>`

  await fillPage(join(dist, 'index.html'), renderHome(), profile)
  await fillPage(join(dist, 'walk', 'index.html'), renderWalk(), profile)
  await writeFile(join(dist, 'llms.txt'), llmsText())
  console.log(`prerendered index.html, walk/index.html and llms.txt in ${dist}`)
} finally {
  await vite.close()
}

async function fillPage(file, markup, headExtra) {
  const html = await readFile(file, 'utf8')
  if (!html.includes('<div id="root"></div>')) throw new Error(`${file} has no empty <div id="root"> to fill`)
  const filled = html
    .replace('<div id="root"></div>', () => `<div id="root">${markup}</div>`)
    .replace('</head>', () => `  ${headExtra}\n  </head>`)
  await writeFile(file, filled)
}
