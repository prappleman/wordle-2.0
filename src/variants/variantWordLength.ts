import {
  WORDS_3,
  WORDS_4,
  WORDS_5,
  WORDS_6,
  WORDS_7,
} from '../data/words/words12dictsGame'

/** Parse trailing `-3` … `-7` from variant ids like `colorless-5`. */
export function wordLengthFromVariantId(variantId: string): number {
  const m = variantId.match(/-(\d+)$/)
  if (!m) return 5
  const n = Number(m[1])
  if (n >= 3 && n <= 7) return n
  return 5
}

export function wordsForLength(length: number): readonly string[] {
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
