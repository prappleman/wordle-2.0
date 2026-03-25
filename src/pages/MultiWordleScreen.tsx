import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { WordleGrid } from '../components/WordleGrid'
import { WordleKeyboard } from '../components/WordleKeyboard'
import { useMultiWordleGame } from '../game/useMultiWordleGame'
import { WORDS_5 } from '../data/words/words12dictsGame'
import './MultiWordleScreen.css'

const MULTI_CONFIG = {
  words: WORDS_5,
  wordLength: 5,
  maxGuesses: 9,
  boardCount: 4,
} as const

export default function MultiWordleScreen() {
  const game = useMultiWordleGame(MULTI_CONFIG)
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

  const keyboardDisabled = game.phase !== 'playing'

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
    <div className="multi-wordle">
      <header className="multi-wordle-header">
        <Link to="/" className="multi-wordle-back">
          ← Hub
        </Link>
        <h1 className="multi-wordle-title">Quad (4 × 5)</h1>
        <button type="button" className="multi-wordle-new" onClick={game.newGame}>
          New game
        </button>
      </header>

      <p className="multi-wordle-hint">
        One guess applies to every unsolved grid. Solve all four words in {game.maxGuesses} tries.
      </p>

      {game.phase === 'won' && (
        <p className="multi-wordle-banner multi-wordle-banner--win">All four words solved.</p>
      )}
      {game.phase === 'lost' && (
        <div className="multi-wordle-banner multi-wordle-banner--lose">
          <p>Out of guesses. Unsolved words:</p>
          <ul className="multi-wordle-answers">
            {game.solved.map((done, i) =>
              done ? null : (
                <li key={i}>
                  Board {i + 1}: <strong>{game.targets[i]}</strong>
                </li>
              ),
            )}
          </ul>
        </div>
      )}

      <div className="multi-wordle-boards">
        {game.guessesByBoard.map((guesses, i) => {
          const gridPhase = game.solved[i]
            ? 'won'
            : game.phase === 'lost'
              ? 'lost'
              : 'playing'
          return (
            <div key={i} className="multi-wordle-board">
              <WordleGrid
                wordLength={game.wordLength}
                maxGuesses={game.maxGuesses}
                guesses={guesses}
                buffer={game.buffer}
                phase={gridPhase}
                shake={game.shake}
              />
            </div>
          )
        })}
      </div>

      <WordleKeyboard
        guesses={game.keyboardGuesses}
        disabled={keyboardDisabled}
        onKey={onScreenKey}
      />
    </div>
  )
}
