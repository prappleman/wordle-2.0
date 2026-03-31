import type { GuessRow } from './useWordleGame'

/** Wordle hard mode: any position that was ever correct must keep that letter. */
export function satisfiesHardMode(guess: string, guesses: GuessRow[], wordLength: number): boolean {
  for (let i = 0; i < wordLength; i++) {
    for (const row of guesses) {
      if (i >= row.feedback.length) continue
      if (row.feedback[i] === 'correct' && guess[i] !== row.letters[i]) return false
    }
  }
  return true
}
