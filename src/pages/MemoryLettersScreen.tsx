import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { PlayScreenBackLink } from '../components/PlayScreenBackLink'
import { WordleGrid } from '../components/WordleGrid'
import { WordleKeyboard } from '../components/WordleKeyboard'
import { useWordleGame } from '../game/useWordleGame'
import { wordsForLength, wordLengthFromVariantId } from '../variants/variantWordLength'
import './ClassicWordleScreen.css'

export default function MemoryLettersScreen() {
  const { variantId = 'memory-letters-5' } = useParams<{ variantId: string }>()
  const wordLength = wordLengthFromVariantId(variantId)
  const words = wordsForLength(wordLength)
  const game = useWordleGame({ words, wordLength, maxGuesses: 6 })
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
    <div className="classic-screen">
      <header className="classic-screen-header">
        <PlayScreenBackLink className="classic-screen-back" />
        <h1 className="classic-screen-title">Memory letters ({wordLength})</h1>
        <button type="button" className="classic-screen-new" onClick={() => game.newGame()}>
          New word
        </button>
      </header>

      <p className="classic-screen-banner">
        Past guesses still show green/yellow/gray—you only have to remember which letters you typed.
        On-screen keys stay uncolored until the round ends.
      </p>

      {game.phase === 'won' && (
        <p className="classic-screen-banner classic-screen-banner--win">You got it!</p>
      )}
      {game.phase === 'lost' && (
        <p className="classic-screen-banner classic-screen-banner--lose">
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
        hideLettersForSubmittedRows={game.phase === 'playing'}
      />

      <WordleKeyboard
        guesses={game.guesses}
        disabled={game.inputLocked}
        onKey={onScreenKey}
        plain={game.phase === 'playing'}
      />
    </div>
  )
}
