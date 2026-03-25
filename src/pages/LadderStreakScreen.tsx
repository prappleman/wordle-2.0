import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { WordleGrid } from '../components/WordleGrid'
import { WordleKeyboard } from '../components/WordleKeyboard'
import { useStreakGame } from '../game/useStreakGame'
import { wordsForLength, wordLengthFromVariantId } from '../variants/variantWordLength'
import './StreakScreen.css'

function nextLadderLength(len: number) {
  return len === 7 ? 3 : len + 1
}

function StreakRound({
  length,
  variantId,
  onAdvance,
  onReset,
}: {
  length: number
  variantId: string
  onAdvance: () => void
  onReset: () => void
}) {
  const words = wordsForLength(length)
  const game = useStreakGame({ words, wordLength: length, maxGuesses: 6, variantId })
  const { onPhysicalKey } = game

  const prevStreakRef = useRef(game.streak)

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
    if (game.phase === 'lost') {
      onReset()
      return
    }
    // In Streak mode, phase never becomes "won"; instead streak increments on every successful word.
    if (game.streak > prevStreakRef.current) {
      prevStreakRef.current = game.streak
      onAdvance()
    }
  }, [game.phase, game.streak, onAdvance, onReset])

  const keyboardDisabled = game.phase !== 'playing'

  const onScreenKey = (key: string) => {
    if (key === 'Enter') return game.submit()
    if (key === 'Backspace') return game.backspace()
    return game.addLetter(key)
  }

  return (
    <div className="streak-screen">
      <header className="streak-screen-header">
        <Link to="/" className="streak-screen-back">
          ← Hub
        </Link>
        <h1 className="streak-screen-title">Streak ({length}) · Ladder</h1>
        <button type="button" className="streak-screen-new" onClick={game.newRun}>
          Reset
        </button>
      </header>

      <p className="streak-screen-meta">
        Streak: <strong>{game.streak}</strong> · Best: <strong>{game.best}</strong>
      </p>

      <p className="streak-screen-hint">
        Six guesses per word. Solve to advance to the next ladder length. One failure ends the run.
      </p>

      {game.phase === 'lost' && (
        <p className="streak-screen-banner streak-screen-banner--lose">
          Run ended. The word was <strong>{game.target}</strong>
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

      <WordleKeyboard guesses={game.guesses} disabled={keyboardDisabled} onKey={onScreenKey} />
    </div>
  )
}

export default function LadderStreakScreen() {
  const { variantId = '' } = useParams<{ variantId: string }>()
  const startLength = wordLengthFromVariantId(variantId)
  const [length, setLength] = useState(startLength)

  return (
    <StreakRound
      key={length}
      length={length}
      variantId={variantId}
      onAdvance={() => setLength((l) => nextLadderLength(l))}
      onReset={() => setLength(startLength)}
    />
  )
}

