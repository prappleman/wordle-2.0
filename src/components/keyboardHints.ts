import type { GuessRow } from '../game/useWordleGame'
import type { LetterFeedback } from '../variants/types'

const rank: Record<LetterFeedback, number> = {
  absent: 0,
  present: 1,
  correct: 2,
}

export function keyboardLetterHints(guesses: GuessRow[]): Map<string, LetterFeedback> {
  const m = new Map<string, LetterFeedback>()
  for (const row of guesses) {
    for (let i = 0; i < row.letters.length; i++) {
      const L = row.letters[i]!
      const fb = row.feedback[i]!
      const prev = m.get(L) ?? 'absent'
      if (rank[fb] > rank[prev]) {
        m.set(L, fb)
      }
    }
  }
  return m
}
