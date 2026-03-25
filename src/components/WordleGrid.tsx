import type { GuessRow } from '../game/useWordleGame'
import type { LetterFeedback } from '../variants/types'
import './WordleGrid.css'

function tileClass(
  feedback: LetterFeedback | undefined,
  filled: boolean,
  neutralSubmitted: boolean,
): string {
  const base = 'wordle-tile'
  if (!filled) return base
  if (!feedback) return `${base} wordle-tile--typing`
  if (neutralSubmitted) return `${base} wordle-tile--absent`
  return `${base} wordle-tile--${feedback}`
}

export interface WordleGridProps {
  wordLength: number
  maxGuesses: number
  guesses: GuessRow[]
  buffer: string
  phase: 'playing' | 'won' | 'lost'
  shake: boolean
  /** Colorless: submitted tiles look uniform (no per-letter feedback colors). */
  neutralSubmittedTiles?: boolean
}

export function WordleGrid({
  wordLength,
  maxGuesses,
  guesses,
  buffer,
  phase,
  shake,
  neutralSubmittedTiles = false,
}: WordleGridProps) {
  const currentRow = guesses.length
  const rows: { cells: string; feedback?: LetterFeedback[] }[] = []

  for (let r = 0; r < maxGuesses; r++) {
    if (r < guesses.length) {
      const g = guesses[r]!
      const fb = g.displayFeedback ?? g.feedback
      rows.push({ cells: g.letters, feedback: fb })
    } else if (r === currentRow && phase === 'playing') {
      const padded = buffer.padEnd(wordLength, ' ')
      rows.push({ cells: padded })
    } else {
      rows.push({ cells: ' '.repeat(wordLength) })
    }
  }

  return (
    <div
      className={`wordle-grid ${shake ? 'wordle-grid--shake' : ''}`}
      data-cols={wordLength}
      role="grid"
      aria-label="Guess grid"
    >
      {rows.map((row, ri) => (
        <div key={ri} className="wordle-row" role="row">
          {Array.from({ length: wordLength }, (_, i) => {
            const ch = row.cells[i] ?? ' '
            const filled = ch.trim().length > 0
            const fb = row.feedback?.[i]
            const useNeutral =
              neutralSubmittedTiles && ri < guesses.length && row.feedback !== undefined
            return (
              <div
                key={i}
                className={tileClass(fb, filled, useNeutral)}
                role="gridcell"
              >
                {filled ? ch : ''}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
