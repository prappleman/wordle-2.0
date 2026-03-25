import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { WordleGrid } from '../components/WordleGrid'
import { WordleKeyboard } from '../components/WordleKeyboard'
import { keyboardLetterHintsMisleading } from '../components/keyboardHints'
import { useMisleadingTileGame } from '../game/useMisleadingTileGame'
import { wordsForLength, wordLengthFromVariantId } from '../variants/variantWordLength'
import './MisleadingTileScreen.css'

function nextLadderLength(len: number) {
  return len === 7 ? 3 : len + 1
}

function MisleadingRound({
  length,
  onAdvance,
  onReset,
}: {
  length: number
  onAdvance: () => void
  onReset: () => void
}) {
  const words = wordsForLength(length)
  const game = useMisleadingTileGame({ words, wordLength: length, maxGuesses: 10 })
  const { onPhysicalKey } = game

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === 'Enter' || e.key === 'Backspace') e.preventDefault()
      onPhysicalKey(e.key)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onPhysicalKey])

  useEffect(() => {
    if (game.phase === 'won') onAdvance()
    if (game.phase === 'lost') onReset()
  }, [game.phase, onAdvance, onReset])

  const keyboardDisabled = game.phase !== 'playing'
  const keyboardHints = useMemo(
    () => keyboardLetterHintsMisleading(game.guesses),
    [game.guesses],
  )

  const onScreenKey = (key: string) => {
    if (key === 'Enter') return game.submit()
    if (key === 'Backspace') return game.backspace()
    return game.addLetter(key)
  }

  return (
    <div className="misleading-screen">
      <header className="misleading-screen-header">
        <Link to="/" className="misleading-screen-back">
          ← Hub
        </Link>
        <h1 className="misleading-screen-title">Misleading Tile ({length}) · Ladder</h1>
        <button type="button" className="misleading-screen-new" onClick={game.newGame}>
          Reset
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

export default function LadderMisleadingTileScreen() {
  const { variantId = '' } = useParams<{ variantId: string }>()
  const startLength = wordLengthFromVariantId(variantId)
  const [length, setLength] = useState(startLength)

  return (
    <MisleadingRound
      key={length}
      length={length}
      onAdvance={() => setLength((l) => nextLadderLength(l))}
      onReset={() => setLength(startLength)}
    />
  )
}

