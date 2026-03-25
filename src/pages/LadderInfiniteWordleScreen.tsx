import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { LadderRoundMeta } from '../components/LadderRoundMeta'
import { WordleGrid } from '../components/WordleGrid'
import { WordleKeyboard } from '../components/WordleKeyboard'
import { useInfiniteWordleGame } from '../game/useInfiniteWordleGame'
import { useLadderRange } from '../hooks/useLadderRange'
import { nextLadderInRange } from '../variants/ladderRange'
import { wordsForLength } from '../variants/variantWordLength'
import './InfiniteWordleScreen.css'

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
    // In infinite mode, we slide only after a correct word; trigger ladder advance when slide count increases.
    if (game.slides !== prevSlidesRef.current) {
      prevSlidesRef.current = game.slides
      if (game.slides > 0) onAdvance()
    }
  }, [game.phase, game.slides, onAdvance])

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
        <button
          type="button"
          className="infinite-screen-new"
          onClick={() => (game.phase === 'lost' ? onReset() : game.newGame())}
        >
          {game.phase === 'lost' ? 'Start new run' : 'Reset'}
        </button>
      </header>

      <p className="infinite-screen-hint">
        Six rows per round. Solve to slide, then this ladder moves to the next length.
      </p>

      {game.phase === 'lost' && (
        <p className="infinite-screen-banner infinite-screen-banner--lose">
          Run over. The word was <strong>{game.target}</strong>
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
  const { lo, hi } = useLadderRange(variantId)

  const [length, setLength] = useState(lo)

  return (
    <>
      <LadderRoundMeta currentLength={length} lo={lo} hi={hi} className="ladder-round-meta" />
      <InfiniteRound
        key={length}
        length={length}
        onAdvance={() => setLength((l) => nextLadderInRange(l, lo, hi, 'wrap') ?? l)}
        onReset={() => setLength(lo)}
      />
    </>
  )
}

