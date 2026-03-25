import { scoreGuess } from './engine'

/** Counts of correct / present / absent tiles (no per-letter positions revealed). */
export function scoreGuessAggregate(
  target: string,
  guess: string,
): { green: number; yellow: number; red: number } {
  const fb = scoreGuess(target, guess)
  let green = 0
  let yellow = 0
  let red = 0
  for (const x of fb) {
    if (x === 'correct') green++
    else if (x === 'present') yellow++
    else red++
  }
  return { green, yellow, red }
}
