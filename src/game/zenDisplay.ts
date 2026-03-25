import type { GuessRow } from './useWordleGame'

/** Visible window for Zen modes: fixed row count, scroll oldest guesses off the top. */
export function zenWindowGuesses(
  guesses: GuessRow[],
  buffer: string,
  visibleRows: number,
): { gridGuesses: GuessRow[]; gridBuffer: string } {
  // Reserve one row as the active typing row at the bottom.
  // After submit, that row clears and guesses shift up.
  const historyRows = Math.max(0, visibleRows - 1)
  return { gridGuesses: guesses.slice(-historyRows), gridBuffer: buffer }
}
