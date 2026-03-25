import type { LetterFeedback } from '../variants/types'

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
