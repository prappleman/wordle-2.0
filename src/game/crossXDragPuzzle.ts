import { scoreGuess } from './engine'
import type { LetterFeedback } from '../variants/types'
import { combineLineFeedbacks, slotKey } from './frameDragPuzzle'

/**
 * Mini crossword: three across (lengths 4–6 each, left-aligned in one band) and two down (same length 5 or 6).
 * Board is built first (staggered across rows, down columns inside the intersection strip with gap—no stacked
 * parallel lines one row/column apart). Then words are chosen from length buckets to fit intersections.
 */

export type CrosswordWordLen = 4 | 5 | 6

export type CrosswordWordBuckets = Record<CrosswordWordLen, readonly string[]>

export type Crossword5Layout = {
  /** Max across width = cHi - cLo + 1 */
  gridRows: number
  gridCols: number
  rTop: number
  rMid: number
  rBot: number
  cLo: number
  cHi: number
  cLeft: number
  cRight: number
  lenTop: CrosswordWordLen
  lenMid: CrosswordWordLen
  lenBot: CrosswordWordLen
  lenDown: 5 | 6
}

export type Crossword5Puzzle = Crossword5Layout & {
  rowTop: string
  rowMid: string
  rowBot: string
  colLeft: string
  colRight: string
}

/** @deprecated fixed 7×7; use crosswordGridRows(p) / crosswordGridCols(p) */
export const CROSSWORD_ROWS = 7
/** @deprecated fixed 7×7 */
export const CROSSWORD_COLS = 7

export function crosswordGridRows(p: Crossword5Puzzle): number {
  return p.gridRows
}

export function crosswordGridCols(p: Crossword5Puzzle): number {
  return p.gridCols
}

function validDownColumnPairs(cLo: number, minAcross: number, minGap: number): [number, number][] {
  const stripHi = cLo + minAcross - 1
  const pairs: [number, number][] = []
  for (let a = cLo + 1; a <= stripHi - 1; a++) {
    for (let b = a + minGap; b <= stripHi - 1; b++) {
      pairs.push([a, b])
    }
  }
  return pairs
}

function pickLens(rng: () => number): {
  lenTop: CrosswordWordLen
  lenMid: CrosswordWordLen
  lenBot: CrosswordWordLen
  lenDown: 5 | 6
} {
  const roll = (): CrosswordWordLen => (4 + Math.floor(rng() * 3)) as CrosswordWordLen
  return {
    lenTop: roll(),
    lenMid: roll(),
    lenBot: roll(),
    lenDown: rng() < 0.5 ? 5 : 6,
  }
}

/**
 * Random topology: staggered across rows (rMid = rTop+2, rBot = rTop+lenDown-1, lenDown ∈ {5,6}),
 * column band width W = max across lengths, down columns strictly inside the all-three-rows strip with gap.
 */
export function pickRandomCrosswordLayout(rng: () => number): Crossword5Layout | null {
  const { lenTop, lenMid, lenBot, lenDown } = pickLens(rng)
  const W = Math.max(lenTop, lenMid, lenBot)
  const minA = Math.min(lenTop, lenMid, lenBot)
  const minGap = minA >= 5 ? 2 : 1

  const rTop = Math.floor(rng() * 3)
  const rMid = rTop + 2
  const rBot = rTop + lenDown - 1
  const gridRows = rBot + 2

  const cLo = Math.floor(rng() * 3)
  const cHi = cLo + W - 1
  const gridCols = cHi + 2

  const pairs = validDownColumnPairs(cLo, minA, minGap)
  if (pairs.length === 0) return null

  const [cLeft, cRight] = pairs[Math.floor(rng() * pairs.length)]!

  return {
    gridRows,
    gridCols,
    rTop,
    rMid,
    rBot,
    cLo,
    cHi,
    cLeft,
    cRight,
    lenTop,
    lenMid,
    lenBot,
    lenDown,
  }
}

