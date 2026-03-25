import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { WordleGrid } from '../components/WordleGrid'
import { WordleKeyboard } from '../components/WordleKeyboard'
import { LadderRoundMeta } from '../components/LadderRoundMeta'
import { useStreakGame } from '../game/useStreakGame'
import { useLadderRange } from '../hooks/useLadderRange'
import { nextLadderInRange } from '../variants/ladderRange'
import { wordsForLength } from '../variants/variantWordLength'
import './StreakScreen.css'

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
      prevStreakRef.current = game.streak
      return
    }
    if (game.streak > prevStreakRef.current) {
      prevStreakRef.current = game.streak
      onAdvance()
    }
  }, [game.phase, game.streak, onAdvance])

  const keyboardDisabled = game.inputLocked

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
        <button
          type="button"
          className="streak-screen-new"
          onClick={() => (game.phase === 'lost' ? onReset() : game.newRun())}
        >
          {game.phase === 'lost' ? 'Start new run' : 'Reset'}
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
          Run over. The word was <strong>{game.target}</strong>
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
  const { lo, hi } = useLadderRange(variantId)
  const [length, setLength] = useState(lo)

  return (
    <>
      <LadderRoundMeta currentLength={length} lo={lo} hi={hi} className="ladder-round-meta" />
      <StreakRound
        key={length}
        length={length}
        variantId={variantId}
        onAdvance={() => setLength((l) => nextLadderInRange(l, lo, hi, 'wrap') ?? l)}
        onReset={() => setLength(lo)}
      />
    </>
  )
}

