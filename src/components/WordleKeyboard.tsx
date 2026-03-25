import { useMemo } from 'react'
import type { GuessRow } from '../game/useWordleGame'
import type { LetterFeedback } from '../variants/types'
import { keyboardLetterHints } from './keyboardHints'
import './WordleKeyboard.css'

const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM']

interface WordleKeyboardProps {
  guesses: GuessRow[]
  disabled: boolean
  onKey: (key: string) => void
  /** No green/yellow/gray key hints (aggregate-only games). */
  plain?: boolean
  /** Extra keys to show as absent (gray), e.g. Word 500 letters ruled out by an all-red guess. */
  absentKeys?: Iterable<string>
}

export function WordleKeyboard({ guesses, disabled, onKey, plain, absentKeys }: WordleKeyboardProps) {
  const hints: Map<string, LetterFeedback> = useMemo(() => {
    const m = plain ? new Map<string, LetterFeedback>() : keyboardLetterHints(guesses)
    if (absentKeys) {
      for (const ch of absentKeys) {
        const u = ch.toUpperCase()
        if (!m.has(u)) {
          m.set(u, 'absent')
        }
      }
    }
    return m
  }, [plain, guesses, absentKeys])

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
