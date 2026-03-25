import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { WordleGrid } from '../components/WordleGrid'
import { WordleKeyboard } from '../components/WordleKeyboard'
import { useStreakGame } from '../game/useStreakGame'
import { wordsForLength, wordLengthFromVariantId } from '../variants/variantWordLength'
import './StreakScreen.css'

export default function StreakScreen() {
  const { variantId = 'streak-5' } = useParams<{ variantId: string }>()
  const wordLength = wordLengthFromVariantId(variantId)
  const words = wordsForLength(wordLength)
  const game = useStreakGame({
    words,
    wordLength,
    maxGuesses: 6,
    variantId,
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

  return (
    <div className="streak-screen">
      <header className="streak-screen-header">
        <Link to="/" className="streak-screen-back">
          ← Hub
        </Link>
        <h1 className="streak-screen-title">Streak ({wordLength})</h1>
        <button type="button" className="streak-screen-new" onClick={game.newRun}>
          New run
        </button>
      </header>

      <p className="streak-screen-meta">
        Streak: <strong>{game.streak}</strong> · Best: <strong>{game.best}</strong>
      </p>

      <p className="streak-screen-hint">
        Six guesses per word. Solve a word to continue—one failure ends the run. Best streak is saved
        in this browser.
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