/** Every letter cell: union of three across segments + two full down columns. */
export function getCrosswordSlots(p: Crossword5Puzzle): [number, number][] {
  const set = new Set<string>()
  const add = (r: number, c: number) => set.add(`${r},${c}`)
  const { rTop, rMid, rBot, cLo, cLeft, cRight, lenTop, lenMid, lenBot, lenDown } = p
  for (let c = cLo; c < cLo + lenTop; c++) add(rTop, c)
  for (let c = cLo; c < cLo + lenMid; c++) add(rMid, c)
  for (let c = cLo; c < cLo + lenBot; c++) add(rBot, c)
  const rEnd = rTop + lenDown - 1
  for (let r = rTop; r <= rEnd; r++) {
    add(r, cLeft)
    add(r, cRight)
  }
  const out: [number, number][] = []
  for (let r = 0; r < p.gridRows; r++) {
    for (let c = 0; c < p.gridCols; c++) {
      if (set.has(`${r},${c}`)) out.push([r, c])
    }
  }
  return out
}

export function isCrosswordPuzzleCell(p: Crossword5Puzzle, r: number, c: number): boolean {
  const { rTop, rMid, rBot, cLo, cLeft, cRight, lenTop, lenMid, lenBot, lenDown } = p
  if (r === rTop && c >= cLo && c < cLo + lenTop) return true
  if (r === rMid && c >= cLo && c < cLo + lenMid) return true
  if (r === rBot && c >= cLo && c < cLo + lenBot) return true
  const rEnd = rTop + lenDown - 1
  if (c === cLeft && r >= rTop && r <= rEnd) return true
  if (c === cRight && r >= rTop && r <= rEnd) return true
  return false
}

function acrossIndexAt(p: Crossword5Puzzle, r: number, c: number): { word: string; i: number } | null {
  const idx = c - p.cLo
  if (r === p.rTop && c >= p.cLo && c < p.cLo + p.lenTop) return { word: p.rowTop, i: idx }
  if (r === p.rMid && c >= p.cLo && c < p.cLo + p.lenMid) return { word: p.rowMid, i: idx }
  if (r === p.rBot && c >= p.cLo && c < p.cLo + p.lenBot) return { word: p.rowBot, i: idx }
  return null
}

function downIndexAt(p: Crossword5Puzzle, r: number, c: number): { word: string; i: number } | null {
  const j = r - p.rTop
  if (j < 0 || j >= p.lenDown) return null
  if (c === p.cLeft) return { word: p.colLeft, i: j }
  if (c === p.cRight) return { word: p.colRight, i: j }
  return null
}

export function solutionLetterCrossword(p: Crossword5Puzzle, r: number, c: number): string {
  const a = acrossIndexAt(p, r, c)
  const d = downIndexAt(p, r, c)
  if (a && d) return a.word[a.i]!
  if (a) return a.word[a.i]!
  if (d) return d.word[d.i]!
  return '?'
}

export function puzzleValidCrossword(p: Crossword5Puzzle): boolean {
  if (p.rowTop.length !== p.lenTop || p.rowMid.length !== p.lenMid || p.rowBot.length !== p.lenBot) {
    return false
  }
  if (p.colLeft.length !== p.lenDown || p.colRight.length !== p.lenDown) return false
  if (p.rMid !== p.rTop + 2 || p.rBot !== p.rTop + p.lenDown - 1) return false
  if (p.cHi !== p.cLo + Math.max(p.lenTop, p.lenMid, p.lenBot) - 1) return false

  const iL = p.cLeft - p.cLo
  const iR = p.cRight - p.cLo
  const jM = p.rMid - p.rTop
  const last = p.lenDown - 1

  if (iL < 0 || iL >= p.lenTop || iL >= p.lenMid || iL >= p.lenBot) return false
  if (iR < 0 || iR >= p.lenTop || iR >= p.lenMid || iR >= p.lenBot) return false

  if (
    p.colLeft[0] !== p.rowTop[iL] ||
    p.colLeft[jM] !== p.rowMid[iL] ||
    p.colLeft[last] !== p.rowBot[iL]
  ) {
    return false
  }
  if (
    p.colRight[0] !== p.rowTop[iR] ||
    p.colRight[jM] !== p.rowMid[iR] ||
    p.colRight[last] !== p.rowBot[iR]
  ) {
    return false
  }
  return true
}

function readAcrossRow(
  letters: Record<string, string>,
  p: Crossword5Puzzle,
  r: number,
  len: number,
): string | null {
  let s = ''
  for (let c = p.cLo; c < p.cLo + len; c++) {
    const ch = letters[slotKey(r, c)]
    if (!ch) return null
    s += ch
  }
  return s
}

