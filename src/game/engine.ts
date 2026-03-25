import type { LetterFeedback } from '../variants/types'

/** Count of letters in the correct position (green). */
export function countPositionCorrect(feedback: readonly LetterFeedback[]): number {
  return feedback.filter((f) => f === 'correct').length
}

/** Count of letters that appear in the answer (green + yellow), Wordle multiset rules. */
export function countLettersInWord(feedback: readonly LetterFeedback[]): number {
  return feedback.filter((f) => f === 'correct' || f === 'present').length
}

/** Pick a wrong feedback value for misleading-tile mode (never equals `truth`). */
export function misleadingFeedback(truth: LetterFeedback): LetterFeedback {
  if (truth === 'correct') {
    return Math.random() < 0.5 ? 'present' : 'absent'
  }
  if (truth === 'present') {
    return Math.random() < 0.5 ? 'correct' : 'absent'
  }
  return Math.random() < 0.5 ? 'correct' : 'present'
}

export function scoreGuess(target: string, guess: string): LetterFeedback[] {
  const t = target.toUpperCase()
  const g = guess.toUpperCase()
  const result: LetterFeedback[] = Array.from({ length: g.length }, () => 'absent')
  const remaining = new Map<string, number>()

  for (let i = 0; i < t.length; i++) {
    const ch = t[i]!
    remaining.set(ch, (remaining.get(ch) ?? 0) + 1)
  }

  for (let i = 0; i < g.length; i++) {
    if (g[i] === t[i]) {
      result[i] = 'correct'
      const ch = g[i]!
      const n = remaining.get(ch) ?? 0
      remaining.set(ch, n - 1)
    }
  }

  for (let i = 0; i < g.length; i++) {
    if (result[i] === 'correct') continue
    const ch = g[i]!
    const n = remaining.get(ch) ?? 0
    if (n > 0) {
      result[i] = 'present'
      remaining.set(ch, n - 1)
    }
  }

  return result
}
