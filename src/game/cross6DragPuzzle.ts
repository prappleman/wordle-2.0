import { scoreGuess } from './engine'
import type { LetterFeedback } from '../variants/types'
import {
  combineLineFeedbacks,
  pickRandomFramePuzzle,
  puzzleValid as framePuzzleValid,
  readGridCol,
  readGridRow,
  slotKey,
  type FramePuzzle,
} from './frameDragPuzzle'

/** Middle row (index 2) and middle column (index 2) on a 5×5 grid. */
export const MIDDLE_INDEX = 2

export type Cross6Puzzle = FramePuzzle & {
  middleRow: string
  middleCol: string
}

export const GRID_SIZE = 5

export function isCross6PlayCell(r: number, c: number): boolean {
  return (
    r === 0 ||
    r === GRID_SIZE - 1 ||
    r === MIDDLE_INDEX ||
    c === 0 ||
    c === GRID_SIZE - 1 ||
    c === MIDDLE_INDEX
  )
}

/** All playable cells, row-major (21 cells). */
export const CROSS6_SLOTS: readonly [number, number][] = (() => {
  const out: [number, number][] = []
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (isCross6PlayCell(r, c)) out.push([r, c])
    }
  }
  return out
})()

/**
 * Letter at (r,c): perimeter rows/cols first, then middle row (r===2), then middle column (c===2).
 * On a valid puzzle all definitions agree at overlaps.
 */
export function solutionLetterCross6(p: Cross6Puzzle, r: number, c: number): string {
  if (r === 0) return p.top[c]!
  if (r === GRID_SIZE - 1) return p.bottom[c]!
  if (c === 0) return p.left[r]!
  if (c === GRID_SIZE - 1) return p.right[r]!
  if (r === MIDDLE_INDEX) return p.middleRow[c]!
  return p.middleCol[r]!
}

export function cross6CellRowColFeedback(
  p: Cross6Puzzle,
  r: number,
  c: number,
  letters: Record<string, string>,
): LetterFeedback {
  const letter = letters[slotKey(r, c)]
  if (!letter) return 'absent'
  const target = solutionLetterCross6(p, r, c)
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
  if (r === MIDDLE_INDEX) {
    const g = readGridRow(letters, MIDDLE_INDEX)
    if (g) parts.push(scoreGuess(p.middleRow, g)[c]!)
  }
  if (c === MIDDLE_INDEX) {
    const g = readGridCol(letters, MIDDLE_INDEX)
    if (g) parts.push(scoreGuess(p.middleCol, g)[r]!)
  }

  return combineLineFeedbacks(parts)
}

export function puzzleValidCross6(p: Cross6Puzzle): boolean {
  if (
    !framePuzzleValid(p) ||
    p.middleRow.length !== 5 ||
    p.middleCol.length !== 5
  ) {
    return false
  }
  return (
    p.middleRow[0] === p.left[MIDDLE_INDEX] &&
    p.middleRow[4] === p.right[MIDDLE_INDEX] &&
    p.middleCol[0] === p.top[MIDDLE_INDEX] &&
    p.middleCol[4] === p.bottom[MIDDLE_INDEX] &&
    p.middleRow[MIDDLE_INDEX] === p.middleCol[MIDDLE_INDEX]
  )
}

/** Read six words: rows left→right, columns top→bottom. */
export function sixWordsFromPlacements(
  getLetter: (r: number, c: number) => string | undefined,
): {
  top: string
  bottom: string
  left: string
  right: string
  middleRow: string
  middleCol: string
} | null {
  let top = ''
  let bottom = ''
  let left = ''
  let right = ''
  let middleRow = ''
  let middleCol = ''
  for (let c = 0; c < 5; c++) {
    const a = getLetter(0, c)
    const b = getLetter(4, c)
    const m = getLetter(MIDDLE_INDEX, c)
    if (!a || !b || !m) return null
    top += a
    bottom += b
    middleRow += m
  }
  for (let r = 0; r < 5; r++) {
    const a = getLetter(r, 0)
    const b = getLetter(r, 4)
    const m = getLetter(r, MIDDLE_INDEX)
    if (!a || !b || !m) return null
    left += a
    right += b
    middleCol += m
  }
  return { top, bottom, left, right, middleRow, middleCol }
}

