import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { WordleGrid } from '../components/WordleGrid'
import { WordleKeyboard } from '../components/WordleKeyboard'
import { useReverseGame } from '../game/useReverseGame'
import { wordsForLength, wordLengthFromVariantId } from '../variants/variantWordLength'
import './ClassicWordleScreen.css'
import './LockedScreen.css'

function formatElapsed(ms: number): string {
  if (ms <= 0) return '—'
  const s = ms / 1000
  if (s < 60) return `${s.toFixed(1)}s`
  const m = Math.floor(s / 60)
  const r = s - m * 60
  return `${m}m ${r.toFixed(1)}s`
}

export default function ReverseScreen() {
  const { variantId = 'reverse-5' } = useParams<{ variantId: string }>()
  const wordLength = wordLengthFromVariantId(variantId)
  const words = wordsForLength(wordLength)
  const game = useReverseGame({ words, wordLength, maxGuesses: 6 })
  const { onPhysicalKey } = game

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (game.phase !== 'playing') return
      if (e.key === 'Enter' || e.key === 'Backspace') {
        e.preventDefault()
      }
      onPhysicalKey(e.key)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onPhysicalKey, game.phase])

  const onScreenKey = (key: string) => {
    if (game.phase !== 'playing') return
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

  const started = game.phase !== 'pre'
  const showGrid = game.phase === 'pre' || started

  return (
    <div className="classic-screen">
      <header className="classic-screen-header">
        <Link to="/" className="classic-screen-back">
          ← Hub
        </Link>
        <h1 className="classic-screen-title">Reverse ({wordLength})</h1>
        <button type="button" className="classic-screen-new" onClick={game.newGame}>
          New puzzle
        </button>
      </header>

      {game.phase === 'pre' && (
        <>
          <p className="classic-screen-banner">
            Six rows show where patterns will appear—colors stay hidden until you start. The clock
            runs only while you play (lower time is better). Each guess must be a new word; match a
            row’s pattern to clear it. Clear all six to win.
          </p>
          <p className="locked-start-wrap">
            <button type="button" className="locked-start-btn" onClick={game.startGame}>
              Start
            </button>
          </p>
        </>
      )}

      {started && (
        <>
          <p className="classic-screen-banner">
            Answer: <strong>{game.target}</strong>
          </p>
          <p className="classic-screen-banner">
            Time: <strong>{formatElapsed(game.displayElapsedMs)}</strong> — lower is better. Submit
            any valid word; if it matches an open row’s color pattern, that row clears.
          </p>
        </>
      )}

      {game.phase === 'won' && (
        <p className="classic-screen-banner classic-screen-banner--win">
          Solved in <strong>{formatElapsed(game.displayElapsedMs)}</strong>
        </p>
      )}

      {showGrid && (
        <WordleGrid
          wordLength={game.wordLength}
          maxGuesses={game.maxGuesses}
          guesses={[]}
          buffer={game.buffer}
          phase={game.phase === 'won' ? 'won' : 'playing'}
          shake={game.shake}
          reverseSlots={game.filledByRow}
          emptyRowFeedback={game.expectedRows}
          reverseClearedRows={game.clearedRows}
          reverseNeutralPatternPreview={game.phase === 'pre'}
        />
      )}

      <WordleKeyboard
        guesses={[]}
        plain
        wordLetterOutline={started ? game.target : null}
        disabled={game.inputLocked}
        onKey={onScreenKey}
      />
    </div>
  )
}
