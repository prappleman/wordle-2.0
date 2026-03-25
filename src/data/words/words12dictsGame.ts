import dictRaw from './12dicts-6.0.2/International/3of6game.txt?raw'

/** Strip trailing markers used in some 12dicts wordlist lines. */
function clean12dictsLine(line: string): string {
  return line.trim().replace(/[#$^]+$/g, '').toLowerCase()
}

type DictWordLength = 3 | 4 | 5 | 6 | 7

function buildLengthBuckets(raw: string): Record<DictWordLength, readonly string[]> {
  const buckets = {
    3: [] as string[],
    4: [] as string[],
    5: [] as string[],
    6: [] as string[],
    7: [] as string[],
  }
  const seen: Record<DictWordLength, Set<string>> = {
    3: new Set(),
    4: new Set(),
    5: new Set(),
    6: new Set(),
    7: new Set(),
  }

  for (const line of raw.split(/\r?\n/)) {
    const w = clean12dictsLine(line)
    if (!/^[a-z]+$/.test(w)) continue
    const n = w.length
    if (n !== 3 && n !== 4 && n !== 5 && n !== 6 && n !== 7) continue
    const len = n as DictWordLength
    if (seen[len].has(w)) continue
    seen[len].add(w)
    buckets[len].push(w)
  }

  return buckets
}

const buckets = buildLengthBuckets(dictRaw)

/** 12dicts 3of6game — filtered by length (3–7). */
export const WORDS_3 = buckets[3]
export const WORDS_4 = buckets[4]
export const WORDS_5 = buckets[5]
export const WORDS_6 = buckets[6]
export const WORDS_7 = buckets[7]
