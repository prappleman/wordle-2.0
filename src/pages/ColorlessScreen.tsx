import { useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { WordleKeyboard } from '../components/WordleKeyboard'
import { useColorlessGame } from '../game/useColorlessGame'
import type { LetterFeedback } from '../variants/types'
import { wordsForLength, wordLengthFromVariantId } from '../variants/variantWordLength'
import './ColorlessScreen.css'

export default function ColorlessScreen() {
  const { variantId = '' } = useParams<{ variantId: string }>()
  const wordLength = wordLengthFromVariantId(variantId)
  const words = wordsForLength(wordLength)
  const game = useColorlessGame({
    words,
    wordLength,
    maxGuesses: 8,
  })
  const { onPhysicalKey } = game

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === 'Enter' || e.key === 'Backspace') {
        e.preventDefault()
      }
      onPhysicalKey(e.key)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onPhysicalKey])

  const keyboardDisabled = game.inputLocked

  const { absentKeys, letterHints } = useMemo(() => {
    // Only grey letters that have been guessed and are `absent` in the true feedback.
    // If a letter ever appears as correct/present, do NOT keep it grey.
    const inWord = new Set<string>()
    const absent = new Set<string>()

    for (const row of game.guesses) {
      for (let i = 0; i < row.letters.length; i++) {
        const L = row.letters[i]!.toUpperCase()
        const fb = row.feedback[i]!
        if (fb === 'correct' || fb === 'present') {
          inWord.add(L)
        } else if (fb === 'absent') {
          absent.add(L)
        }
      }
    }

    for (const L of inWord) absent.delete(L)

    const hints = new Map<string, LetterFeedback>()
    for (const L of inWord) {
      // Use "correct" to trigger the key's green styling; `ColorlessScreen.css` overrides it to white.
      hints.set(L, 'correct')
    }

    return { absentKeys: absent, letterHints: hints }
  }, [game.guesses])

  const onScreenKey = (key: string) => {
    if (key === 'Enter') {
      game.submit()
      return
    }
    if (key === 'Backspace') {
      game.backspace()
      return
    }
    game.addLetter(key)
  }

  return (
    <div className="colorless-screen">
      <header className="colorless-screen-header">
        <Link to="/" className="colorless-screen-back">
          ← Hub
        </Link>
        <h1 className="colorless-screen-title">Colorless ({wordLength})</h1>
        <button type="button" className="colorless-screen-new" onClick={game.newGame}>
          New word
        </button>
      </header>

      <p className="colorless-screen-hint">
        Any tile that would be green or yellow is white. Tiles that are not in the answer are absent (gray). No extra “in word” column.
      </p>

      {game.phase === 'won' && (
        <p className="colorless-screen-banner colorless-screen-banner--win">You got it!</p>
      )}
      {game.phase === 'lost' && (
        <p className="colorless-screen-banner colorless-screen-banner--lose">
          The word was <strong>{game.target}</strong>
        </p>
      )}

      <div
        className={`colorless-board ${game.shake ? 'colorless-board--shake' : ''}`}
        data-cols={wordLength}
        role="group"
        aria-label="Colorless board"
      >
        {Array.from({ length: game.maxGuesses }, (_, ri) => {
          const row = game.guesses[ri]
          const isCurrent = ri === game.guesses.length && game.phase === 'playing'
          const padded = game.buffer.padEnd(wordLength, ' ')
          return (
            <div key={ri} className="colorless-row">
              <div className="wordle-row">
                {Array.from({ length: wordLength }, (_, i) => {
                  const ch = row
                    ? row.letters[i] ?? ' '
                    : isCurrent
                      ? padded[i] ?? ' '
                      : ' '
                  const filled = ch.trim().length > 0
                  let tileClass = 'wordle-tile'
                  if (filled) {
                    if (row) {
                      const fb = row.feedback?.[i]
                      tileClass += fb === 'correct' || fb === 'present' ? ' wordle-tile--colorless-correct' : ' wordle-tile--absent'
                    } else {
                      tileClass += ' wordle-tile--typing'
                    }
                  }
                  return (
                    <div key={i} className={tileClass} role="gridcell">
                      {filled ? ch : ''}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <WordleKeyboard
        guesses={game.guesses}
        disabled={keyboardDisabled}
        absentKeys={absentKeys}
        letterHints={letterHints}
        onKey={onScreenKey}
      />
    </div>
  )
}