function readAcross(letters: Record<string, string>, p: Crossword5Puzzle, r: number): string | null {
  if (r === p.rTop) return readAcrossRow(letters, p, r, p.lenTop)
  if (r === p.rMid) return readAcrossRow(letters, p, r, p.lenMid)
  if (r === p.rBot) return readAcrossRow(letters, p, r, p.lenBot)
  return null
}

function readDown(letters: Record<string, string>, p: Crossword5Puzzle, c: number): string | null {
  let s = ''
  const rEnd = p.rTop + p.lenDown - 1
  for (let r = p.rTop; r <= rEnd; r++) {
    const ch = letters[slotKey(r, c)]
    if (!ch) return null
    s += ch
  }
  return s
}

export function crosswordCellFeedback(
  p: Crossword5Puzzle,
  r: number,
  c: number,
  letters: Record<string, string>,
): LetterFeedback {
  const letter = letters[slotKey(r, c)]
  if (!letter) return 'absent'
  const target = solutionLetterCrossword(p, r, c)
  if (letter === target) return 'correct'

  const parts: LetterFeedback[] = []

  const a = acrossIndexAt(p, r, c)
  if (a) {
    const g = readAcross(letters, p, r)
    if (g) parts.push(scoreGuess(a.word, g)[a.i]!)
  }
  const d = downIndexAt(p, r, c)
  if (d) {
    const col = c === p.cLeft ? p.cLeft : p.cRight
    const g = readDown(letters, p, col)
    if (g) parts.push(scoreGuess(d.word, g)[d.i]!)
  }

  return combineLineFeedbacks(parts)
}

export function fiveCrosswordWordsInDictionary(
  letters: Record<string, string>,
  wordSet: Set<string>,
  p: Crossword5Puzzle,
): boolean {
  const a = readAcross(letters, p, p.rTop)
  const b = readAcross(letters, p, p.rMid)
  const c = readAcross(letters, p, p.rBot)
  const d = readDown(letters, p, p.cLeft)
  const e = readDown(letters, p, p.cRight)
  return !!(
    a &&
    b &&
    c &&
    d &&
    e &&
    wordSet.has(a) &&
    wordSet.has(b) &&
    wordSet.has(c) &&
    wordSet.has(d) &&
    wordSet.has(e)
  )
}

export function isCrosswordSolved(letters: Record<string, string>, p: Crossword5Puzzle): boolean {
  for (const [r, c] of getCrosswordSlots(p)) {
    const k = slotKey(r, c)
    const ch = letters[k]
    if (!ch || ch !== solutionLetterCrossword(p, r, c)) return false
  }
  return true
}

/**
 * Build a layout (mixed across 4–6, down 5–6), then pick words from the right length buckets for each slot.
 */
export function pickRandomCrosswordPuzzle(
  buckets: CrosswordWordBuckets,
  rng: () => number,
): Crossword5Puzzle | null {
  const maxAttempts = 20000
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const layout = pickRandomCrosswordLayout(rng)
    if (!layout) continue

    const {
      lenTop,
      lenMid,
      lenBot,
      lenDown,
      rTop,
      rMid,
      cLo,
      cLeft,
      cRight,
    } = layout
    const iL = cLeft - cLo
    const iR = cRight - cLo
    const jM = rMid - rTop
    const last = lenDown - 1

    const poolT = buckets[lenTop]
    const poolM = buckets[lenMid]
    const poolB = buckets[lenBot]
    const poolD = lenDown === 5 ? buckets[5] : buckets[6]
    if (!poolT.length || !poolM.length || !poolB.length || !poolD.length) continue

    const rowTop = poolT[Math.floor(rng() * poolT.length)]!
    const rowMid = poolM[Math.floor(rng() * poolM.length)]!
    const rowBot = poolB[Math.floor(rng() * poolB.length)]!

    const leftCandidates = poolD.filter(
      (w) =>
        w.length === lenDown &&
        w[0] === rowTop[iL] &&
        w[jM] === rowMid[iL] &&
        w[last] === rowBot[iL],
    )
    const rightCandidates = poolD.filter(
      (w) =>
        w.length === lenDown &&
        w[0] === rowTop[iR] &&
        w[jM] === rowMid[iR] &&
        w[last] === rowBot[iR],
    )
    if (!leftCandidates.length || !rightCandidates.length) continue

    const colLeft = leftCandidates[Math.floor(rng() * leftCandidates.length)]!
    const colRight = rightCandidates[Math.floor(rng() * rightCandidates.length)]!
    const p: Crossword5Puzzle = {
      ...layout,
      rowTop,
      rowMid,
      rowBot,
      colLeft,
      colRight,
    }
    if (puzzleValidCrossword(p)) return p
  }
  return null
}

