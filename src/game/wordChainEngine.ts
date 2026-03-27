/** One-letter-difference neighbors in the dictionary. */

const ATOZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export function hammingDistance(a: string, b: string): number {
  if (a.length !== b.length) return Infinity
  let d = 0
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) d++
  }
  return d
}

export function getOneLetterNeighbors(word: string, validSet: ReadonlySet<string>): string[] {
  const L = word.length
  const out: string[] = []
  for (let i = 0; i < L; i++) {
    for (let ci = 0; ci < 26; ci++) {
      const ch = ATOZ[ci]!
      if (ch === word[i]) continue
      const next = word.slice(0, i) + ch + word.slice(i + 1)
      if (validSet.has(next)) out.push(next)
    }
  }
  return out
}

/** Shortest path length in edges from `start` to `end` (0 if equal, null if unreachable). */
export function shortestEdgeDistance(
  start: string,
  end: string,
  validSet: ReadonlySet<string>,
): number | null {
  if (start === end) return 0
  const q: string[] = [start]
  const dist = new Map<string, number>([[start, 0]])
  while (q.length) {
    const w = q.shift()!
    const d = dist.get(w)!
    for (const n of getOneLetterNeighbors(w, validSet)) {
      if (dist.has(n)) continue
      const nd = d + 1
      if (n === end) return nd
      dist.set(n, nd)
      q.push(n)
    }
  }
  return null
}

/** Returns true if `end` is reachable from `from` using only dictionary words. */
export function isReachable(from: string, end: string, validSet: ReadonlySet<string>): boolean {
  return shortestEdgeDistance(from, end, validSet) !== null
}

export interface WordChainPair {
  start: string
  end: string
  /** Minimum number of guesses (edges) from start to end. */
  optimalEdges: number
  /** One shortest path from start to end (inclusive). */
  optimalPath: string[]
}

/** One shortest path from `start` to `end`, or null if unreachable. */
export function shortestPath(
  start: string,
  end: string,
  validSet: ReadonlySet<string>,
): string[] | null {
  if (start === end) return [start]
  const q: string[] = [start]
  const parent = new Map<string, string>()
  const seen = new Set<string>([start])
  let foundEnd = false
  while (q.length && !foundEnd) {
    const w = q.shift()!
    for (const n of getOneLetterNeighbors(w, validSet)) {
      if (!seen.has(n)) {
        seen.add(n)
        parent.set(n, w)
        if (n === end) {
          foundEnd = true
          break
        }
        q.push(n)
      }
    }
  }
  if (!foundEnd) return null
  const out: string[] = []
  let cur: string = end
  while (cur !== start) {
    out.push(cur)
    cur = parent.get(cur)!
  }
  out.push(start)
  return out.reverse()
}

function bfsDistancesFrom(start: string, validSet: ReadonlySet<string>): Map<string, number> {
  const dist = new Map<string, number>([[start, 0]])
  const q: string[] = [start]
  while (q.length) {
    const w = q.shift()!
    const d = dist.get(w)!
    for (const n of getOneLetterNeighbors(w, validSet)) {
      if (!dist.has(n)) {
        dist.set(n, d + 1)
        q.push(n)
      }
    }
  }
  return dist
}

/**
 * Pick start/end with a non-trivial shortest path. Retries random starts until a candidate exists.
 */
export function pickRandomSolvablePair(
  words: readonly string[],
  wordLength: number,
  rng: () => number,
): WordChainPair | null {
  const validSet = new Set<string>()
  for (const w of words) {
    if (w.length === wordLength) validSet.add(w.toUpperCase())
  }
  if (validSet.size < 2) return null

  const pool = [...validSet]
  const minEdges = wordLength <= 3 ? 2 : 3
  const maxEdges = Math.min(22, wordLength <= 3 ? 12 : 20)

  const tryPick = (min: number, attempts: number): WordChainPair | null => {
    for (let attempt = 0; attempt < attempts; attempt++) {
      const start = pool[Math.floor(rng() * pool.length)]!
      const distMap = bfsDistancesFrom(start, validSet)
      const candidates: string[] = []
      for (const w of pool) {
        if (w === start) continue
        const d = distMap.get(w)
        if (d !== undefined && d >= min && d <= maxEdges) candidates.push(w)
      }
      if (candidates.length === 0) continue
      const end = candidates[Math.floor(rng() * candidates.length)]!
      const path = shortestPath(start, end, validSet)
      if (!path) continue
      return { start, end, optimalEdges: distMap.get(end)!, optimalPath: path }
    }
    return null
  }

  return tryPick(minEdges, 100) ?? tryPick(2, 80) ?? tryPick(1, 60)
}
