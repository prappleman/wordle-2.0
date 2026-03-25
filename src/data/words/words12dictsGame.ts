import dictRaw from './12dicts-6.0.2/International/3of6game.txt?raw'

/** Strip trailing markers used in some wordlist lines. */
function clean12dictsLine(line: string): string {
  return line.trim().replace(/[#$^]+$/g, '').toLowerCase()
}

type DictWordLength = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

const ALL_LENS: DictWordLength[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

function buildLengthBuckets(raw: string): Record<DictWordLength, readonly string[]> {
  const buckets = Object.fromEntries(ALL_LENS.map((n) => [n, [] as string[]])) as Record<
    DictWordLength,
    string[]
  >
  const seen = Object.fromEntries(ALL_LENS.map((n) => [n, new Set<string>()])) as Record<
    DictWordLength,
    Set<string>
  >

  for (const line of raw.split(/\r?\n/)) {
    const w = clean12dictsLine(line)
    if (!/^[a-z]+$/.test(w)) continue
    const n = w.length
    if (n < 1 || n > 12) continue
    const len = n as DictWordLength
    if (seen[len].has(w)) continue
    seen[len].add(w)
    buckets[len].push(w)
  }

  return buckets
}

const buckets = buildLengthBuckets(dictRaw)

/** 3of6game — filtered by length (1–12). */
export const WORDS_1 = buckets[1]
export const WORDS_2 = buckets[2]
export const WORDS_3 = buckets[3]
export const WORDS_4 = buckets[4]
export const WORDS_5 = buckets[5]
export const WORDS_6 = buckets[6]
export const WORDS_7 = buckets[7]
export const WORDS_8 = buckets[8]
export const WORDS_9 = buckets[9]
export const WORDS_10 = buckets[10]
export const WORDS_11 = buckets[11]
export const WORDS_12 = buckets[12]
