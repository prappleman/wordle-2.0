import { useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { WordleGrid } from '../components/WordleGrid'
import { WordleKeyboard } from '../components/WordleKeyboard'
import { keyboardLetterHintsMisleading } from '../components/keyboardHints'
import { useMisleadingTileGame } from '../game/useMisleadingTileGame'
import { wordsForLength, wordLengthFromVariantId } from '../variants/variantWordLength'
import './MisleadingTileScreen.css'

export default function MisleadingTileScreen() {
  const { variantId = '' } = useParams<{ variantId: string }>()
  const wordLength = wordLengthFromVariantId(variantId)
  const words = wordsForLength(wordLength)
  const game = useMisleadingTileGame({
    words,
    wordLength,
    maxGuesses: 10,
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

  const keyboardHints = useMemo(
    () => keyboardLetterHintsMisleading(game.guesses),
    [game.guesses],
  )

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
    <div className="misleading-screen">
      <header className="misleading-screen-header">
        <Link to="/" className="misleading-screen-back">
          ← Hub
        </Link>
        <h1 className="misleading-screen-title">Misleading Tile ({wordLength})</h1>
        <button type="button" className="misleading-screen-new" onClick={game.newGame}>
          New word
        </button>
      </header>

      <p className="misleading-screen-hint">
        One tile per guess lies about its color. The keyboard matches those tile colors; if a letter
        shows both green and grey across the board, that key stays uncolored.
      </p>

      {game.phase === 'won' && (
        <p className="misleading-screen-banner misleading-screen-banner--win">You got it!</p>
      )}
      {game.phase === 'lost' && (
        <p className="misleading-screen-banner misleading-screen-banner--lose">
          The word was <strong>{game.target}</strong>
        </p>
      )}

      <WordleGrid
        wordLength={game.wordLength}
        maxGuesses={game.maxGuesses}
        guesses={game.guesses}
        buffer={game.buffer}
        phase={game.phase}
        shake={game.shake}
      />

      <WordleKeyboard
        guesses={game.guesses}
        letterHints={keyboardHints}
        disabled={keyboardDisabled}
        onKey={onScreenKey}
      />
    </div>
  )
}
