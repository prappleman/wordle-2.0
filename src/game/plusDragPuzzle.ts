import { scoreGuess } from './engine'
import type { LetterFeedback } from '../variants/types'
import { combineLineFeedbacks, readGridCol, readGridRow, slotKey } from './frameDragPuzzle'

export const MIDDLE_INDEX = 2
export const GRID_SIZE = 5

export type PlusPuzzle = { middleRow: string; middleCol: string }

export function isPlusCell(r: number, c: number): boolean {
  return r === MIDDLE_INDEX || c === MIDDLE_INDEX
}

/** Middle row and column only (9 cells), row-major. */
export const PLUS_SLOTS: readonly [number, number][] = (() => {
  const out: [number, number][] = []
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (isPlusCell(r, c)) out.push([r, c])
    }
  }
  return out
})()

export function solutionLetterPlus(p: PlusPuzzle, r: number, c: number): string {
  if (r === MIDDLE_INDEX) return p.middleRow[c]!
  return p.middleCol[r]!
}

export function puzzleValidPlus(p: PlusPuzzle): boolean {
  return (
    p.middleRow.length === 5 &&
    p.middleCol.length === 5 &&
    p.middleRow[MIDDLE_INDEX] === p.middleCol[MIDDLE_INDEX]
  )
}

export function plusCellRowColFeedback(
  p: PlusPuzzle,
  r: number,
  c: number,
  letters: Record<string, string>,
): LetterFeedback {
  const letter = letters[slotKey(r, c)]
  if (!letter) return 'absent'
  const target = solutionLetterPlus(p, r, c)
  if (letter === target) return 'correct'

  const parts: LetterFeedback[] = []
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

export function twoWordsPlusInDictionary(
  letters: Record<string, string>,
  wordSet: Set<string>,
): boolean {
  const row = readGridRow(letters, MIDDLE_INDEX)
  const col = readGridCol(letters, MIDDLE_INDEX)
  return !!(row && col && wordSet.has(row) && wordSet.has(col))
}

export function isPlusSolved(letters: Record<string, string>, p: PlusPuzzle): boolean {
  for (const [r, c] of PLUS_SLOTS) {
    const k = slotKey(r, c)
    const ch = letters[k]
    if (!ch || ch !== solutionLetterPlus(p, r, c)) return false
  }
  return true
}

export function pickRandomPlusPuzzle(
  words5: readonly string[],
  rng: () => number,
): PlusPuzzle | null {
  if (words5.length < 1) return null
  for (let t = 0; t < 500; t++) {
    const w1 = words5[Math.floor(rng() * words5.length)]!
    const w2 = words5[Math.floor(rng() * words5.length)]!
    if (w1[MIDDLE_INDEX] !== w2[MIDDLE_INDEX]) continue
    const puzzle: PlusPuzzle = { middleRow: w1, middleCol: w2 }
    if (puzzleValidPlus(puzzle)) return puzzle
  }
  return null
}

export const PLUS_DEFAULT_MAX_SWAPS = 22
