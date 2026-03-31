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
    const blocked =
      row.rowBlockedIndices && row.rowBlockedIndices.length > 0
        ? new Set(row.rowBlockedIndices)
        : row.rowBlockedIndex != null
          ? new Set([row.rowBlockedIndex])
          : null
    if (!blocked) {
      for (let i = 0; i < row.letters.length; i++) {
        const L = row.letters[i]!
        const fb = row.feedback[i]!
        const prev = m.get(L)
        if (prev === undefined) {
          m.set(L, fb)
        } else if (rank[fb] > rank[prev]) {
          m.set(L, fb)
        }
      }
      continue
    }

    // Masked rows: `letters` is short; `feedback` is full-length. Skip wildcard columns.
    let li = 0
    for (let i = 0; i < row.feedback.length; i++) {
      if (blocked.has(i)) continue
      const L = row.letters[li]
      if (!L) break
      const fb = row.feedback[i]!
      li++
      const prev = m.get(L)
      if (prev === undefined) {
        m.set(L, fb)
      } else if (rank[fb] > rank[prev]) {
        m.set(L, fb)
      }
    }
  }
  return m
}

/**
 * Misleading tile mode: keyboard matches what the grid shows (`displayFeedback`).
 * If a letter ever appears as both green and grey on the board, the key stays uncolored.
 * Otherwise correct beats present beats absent (e.g. green + yellow → green).
 */
export function keyboardLetterHintsMisleading(guesses: GuessRow[]): Map<string, LetterFeedback> {
  const byLetter = new Map<string, LetterFeedback[]>()
  for (const row of guesses) {
    const fbRow = row.displayFeedback ?? row.feedback
    for (let i = 0; i < row.letters.length; i++) {
      const L = row.letters[i]!
      const fb = fbRow[i]!
      let list = byLetter.get(L)
      if (!list) {
        list = []
        byLetter.set(L, list)
      }
      list.push(fb)
    }
  }
  const out = new Map<string, LetterFeedback>()
  for (const [L, fbs] of byLetter) {
    const merged = mergeMisleadingKeyHint(fbs)
    if (merged !== null) out.set(L, merged)
  }
  return out
}

function mergeMisleadingKeyHint(fbs: LetterFeedback[]): LetterFeedback | null {
  const seen = new Set(fbs)
  if (seen.has('correct') && seen.has('absent')) return null
  let best: LetterFeedback = 'absent'
  for (const fb of fbs) {
    if (rank[fb] > rank[best]) best = fb
  }
  return best
}
