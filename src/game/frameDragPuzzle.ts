import { scoreGuess } from './engine'
import type { LetterFeedback } from '../variants/types'

/** 5×5 perimeter: row 0, row 4, column 0, column 4 — four five-letter words sharing corners. */

export type FramePuzzle = {
  top: string
  bottom: string
  left: string
  right: string
}

export const GRID_SIZE = 5

/**
 * All 16 unique perimeter cells, row-major (r then c).
 * Top/bottom rows are full width; left/right columns include corners once.
 */
export const PERIMETER_SLOTS: readonly [number, number][] = [
  [0, 0],
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
  [1, 0],
  [1, 4],
  [2, 0],
  [2, 4],
  [3, 0],
  [3, 4],
  [4, 0],
  [4, 1],
  [4, 2],
  [4, 3],
  [4, 4],
]

export function slotKey(r: number, c: number): string {
  return `${r},${c}`
}

export function isPerimeterCell(r: number, c: number): boolean {
  return r === 0 || r === GRID_SIZE - 1 || c === 0 || c === GRID_SIZE - 1
}

export function solutionLetter(p: FramePuzzle, r: number, c: number): string {
  if (r === 0) return p.top[c]!
  if (r === GRID_SIZE - 1) return p.bottom[c]!
  if (c === 0) return p.left[r]!
  return p.right[r]!
}

export function readGridRow(letters: Record<string, string>, r: number): string | null {
  let s = ''
  for (let cc = 0; cc < 5; cc++) {
    const ch = letters[slotKey(r, cc)]
    if (!ch) return null
    s += ch
  }
  return s
}

export function readGridCol(letters: Record<string, string>, c: number): string | null {
  let s = ''
  for (let rr = 0; rr < 5; rr++) {
    const ch = letters[slotKey(rr, c)]
    if (!ch) return null
    s += ch
  }
  return s
}

const FEEDBACK_RANK: Record<LetterFeedback, number> = {
  absent: 0,
  present: 1,
  correct: 2,
}

/**
 * For cells where multiple lines meet, take the strongest Wordle signal across those lines.
 * A letter can be gray on one line (e.g. not in that word) but yellow on another; we show yellow
 * so it doesn’t look “not in the word” when it still belongs to a crossing line.
 */
export function combineLineFeedbacks(parts: readonly LetterFeedback[]): LetterFeedback {
  if (parts.length === 0) return 'absent'
  let best: LetterFeedback = 'absent'
  for (const f of parts) {
    if (FEEDBACK_RANK[f] > FEEDBACK_RANK[best]) best = f
  }
  return best
}

/**
 * Per edge: Wordle multiset scoring on that row/column’s current letters vs target.
 * Shared corners/edges: combine with {@link combineLineFeedbacks} (correct over present over absent).
 */
export function frameCellRowColFeedback(
  p: FramePuzzle,
  r: number,
  c: number,
  letters: Record<string, string>,
): LetterFeedback {
  const letter = letters[slotKey(r, c)]
  if (!letter) return 'absent'
  const target = solutionLetter(p, r, c)
  if (letter === target) return 'correct'

  const parts: LetterFeedback[] = []

  if (r === 0) {
    const g = readGridRow(letters, 0)
    if (g) parts.push(scoreGuess(p.top, g)[c]!)
  }
  if (r === 4) {
    const g = readGridRow(letters, 4)
    if (g) parts.push(scoreGuess(p.bottom, g)[c]!)
  }
  if (c === 0) {
    const g = readGridCol(letters, 0)
    if (g) parts.push(scoreGuess(p.left, g)[r]!)
  }
  if (c === 4) {
    const g = readGridCol(letters, 4)
    if (g) parts.push(scoreGuess(p.right, g)[r]!)
  }

  return combineLineFeedbacks(parts)
}

export function puzzleValid(p: FramePuzzle): boolean {
  if (
    p.top.length !== 5 ||
    p.bottom.length !== 5 ||
    p.left.length !== 5 ||
    p.right.length !== 5
  ) {
    return false
  }
  return (
    p.left[0] === p.top[0] &&
    p.left[4] === p.bottom[0] &&
    p.right[0] === p.top[4] &&
    p.right[4] === p.bottom[4]
  )
}

