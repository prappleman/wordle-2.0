import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { WordleGrid } from '../components/WordleGrid'
import { WordleKeyboard } from '../components/WordleKeyboard'
import { useInfiniteWordleGame } from '../game/useInfiniteWordleGame'
import { wordsForLength, wordLengthFromVariantId } from '../variants/variantWordLength'
import './InfiniteWordleScreen.css'

function nextLadderLength(len: number) {
  return len === 7 ? 3 : len + 1
}

function InfiniteRound({
  length,
  onAdvance,
  onReset,
}: {
  length: number
  onAdvance: () => void
  onReset: () => void
}) {
  const words = wordsForLength(length)
  const game = useInfiniteWordleGame({ words, wordLength: length })
  const { onPhysicalKey } = game

  const prevSlidesRef = useRef(game.slides)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (game.inputLocked) return
      if (e.key === 'Enter' || e.key === 'Backspace') {
        e.preventDefault()
      }
      onPhysicalKey(e.key)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onPhysicalKey, game.inputLocked])

  useEffect(() => {
    if (game.phase === 'lost') {
      onReset()
      return
    }
    // In infinite mode, we slide only after a correct word; trigger ladder advance when slide count increases.
    if (game.slides !== prevSlidesRef.current) {
      prevSlidesRef.current = game.slides
      if (game.slides > 0) onAdvance()
    }
  }, [game.phase, game.slides, onAdvance, onReset])

  const onScreenKey = (key: string) => {
    if (game.inputLocked) return
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
    <div className="infinite-screen">
      <header className="infinite-screen-header">
        <Link to="/" className="infinite-screen-back">
          ← Hub
        </Link>
        <h1 className="infinite-screen-title">Infinite ({length}) · Ladder</h1>
        <button type="button" className="infinite-screen-new" onClick={game.newGame}>
          Reset
        </button>
      </header>

      <p className="infinite-screen-hint">
        Six rows per round. Solve to slide, then this ladder moves to the next length.
      </p>

      {game.phase === 'lost' && (
        <p className="infinite-screen-banner infinite-screen-banner--lose">
          Out of guesses. The word was <strong>{game.target}</strong>
        </p>
      )}

      <WordleGrid
        wordLength={game.wordLength}
        maxGuesses={game.maxGuesses}
        guesses={game.guesses}
        buffer={game.buffer}
        phase={game.gridPhase}
        shake={game.shake}
      />

      <WordleKeyboard guesses={game.guesses} disabled={game.inputLocked} onKey={onScreenKey} />
    </div>
  )
}

export default function LadderInfiniteWordleScreen() {
  const { variantId = '' } = useParams<{ variantId: string }>()
  const startLength = wordLengthFromVariantId(variantId)

  const [length, setLength] = useState(startLength)

  return (
    <InfiniteRound
      key={length}
      length={length}
      onAdvance={() => setLength((l) => nextLadderLength(l))}
      onReset={() => setLength(startLength)}
    />
  )
}

