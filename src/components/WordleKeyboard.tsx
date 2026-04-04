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
  /** When set, used instead of aggregating from `guesses` (e.g. misleading tile display hints). */
  letterHints?: Map<string, LetterFeedback>
  /** Extra keys to show as absent (gray), e.g. Word 500 letters ruled out by an all-red guess. */
  absentKeys?: Iterable<string>
  /** Banned letter this round: gray key + red outline; guess can’t include it on Enter. */
  bannedKey?: string | null
  /** Letters in this word get a white outline (e.g. answer letters); use with `plain` for no score colors. */
  wordLetterOutline?: string | null
  /** Forced-letter mode: this key gets an extra outline; fill still follows score colors. */
  forcedHighlightKey?: string | null
}

export function WordleKeyboard({
  guesses,
  disabled,
  onKey,
  plain,
  letterHints,
  absentKeys,
  bannedKey,
  wordLetterOutline,
  forcedHighlightKey,
}: WordleKeyboardProps) {
  const hints: Map<string, LetterFeedback> = useMemo(() => {
    const m = plain
      ? new Map<string, LetterFeedback>()
      : letterHints
        ? new Map(letterHints)
        : keyboardLetterHints(guesses)
    if (absentKeys) {
      for (const ch of absentKeys) {
        const u = ch.toUpperCase()
        if (!m.has(u)) {
          m.set(u, 'absent')
        }
      }
    }
    return m
  }, [plain, guesses, letterHints, absentKeys])

  const outlineSet = useMemo(() => {
    if (!wordLetterOutline) return null
    const s = new Set<string>()
    for (const ch of wordLetterOutline.toUpperCase()) {
      if (/[A-Z]/.test(ch)) s.add(ch)
    }
    return s
  }, [wordLetterOutline])

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
            const forced =
              forcedHighlightKey && ch.toUpperCase() === forcedHighlightKey.toUpperCase()
            const ban = Boolean(bannedKey && ch.toUpperCase() === bannedKey.toUpperCase())
            const cls = ['wordle-key']
            if (ban) cls.push('wordle-key--absent', 'wordle-key--banned')
            else if (fb) cls.push(`wordle-key--${fb}`)
            if (forced) cls.push('wordle-key--forced-outline')
            if (outlineSet?.has(ch.toUpperCase())) cls.push('wordle-key--word-outline')
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
