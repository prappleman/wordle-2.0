import type { GuessRow } from '../game/useWordleGame'
import { keyboardLetterHints } from './keyboardHints'
import './WordleKeyboard.css'

const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM']

interface WordleKeyboardProps {
  guesses: GuessRow[]
  disabled: boolean
  onKey: (key: string) => void
}

export function WordleKeyboard({ guesses, disabled, onKey }: WordleKeyboardProps) {
  const hints = keyboardLetterHints(guesses)

  return (
    <div className="wordle-keyboard" aria-label="On-screen keyboard">
      {ROWS.map((row, i) => (
        <div key={row} className="wordle-keyboard-row">
          {i === 2 && (
            <button
              type="button"
              className="wordle-key wordle-key--wide"
              disabled={disabled}
              onClick={() => onKey('Enter')}
            >
              Enter
            </button>
          )}
          {row.split('').map((ch) => {
            const fb = hints.get(ch)
            const cls = ['wordle-key']
            if (fb) cls.push(`wordle-key--${fb}`)
            return (
              <button
                key={ch}
                type="button"
                className={cls.join(' ')}
                disabled={disabled}
                onClick={() => onKey(ch)}
              >
                {ch}
              </button>
            )
          })}
          {i === 2 && (
            <button
              type="button"
              className="wordle-key wordle-key--wide"
              disabled={disabled}
              onClick={() => onKey('Backspace')}
            >
              Del
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
