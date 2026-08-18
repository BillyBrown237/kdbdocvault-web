/**
 * Bakes the rendered page into dist/index.html.
 *
 * Runs after both Vite builds: the client bundle produced `dist/index.html`
 * with an empty root, and the SSR build produced `dist-ssr/entry-server.js`.
 * This joins them and then throws the SSR build away — it is a build artefact,
 * not something that ships.
 *
 * Deliberately strict. A prerender that silently produces nothing looks exactly
 * like a prerender that worked, and the failure only shows up weeks later as a
 * page that never ranked. So every step is asserted and the result has to
 * contain the headline before this exits 0.
 */
import { readFile, writeFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const htmlPath = resolve(root, 'dist/index.html')
const serverEntry = resolve(root, 'dist-ssr/entry-server.js')

/** A string that must survive into the static HTML, or the render was empty. */
const CANARY = 'Your documents deserve more than a folder'
const ROOT_DIV = '<div id="root"></div>'

function fail(message) {
  console.error(`\nprerender: ${message}\n`)
  process.exit(1)
}

if (!existsSync(htmlPath)) fail(`missing ${htmlPath} — run \`vite build\` first`)
if (!existsSync(serverEntry)) fail(`missing ${serverEntry} — run \`npm run build:ssr\` first`)

const { render } = await import(pathToFileURL(serverEntry).href)
if (typeof render !== 'function') fail('dist-ssr/entry-server.js does not export render()')

const body = render()
if (!body || body.length < 5_000) {
  fail(`render() returned ${body?.length ?? 0} characters — the page did not render`)
}
if (!body.includes(CANARY)) fail(`rendered HTML does not contain the headline (${CANARY})`)

const html = await readFile(htmlPath, 'utf8')
if (!html.includes(ROOT_DIV)) {
  fail(`could not find ${ROOT_DIV} in dist/index.html — has the template changed?`)
}

await writeFile(htmlPath, html.replace(ROOT_DIV, `<div id="root">${body}</div>`), 'utf8')

// The SSR bundle is only useful for the line above. Leaving it behind invites
// somebody to deploy it.
await rm(resolve(root, 'dist-ssr'), { recursive: true, force: true })

const kb = (n) => `${(n / 1024).toFixed(1)} kB`
console.log(`prerender: ${kb(body.length)} of markup baked into dist/index.html`)
