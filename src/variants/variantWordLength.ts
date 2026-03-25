import {
  WORDS_1,
  WORDS_2,
  WORDS_3,
  WORDS_4,
  WORDS_5,
  WORDS_6,
  WORDS_7,
  WORDS_8,
  WORDS_9,
  WORDS_10,
  WORDS_11,
  WORDS_12,
} from '../data/words/words12dictsGame'

/** Parse trailing `-3` … `-12` from variant ids like `colorless-5` or `growing-word-12`. */
export function wordLengthFromVariantId(variantId: string): number {
  const m = variantId.match(/-(\d+)$/)
  if (!m) return 5
  const n = Number(m[1])
  if (n >= 1 && n <= 12) return n
  return 5
}

export function wordsForLength(length: number): readonly string[] {
  switch (length) {
    case 1:
      return WORDS_1
    case 2:
      return WORDS_2
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
    case 8:
      return WORDS_8
    case 9:
      return WORDS_9
    case 10:
      return WORDS_10
    case 11:
      return WORDS_11
    case 12:
      return WORDS_12
    default:
      return WORDS_5
  }
}
