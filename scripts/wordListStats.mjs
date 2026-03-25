/**
 * Backend-only: word-length stats for the bundled dictionary.
 * Not imported by the Vite app — run with: npm run words:stats
 */
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const LENGTHS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

/** Same normalization as `src/data/words/words12dictsGame.ts`. */
function cleanDictLine(line) {
  return line.trim().replace(/[#$^]+$/g, '').toLowerCase()
}

/**
 * Count unique words per length (2–12 inclusive) from raw dictionary text.
 * Only `[a-z]+` tokens are counted; duplicates per length are ignored (matches app bucketing).
 *
 * @param {string} raw - full file contents
 * @returns {Record<number, number>}
 */
export function countWordsByLength(raw) {
  /** @type {Record<number, Set<string>>} */
  const seen = {}
  for (const n of LENGTHS) {
    seen[n] = new Set()
  }

  /** @type {Record<number, number>} */
  const counts = {}
  for (const n of LENGTHS) {
    counts[n] = 0
  }

  for (const line of raw.split(/\r?\n/)) {
    const w = cleanDictLine(line)
    if (!/^[a-z]+$/.test(w)) continue
    const n = w.length
    if (n < 2 || n > 12) continue
    if (seen[n].has(w)) continue
    seen[n].add(w)
    counts[n]++
  }

  return counts
}

/** Default path to the same file the app uses (`words12dictsGame.ts` imports this). */
export function defaultDictionaryPath() {
  const here = dirname(fileURLToPath(import.meta.url))
  return join(here, '..', 'src', 'data', 'words', '12dicts-6.0.2', 'International', '3of6game.txt')
}

/**
 * @param {string} [filePath] - defaults to bundled 3of6game.txt
 * @returns {Record<number, number>}
 */
export function countWordsByLengthFromFile(filePath = defaultDictionaryPath()) {
  const raw = readFileSync(filePath, 'utf8')
  return countWordsByLength(raw)
}

function printStats(counts) {
  console.log('Word counts by length (unique [a-z] words per length, 2–12):')
  for (const n of LENGTHS) {
    console.log(`  ${n} letters: ${counts[n]}`)
  }
  const total = LENGTHS.reduce((s, n) => s + counts[n], 0)
  console.log(`  total (2–12, deduped per length): ${total}`)
}

function isMainModule() {
  const entry = process.argv[1]
  if (!entry) return false
  try {
    return pathToFileURL(resolve(entry)).href === import.meta.url
  } catch {
    return false
  }
}

if (isMainModule()) {
  const pathArg = process.argv[2]
  const counts = pathArg ? countWordsByLengthFromFile(pathArg) : countWordsByLengthFromFile()
  printStats(counts)
}
