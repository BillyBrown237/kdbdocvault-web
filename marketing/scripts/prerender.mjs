/**
 * Bakes one static page per locale.
 *
 *   dist/index.html      English
 *   dist/fr/index.html   French
 *
 * Runs after both Vite builds: the client build produced `dist/index.html`
 * with an empty root, the SSR build produced `dist-ssr/entry-server.js`. This
 * joins them, rewrites the head for each locale, and throws the SSR bundle
 * away — it is a build artefact, not something that ships.
 *
 * Two separate documents rather than one page with a toggle, because that is
 * the only arrangement a search engine can index twice: each has its own
 * `<html lang>`, its own canonical URL, and reciprocal `hreflang` links.
 *
 * Deliberately strict. A prerender that silently produces nothing looks exactly
 * like one that worked, and the failure only surfaces weeks later as a page
 * that never ranked. Every step is asserted, and each locale's own headline
 * has to appear in its own output before this exits 0.
 */
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const templatePath = resolve(root, 'dist/index.html')
const serverEntry = resolve(root, 'dist-ssr/entry-server.js')

const ROOT_DIV = '<div id="root"></div>'

function fail(message) {
  console.error(`\nprerender: ${message}\n`)
  process.exit(1)
}

if (!existsSync(templatePath)) fail(`missing ${templatePath} — run \`vite build\` first`)
if (!existsSync(serverEntry)) fail(`missing ${serverEntry} — run \`npm run build:ssr\` first`)

const { render, DICTIONARIES, LOCALES, LOCALE_PATH, SITE_ORIGIN } = await import(
  pathToFileURL(serverEntry).href
)
if (typeof render !== 'function') fail('entry-server.js does not export render()')

const template = await readFile(templatePath, 'utf8')
if (!template.includes(ROOT_DIV)) {
  fail(`could not find ${ROOT_DIV} in dist/index.html — has the template changed?`)
}

/**
 * Replace exactly one occurrence, and complain if it was not there.
 *
 * The head is rewritten by matching the English values that Vite emitted. If a
 * meta tag is reworded in index.html without updating `en.ts`, this stops the
 * build instead of shipping a French page carrying an English description.
 */
function swap(html, from, to, what) {
  if (from === to) return html
  if (!html.includes(from)) fail(`could not find the ${what} to replace:\n  ${from.slice(0, 120)}`)
  return html.replace(from, to)
}

const en = DICTIONARIES.en

for (const locale of LOCALES) {
  const t = DICTIONARIES[locale]
  const body = render(locale)

  if (!body || body.length < 5_000) {
    fail(`render('${locale}') returned ${body?.length ?? 0} characters — the page did not render`)
  }
  if (!body.includes(t.hero.title)) {
    fail(`the ${locale} render does not contain its own headline (${t.hero.title})`)
  }

  let html = template
  html = swap(html, `<html lang="${en.meta.lang}"`, `<html lang="${t.meta.lang}"`, 'html lang')
  html = swap(html, `<title>${en.meta.title}</title>`, `<title>${t.meta.title}</title>`, 'title')
  html = swap(html, en.meta.description, t.meta.description, 'meta description')
  html = swap(html, en.meta.title, t.meta.title, 'og:title')
  html = swap(html, en.meta.ogDescription, t.meta.ogDescription, 'og:description')
  html = swap(html, en.meta.ogImageAlt, t.meta.ogImageAlt, 'og:image:alt')
  html = swap(html, en.meta.jsonLdDescription, t.meta.jsonLdDescription, 'JSON-LD description')
  html = swap(
    html,
    `<meta property="og:locale" content="${en.meta.ogLocale}" />`,
    `<meta property="og:locale" content="${t.meta.ogLocale}" />`,
    'og:locale',
  )
  html = swap(
    html,
    `<link rel="canonical" href="${SITE_ORIGIN}${LOCALE_PATH.en}" />`,
    `<link rel="canonical" href="${SITE_ORIGIN}${LOCALE_PATH[locale]}" />`,
    'canonical',
  )
  html = swap(
    html,
    `<meta property="og:url" content="${SITE_ORIGIN}${LOCALE_PATH.en}" />`,
    `<meta property="og:url" content="${SITE_ORIGIN}${LOCALE_PATH[locale]}" />`,
    'og:url',
  )
  html = swap(html, `"inLanguage": "${en.meta.lang}"`, `"inLanguage": "${t.meta.lang}"`, 'inLanguage')

  html = html.replace(ROOT_DIV, `<div id="root">${body}</div>`)

  const outDir = locale === 'en' ? resolve(root, 'dist') : resolve(root, 'dist', locale)
  await mkdir(outDir, { recursive: true })
  await writeFile(resolve(outDir, 'index.html'), html, 'utf8')

  console.log(
    `prerender: ${locale} → ${(body.length / 1024).toFixed(1)} kB of markup in ${LOCALE_PATH[locale]}index.html`,
  )
}

// The SSR bundle is only useful for the loop above. Leaving it behind invites
// somebody to deploy it.
await rm(resolve(root, 'dist-ssr'), { recursive: true, force: true })