export function sixWordsFromLetterRecord(
  letters: Record<string, string>,
): ReturnType<typeof sixWordsFromPlacements> {
  return sixWordsFromPlacements((r, c) => letters[slotKey(r, c)])
}

export function sixWordsInDictionary(letters: Record<string, string>, wordSet: Set<string>): boolean {
  const w = sixWordsFromLetterRecord(letters)
  if (!w) return false
  return (
    wordSet.has(w.top) &&
    wordSet.has(w.bottom) &&
    wordSet.has(w.left) &&
    wordSet.has(w.right) &&
    wordSet.has(w.middleRow) &&
    wordSet.has(w.middleCol)
  )
}

export function puzzleSixWordsInDictionary(p: Cross6Puzzle, wordSet: Set<string>): boolean {
  return (
    wordSet.has(p.top) &&
    wordSet.has(p.bottom) &&
    wordSet.has(p.left) &&
    wordSet.has(p.right) &&
    wordSet.has(p.middleRow) &&
    wordSet.has(p.middleCol)
  )
}

/**
 * Pick a valid 4-word frame, then middle row and middle column words that agree at the center.
 */
export function pickRandomCross6Puzzle(
  words5: readonly string[],
  rng: () => number = Math.random,
): Cross6Puzzle | null {
  const five = words5.filter((w) => w.length === 5)
  const wordSet = new Set(five)

  const byEnds = new Map<string, string[]>()
  for (const w of five) {
    const k = `${w[0]!}|${w[4]!}`
    const list = byEnds.get(k)
    if (list) list.push(w)
    else byEnds.set(k, [w])
  }

  for (let attempt = 0; attempt < 6000; attempt++) {
    const base = pickRandomFramePuzzle(words5, rng)
    if (!base) continue

    const lr = base.left[MIDDLE_INDEX]!
    const rr = base.right[MIDDLE_INDEX]!
    const tc = base.top[MIDDLE_INDEX]!
    const bc = base.bottom[MIDDLE_INDEX]!

    const rowKey = `${lr}|${rr}`
    const colKey = `${tc}|${bc}`
    const midRows = byEnds.get(rowKey)
    const midCols = byEnds.get(colKey)
    if (!midRows?.length || !midCols?.length) continue

    const shuffledRows = [...midRows]
    const shuffledCols = [...midCols]
    for (let i = shuffledRows.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      ;[shuffledRows[i], shuffledRows[j]] = [shuffledRows[j]!, shuffledRows[i]!]
    }
    for (let i = shuffledCols.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1))
      ;[shuffledCols[i], shuffledCols[j]] = [shuffledCols[j]!, shuffledCols[i]!]
    }

    let found: Cross6Puzzle | null = null
    for (const middleRow of shuffledRows) {
      const center = middleRow[MIDDLE_INDEX]!
      const match = shuffledCols.find((mc) => mc[MIDDLE_INDEX] === center)
      if (match) {
        found = { ...base, middleRow, middleCol: match }
        break
      }
    }
    if (!found) {
      for (const middleCol of shuffledCols) {
        const center = middleCol[MIDDLE_INDEX]!
        const match = midRows.find((mr) => mr[MIDDLE_INDEX] === center)
        if (match) {
          found = { ...base, middleRow: match, middleCol }
          break
        }
      }
    }

    if (!found) continue
    if (!puzzleValidCross6(found)) continue
    if (!puzzleSixWordsInDictionary(found, wordSet)) continue
    return found
  }
  return null
}

export function isCross6Solved(letters: Record<string, string>, p: Cross6Puzzle): boolean {
  for (const [r, c] of CROSS6_SLOTS) {
    if (letters[slotKey(r, c)] !== solutionLetterCross6(p, r, c)) return false
  }
  return true
}

/** 21 tiles; more swaps than the 4-word frame. */
export const CROSS6_DEFAULT_MAX_SWAPS = 52
