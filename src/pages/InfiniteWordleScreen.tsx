import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { PlayScreenBackLink } from '../components/PlayScreenBackLink'
import { WordleGrid } from '../components/WordleGrid'
import { WordleKeyboard } from '../components/WordleKeyboard'
import { useInfiniteWordleGame } from '../game/useInfiniteWordleGame'
import { wordsForLength, wordLengthFromVariantId } from '../variants/variantWordLength'
import './InfiniteWordleScreen.css'

export default function InfiniteWordleScreen() {
  const { variantId = '' } = useParams<{ variantId: string }>()
  const wordLength = wordLengthFromVariantId(variantId)
  const words = wordsForLength(wordLength)
  const game = useInfiniteWordleGame({ words, wordLength })
  const { onPhysicalKey, inputLocked } = game

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (inputLocked) return
      if (e.key === 'Enter' || e.key === 'Backspace') {
        e.preventDefault()
      }
      onPhysicalKey(e.key)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onPhysicalKey, inputLocked])

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
        <PlayScreenBackLink className="infinite-screen-back" />
        <h1 className="infinite-screen-title">Infinite ({wordLength})</h1>
        <button type="button" className="infinite-screen-new" onClick={game.newGame}>
          Reset
        </button>
      </header>

      <p className="infinite-screen-hint">
        Six rows only—run out without solving and you lose. Guess the word to see greens, then the
        oldest <strong>two</strong> guesses slide away and a new answer appears (bonus space).
      </p>

      {game.slides > 0 && (
        <p className="infinite-screen-streak" aria-live="polite">
          Slides: {game.slides}
        </p>
      )}

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

      <WordleKeyboard
        guesses={game.guesses}
        disabled={game.inputLocked}
        onKey={onScreenKey}
      />
    </div>
  )
}