/** @deprecated use pickRandomCrosswordPuzzle with buckets */
export function pickRandomCrossword5Puzzle(
  words5: readonly string[],
  rng: () => number,
): Crossword5Puzzle | null {
  const five = words5.filter((w) => w.length === 5)
  if (five.length === 0) return null
  for (let t = 0; t < 8000; t++) {
    const rTop = Math.floor(rng() * 3)
    const rMid = rTop + 2
    const rBot = rTop + 4
    const cLo = Math.floor(rng() * 3)
    const cHi = cLo + 4
    const pairs = validDownColumnPairs(cLo, 5, 2)
    const [cLeft, cRight] = pairs[Math.floor(rng() * pairs.length)]!
    const layout: Crossword5Layout = {
      gridRows: rBot + 2,
      gridCols: cHi + 2,
      rTop,
      rMid,
      rBot,
      cLo,
      cHi,
      cLeft,
      cRight,
      lenTop: 5,
      lenMid: 5,
      lenBot: 5,
      lenDown: 5,
    }
    const iL = cLeft - cLo
    const iR = cRight - cLo
    const jM = 2
    const rowTop = five[Math.floor(rng() * five.length)]!
    const rowMid = five[Math.floor(rng() * five.length)]!
    const rowBot = five[Math.floor(rng() * five.length)]!
    const leftCandidates = five.filter(
      (w) => w[0] === rowTop[iL] && w[jM] === rowMid[iL] && w[4] === rowBot[iL],
    )
    const rightCandidates = five.filter(
      (w) => w[0] === rowTop[iR] && w[jM] === rowMid[iR] && w[4] === rowBot[iR],
    )
    if (!leftCandidates.length || !rightCandidates.length) continue
    const colLeft = leftCandidates[Math.floor(rng() * leftCandidates.length)]!
    const colRight = rightCandidates[Math.floor(rng() * rightCandidates.length)]!
    const p: Crossword5Puzzle = { ...layout, rowTop, rowMid, rowBot, colLeft, colRight }
    if (puzzleValidCrossword(p)) return p
  }
  return null
}

/** @deprecated use getCrosswordSlots(puzzle) */
export const CROSSWORD_SLOTS: readonly [number, number][] = (() => {
  const p: Crossword5Puzzle = {
    gridRows: 7,
    gridCols: 7,
    rTop: 2,
    rMid: 4,
    rBot: 6,
    cLo: 1,
    cHi: 5,
    cLeft: 2,
    cRight: 4,
    lenTop: 5,
    lenMid: 5,
    lenBot: 5,
    lenDown: 5,
    rowTop: 'AAAAA',
    rowMid: 'AAAAA',
    rowBot: 'AAAAA',
    colLeft: 'AAAAA',
    colRight: 'AAAAA',
  }
  return getCrosswordSlots(p)
})()

/** @deprecated use isCrosswordPuzzleCell(puzzle, r, c) */
export function isCrosswordCell(r: number, c: number): boolean {
  return (
    ((r === 2 || r === 4 || r === 6) && c >= 1 && c <= 5) ||
    ((c === 2 || c === 4) && r >= 2 && r <= 6)
  )
}

/** @deprecated use CROSSWORD_SLOTS */
export const CROSS_X_SLOTS = CROSSWORD_SLOTS

/** @deprecated */
export type CrossXPuzzle = Crossword5Puzzle

export const solutionLetterCrossX = solutionLetterCrossword
export const puzzleValidCrossX = puzzleValidCrossword
export const crossXCellRowColFeedback = crosswordCellFeedback
export const isCrossXSolved = isCrosswordSolved
export const pickRandomCrossXPuzzle = pickRandomCrossword5Puzzle

export function twoWordsCrossXInDictionary(
  letters: Record<string, string>,
  wordSet: Set<string>,
  p: Crossword5Puzzle,
): boolean {
  return fiveCrosswordWordsInDictionary(letters, wordSet, p)
}

export const CROSS_X_DEFAULT_MAX_SWAPS = 48
