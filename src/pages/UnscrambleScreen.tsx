import { useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { WordleGrid } from '../components/WordleGrid'
import { WordleKeyboard } from '../components/WordleKeyboard'
import { useUnscrambleGame } from '../game/useUnscrambleGame'
import { wordsForLength, wordLengthFromVariantId } from '../variants/variantWordLength'
import '../components/WordleGrid.css'
import './UnscrambleScreen.css'

export default function UnscrambleScreen() {
  const { variantId = '' } = useParams<{ variantId: string }>()
  const wordLength = wordLengthFromVariantId(variantId)
  const words = wordsForLength(wordLength)
  const game = useUnscrambleGame({
    words,
    wordLength,
    maxGuesses: 3,
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

  const gridPhase: 'playing' | 'won' | 'lost' =
    game.phase === 'won' ? 'won' : game.phase === 'lost' ? 'lost' : 'playing'

  const absentKeys = useMemo(() => {
    const inAnswer = new Set(game.target.split(''))
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    return [...alphabet].filter((c) => !inAnswer.has(c))
  }, [game.target])

  return (
    <div className="unscramble-screen">
      <header className="unscramble-screen-header">
        <Link to="/" className="unscramble-screen-back">
          ← Hub
        </Link>
        <h1 className="unscramble-screen-title">Unscramble ({wordLength})</h1>
        <button type="button" className="unscramble-screen-new" onClick={game.newGame}>
          New word
        </button>
      </header>

      <p className="unscramble-screen-hint">
        The green row shows how many letters the answer has, but not which letters. Keys not in the word
        are dimmed on the keyboard. {game.maxGuesses} guesses below.
      </p>

      {game.phase === 'won' && (
        <p className="unscramble-screen-banner unscramble-screen-banner--win">You got it!</p>
      )}
      {game.phase === 'lost' && (
        <p className="unscramble-screen-banner unscramble-screen-banner--lose">
          The word was <strong>{game.target}</strong>
        </p>
      )}

      <div
        className="unscramble-scramble-row"
        data-cols={wordLength}
        role="group"
        aria-label={`Answer has ${wordLength} letters; letters not shown`}
      >
        {Array.from({ length: wordLength }, (_, i) => (
          <div
            key={i}
            className="wordle-tile wordle-tile--correct wordle-tile--unscramble-blank"
            role="gridcell"
            aria-hidden
          />
        ))}
      </div>

      <WordleGrid
        wordLength={game.wordLength}
        maxGuesses={game.maxGuesses}
        guesses={game.guesses}
        buffer={game.buffer}
        phase={gridPhase}
        shake={game.shake}
      />

      <WordleKeyboard
        guesses={game.keyboardGuesses}
        disabled={keyboardDisabled}
        onKey={onScreenKey}
        plain
        absentKeys={absentKeys}
      />
    </div>
  )
}