/**
 * Read the four edge words: top and bottom left→right; left and right top→bottom.
 */
export function wordsFromPlacements(
  getLetter: (r: number, c: number) => string | undefined,
): { top: string; bottom: string; left: string; right: string } | null {
  let top = ''
  let bottom = ''
  let left = ''
  let right = ''
  for (let c = 0; c < 5; c++) {
    const a = getLetter(0, c)
    const b = getLetter(4, c)
    if (!a || !b) return null
    top += a
    bottom += b
  }
  for (let r = 0; r < 5; r++) {
    const a = getLetter(r, 0)
    const b = getLetter(r, 4)
    if (!a || !b) return null
    left += a
    right += b
  }
  return { top, bottom, left, right }
}

export function wordsFromLetterRecord(
  letters: Record<string, string>,
): { top: string; bottom: string; left: string; right: string } | null {
  return wordsFromPlacements((r, c) => letters[slotKey(r, c)])
}

export function fourEdgeWordsInDictionary(
  letters: Record<string, string>,
  wordSet: Set<string>,
): boolean {
  const w = wordsFromLetterRecord(letters)
  if (!w) return false
  return (
    wordSet.has(w.top) && wordSet.has(w.bottom) && wordSet.has(w.left) && wordSet.has(w.right)
  )
}

export function puzzleFourWordsInDictionary(
  p: FramePuzzle,
  wordSet: Set<string>,
): boolean {
  return (
    wordSet.has(p.top) && wordSet.has(p.bottom) && wordSet.has(p.left) && wordSet.has(p.right)
  )
}

function randomPick<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]!
}

/**
 * Random solvable frame: pick left/right columns, then any dictionary words for top/bottom
 * matching corner letters.
 */
export function pickRandomFramePuzzle(
  words5: readonly string[],
  rng: () => number = Math.random,
): FramePuzzle | null {
  const five = words5.filter((w) => w.length === 5)
  if (five.length < 4) return null
  const wordSet = new Set(five)

  const byEnds = new Map<string, string[]>()
  for (const w of five) {
    const k = `${w[0]!}|${w[4]!}`
    const list = byEnds.get(k)
    if (list) list.push(w)
    else byEnds.set(k, [w])
  }

  const maxAttempts = 8000
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const left = randomPick(five, rng)
    const right = randomPick(five, rng)
    const topKey = `${left[0]!}|${right[0]!}`
    const botKey = `${left[4]!}|${right[4]!}`
    const tops = byEnds.get(topKey)
    const bots = byEnds.get(botKey)
    if (!tops?.length || !bots?.length) continue

    const top = tops.length === 1 ? tops[0]! : randomPick(tops, rng)
    const bottom = bots.length === 1 ? bots[0]! : randomPick(bots, rng)
    const p: FramePuzzle = { top, bottom, left, right }
    if (!puzzleValid(p)) continue
    if (!puzzleFourWordsInDictionary(p, wordSet)) continue
    return p
  }
  return null
}

export function buildPoolLetters(p: FramePuzzle): string[] {
  return PERIMETER_SLOTS.map(([r, c]) => solutionLetter(p, r, c))
}

/** Solution letters in `PERIMETER_SLOTS` order (for Wordle-style multiset scoring). */
export function solutionStringInSlotOrder(p: FramePuzzle): string {
  return PERIMETER_SLOTS.map(([r, c]) => solutionLetter(p, r, c)).join('')
}

export function currentStringInSlotOrder(letters: Record<string, string>): string {
  return PERIMETER_SLOTS.map(([r, c]) => letters[slotKey(r, c)] ?? '').join('')
}

export function isFrameSolved(letters: Record<string, string>, p: FramePuzzle): boolean {
  for (const [r, c] of PERIMETER_SLOTS) {
    if (letters[slotKey(r, c)] !== solutionLetter(p, r, c)) return false
  }
  return true
}

/** 16 perimeter tiles; extra headroom for harder scrambles. */
export const DEFAULT_MAX_SWAPS = 40
