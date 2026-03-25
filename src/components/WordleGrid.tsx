import type { GuessRow } from '../game/useWordleGame'
import type { LetterFeedback } from '../variants/types'
import './WordleGrid.css'

function tileClass(feedback: LetterFeedback | undefined, filled: boolean): string {
  const base = 'wordle-tile'
  if (!filled) return base
  if (!feedback) return `${base} wordle-tile--typing`
  return `${base} wordle-tile--${feedback}`
}

interface WordleGridProps {
  wordLength: number
  maxGuesses: number
  guesses: GuessRow[]
  buffer: string
  phase: 'playing' | 'won' | 'lost'
  shake: boolean
}

export function WordleGrid({
  wordLength,
  maxGuesses,
  guesses,
  buffer,
  phase,
  shake,
}: WordleGridProps) {
  const currentRow = guesses.length
  const rows: { cells: string; feedback?: LetterFeedback[] }[] = []

  for (let r = 0; r < maxGuesses; r++) {
    if (r < guesses.length) {
      const g = guesses[r]!
      rows.push({ cells: g.letters, feedback: g.feedback })
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
      role="grid"
      aria-label="Guess grid"
    >
      {rows.map((row, ri) => (
        <div key={ri} className="wordle-row" role="row">
          {Array.from({ length: wordLength }, (_, i) => {
            const ch = row.cells[i] ?? ' '
            const filled = ch.trim().length > 0
            const fb = row.feedback?.[i]
            return (
              <div
                key={i}
                className={tileClass(fb, filled)}
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
