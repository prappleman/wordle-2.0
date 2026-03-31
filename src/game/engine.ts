import type { LetterFeedback } from '../variants/types'

/** True if some letter appears at least twice (e.g. POOLS, SNAGS). */
export function hasDoubleLetter(word: string): boolean {
  const u = word.toUpperCase()
  const seen = new Set<string>()
  for (const ch of u) {
    if (seen.has(ch)) return true
    seen.add(ch)
  }
  return false
}

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

/** Green only where guess matches target at that index; otherwise absent (no yellow). */
export function scoreGuessGreenOnly(target: string, guess: string): LetterFeedback[] {
  const t = target.toUpperCase()
  const g = guess.toUpperCase()
  return Array.from({ length: g.length }, (_, i) => (g[i] === t[i] ? 'correct' : 'absent'))
}

/**
 * Wordle scoring when one board position is a wildcard (no typed letter there).
 * `guessShort` has length `target.length - 1`; letters map to target indices in order, skipping `blockedIndex`.
 */
export function scoreGuessMasked(
  target: string,
  guessShort: string,
  blockedIndex: number,
): LetterFeedback[] {
  const t = target.toUpperCase()
  const g = guessShort.toUpperCase()
  const N = t.length
  if (blockedIndex < 0 || blockedIndex >= N) {
    throw new Error('scoreGuessMasked: invalid blockedIndex')
  }
  if (g.length !== N - 1) {
    throw new Error('scoreGuessMasked: guess length must be target length minus one')
  }

  const result: LetterFeedback[] = Array.from({ length: N }, () => 'absent')

  const guessAt: (string | undefined)[] = Array.from({ length: N }, () => undefined)
  let gi = 0
  for (let i = 0; i < N; i++) {
    if (i === blockedIndex) continue
    guessAt[i] = g[gi++]!
  }

  const remaining = new Map<string, number>()
  for (let i = 0; i < N; i++) {
    const ch = t[i]!
    remaining.set(ch, (remaining.get(ch) ?? 0) + 1)
  }

  for (let i = 0; i < N; i++) {
    if (i === blockedIndex) continue
    const ch = guessAt[i]!
    if (ch === t[i]) {
      result[i] = 'correct'
      remaining.set(ch, (remaining.get(ch) ?? 0) - 1)
    }
  }

  for (let i = 0; i < N; i++) {
    if (i === blockedIndex) continue
    if (result[i] === 'correct') continue
    const ch = guessAt[i]!
    const n = remaining.get(ch) ?? 0
    if (n > 0) {
      result[i] = 'present'
      remaining.set(ch, n - 1)
    }
  }

  return result
}

/**
 * Wordle scoring when multiple board positions are blocked (no typed letter there).
 * `guessShort` has length `target.length - blockedIndices.length`; letters map to target
 * indices in column order, skipping each blocked index.
 */
export function scoreGuessMaskedMulti(
  target: string,
  guessShort: string,
  blockedIndices: readonly number[],
): LetterFeedback[] {
  const t = target.toUpperCase()
  const g = guessShort.toUpperCase()
  const N = t.length
  const blocked = new Set(blockedIndices)
  if (g.length !== N - blocked.size) {
    throw new Error('scoreGuessMaskedMulti: guess length mismatch')
  }

  const result: LetterFeedback[] = Array.from({ length: N }, () => 'absent')

  const guessAt: (string | undefined)[] = Array.from({ length: N }, () => undefined)
  let gi = 0
  for (let i = 0; i < N; i++) {
    if (blocked.has(i)) continue
    guessAt[i] = g[gi++]!
  }

  const remaining = new Map<string, number>()
  for (let i = 0; i < N; i++) {
    const ch = t[i]!
    remaining.set(ch, (remaining.get(ch) ?? 0) + 1)
  }

  for (let i = 0; i < N; i++) {
    if (blocked.has(i)) continue
    const ch = guessAt[i]!
    if (ch === t[i]) {
      result[i] = 'correct'
      remaining.set(ch, (remaining.get(ch) ?? 0) - 1)
    }
  }

  for (let i = 0; i < N; i++) {
    if (blocked.has(i)) continue
    if (result[i] === 'correct') continue
    const ch = guessAt[i]!
    const n = remaining.get(ch) ?? 0
    if (n > 0) {
      result[i] = 'present'
      remaining.set(ch, n - 1)
    }
  }

  return result
}

/**
 * True if typed letters match `fullWord` at every position except `wildcardIndex`
 * (that slot may be any letter). `guessShort` has length `fullWord.length - 1`.
 */
export function matchesWildcardPattern(
  guessShort: string,
  fullWord: string,
  wildcardIndex: number,
): boolean {
  const t = fullWord.toUpperCase()
  const g = guessShort.toUpperCase()
  let gi = 0
  for (let i = 0; i < t.length; i++) {
    if (i === wildcardIndex) continue
    if (gi >= g.length || g[gi] !== t[i]) return false
    gi++
  }
  return gi === g.length
}

/** True if some word in `validSet` matches `guessShort` with a wildcard at `wildcardIndex`. */
export function isValidWildcardGuess(
  guessShort: string,
  wildcardIndex: number,
  validSet: ReadonlySet<string>,
): boolean {
  const g = guessShort.toUpperCase()
  for (const w of validSet) {
    if (matchesWildcardPattern(g, w, wildcardIndex)) return true
  }
  return false
}

/**
 * Like `matchesWildcardPattern`, but supports multiple wildcard indices.
 * `guessShort` has length `fullWord.length - wildcardIndices.length`.
 */
export function matchesWildcardPatternMulti(
  guessShort: string,
  fullWord: string,
  wildcardIndices: readonly number[],
): boolean {
  const t = fullWord.toUpperCase()
  const g = guessShort.toUpperCase()
  const wild = new Set(wildcardIndices)
  let gi = 0
  for (let i = 0; i < t.length; i++) {
    if (wild.has(i)) continue
    if (gi >= g.length || g[gi] !== t[i]) return false
    gi++
  }
  return gi === g.length
}

/** True if some word in `validSet` matches `guessShort` with wildcards at `wildcardIndices`. */
export function isValidWildcardGuessMulti(
  guessShort: string,
  wildcardIndices: readonly number[],
  validSet: ReadonlySet<string>,
): boolean {
  const g = guessShort.toUpperCase()
  for (const w of validSet) {
    if (matchesWildcardPatternMulti(g, w, wildcardIndices)) return true
  }
  return false
}
