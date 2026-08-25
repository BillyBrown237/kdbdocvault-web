#!/usr/bin/env node
/**
 * Fails if any t('…') key used in src/ is missing from a locale file.
 *
 * Why this exists: the SSO settings screen shipped calling t('app.save'),
 * t('roles.member') and t('roles.admin'), none of which existed in either
 * locale. i18next does not throw on a missing key — it renders the key itself
 * — so the form showed a button labelled "app.save" and nobody noticed. There
 * is no type checking across a JSON boundary, so this is the check.
 *
 * Also reports keys defined in one locale but not the other, which is how a
 * French user ends up reading English.
 *
 * Deliberately conservative about what counts as a key:
 *  · Only string literals. t(variable) and t(`tpl.${x}`) cannot be resolved
 *    statically and are skipped rather than guessed at — a false alarm that
 *    people learn to ignore is worse than no check.
 *  · i18next plural suffixes (_one/_other/_zero/…) count as defining the base
 *    key, because t('x.count', { count: n }) is a correct call.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const LOCALES = join(root, 'src/i18n/locales')
const SRC = join(root, 'src')

const PLURAL = /_(zero|one|two|few|many|other)$/

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (['.ts', '.tsx'].includes(extname(p))) out.push(p)
  }
  return out
}

/** "a.b.c" -> true if the object defines it, allowing plural suffixes at the leaf. */
function has(obj, key) {
  const parts = key.split('.')
  let cur = obj
  for (let i = 0; i < parts.length; i++) {
    if (cur === null || typeof cur !== 'object') return false
    const part = parts[i]
    if (part in cur) {
      cur = cur[part]
      continue
    }
    const isLeaf = i === parts.length - 1
    if (isLeaf && Object.keys(cur).some((k) => PLURAL.test(k) && k.replace(PLURAL, '') === part)) {
      return true
    }
    return false
  }
  return true
}

function flatten(obj, prefix = '', out = new Set()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object') flatten(v, key, out)
    else out.add(key.replace(PLURAL, ''))
  }
  return out
}

const locales = Object.fromEntries(
  readdirSync(LOCALES)
    .filter((f) => f.endsWith('.json'))
    .map((f) => [f.replace('.json', ''), JSON.parse(readFileSync(join(LOCALES, f), 'utf8'))]),
)
const names = Object.keys(locales)
if (names.length < 2) {
  console.error(`check-i18n: expected at least two locales in ${LOCALES}`)
  process.exit(1)
}

// t('a.b') / t("a.b") — the opening paren must follow `t` directly, so
// `createElement('a')` and similar cannot match.
const CALL = /\bt\(\s*['"]([a-zA-Z0-9_][a-zA-Z0-9_.]*)['"]/g

const missing = []
for (const file of walk(SRC)) {
  const text = readFileSync(file, 'utf8')
  for (const m of text.matchAll(CALL)) {
    const key = m[1]
    const absent = names.filter((n) => !has(locales[n], key))
    if (absent.length) {
      const line = text.slice(0, m.index).split('\n').length
      missing.push(`${file.slice(root.length + 1)}:${line}  ${key}  (missing: ${absent.join(', ')})`)
    }
  }
}

// Divergence between locales, independent of whether the key is used yet.
const flat = Object.fromEntries(names.map((n) => [n, flatten(locales[n])]))
const [base, ...rest] = names
const drift = []
for (const other of rest) {
  for (const k of flat[base]) if (!flat[other].has(k)) drift.push(`${k}  — in ${base}, not ${other}`)
  for (const k of flat[other]) if (!flat[base].has(k)) drift.push(`${k}  — in ${other}, not ${base}`)
}

if (missing.length) {
  console.error(`\n${missing.length} key(s) used in code but not defined:\n`)
  for (const m of missing) console.error('  ' + m)
}
if (drift.length) {
  console.error(`\n${drift.length} key(s) defined in one locale only:\n`)
  for (const d of drift) console.error('  ' + d)
}
if (missing.length || drift.length) process.exit(1)

console.log(`check-i18n: ok (${names.join(', ')})`)
