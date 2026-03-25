import {
  WORDS_3,
  WORDS_4,
  WORDS_5,
  WORDS_6,
  WORDS_7,
} from '../data/words/words12dictsGame'

/** Board counts available in the hub for Multi mode. */
export const MULTI_BOARD_COUNTS = [2, 4, 6, 8] as const

export type MultiBoardCount = (typeof MULTI_BOARD_COUNTS)[number]

export function wordsForMultiLength(length: number): readonly string[] {
  switch (length) {
    case 3:
      return WORDS_3
    case 4:
      return WORDS_4
    case 5:
      return WORDS_5
    case 6:
      return WORDS_6
    case 7:
      return WORDS_7
    default:
      return WORDS_5
  }
}

/** Guesses scale with board count (was 9 for four boards of five letters). */
export function multiMaxGuesses(boardCount: number): number {
  return boardCount + 5
}

export function multiVariantId(wordLength: number, boardCount: number): string {
  return `multi-${wordLength}-${boardCount}`
}

export function parseMultiVariantId(
  id: string,
): { wordLength: number; boardCount: number } | null {
  const m = id.match(/^multi-(\d+)-(\d+)$/)
  if (!m) return null
  const wordLength = Number(m[1])
  const boardCount = Number(m[2])
  if (wordLength < 3 || wordLength > 7) return null
  if (!(MULTI_BOARD_COUNTS as readonly number[]).includes(boardCount)) return null
  return { wordLength, boardCount }
}
