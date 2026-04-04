import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { PlayScreenBackLink } from '../components/PlayScreenBackLink'
import { WordleGrid } from '../components/WordleGrid'
import { WordleKeyboard } from '../components/WordleKeyboard'
import { useDoublesOnlyGame } from '../game/useDoublesOnlyGame'
import { wordsForLength, wordLengthFromVariantId } from '../variants/variantWordLength'
import './ClassicWordleScreen.css'

export default function DoublesOnlyScreen() {
  const { variantId = 'doubles-5' } = useParams<{ variantId: string }>()
  const wordLength = wordLengthFromVariantId(variantId)
  const words = wordsForLength(wordLength)
  const game = useDoublesOnlyGame({ words, wordLength, maxGuesses: 6 })
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
        <h1 className="classic-screen-title">Doubles ({wordLength})</h1>
        <button type="button" className="classic-screen-new" onClick={game.newGame}>
          New word
        </button>
      </header>

      <p className="classic-screen-banner">
        The answer has at least one letter twice (e.g. POOLS, SNAGS). Every guess must also use at
        least one letter twice—valid dictionary words only.
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
      />

      <WordleKeyboard guesses={game.guesses} disabled={game.inputLocked} onKey={onScreenKey} />
    </div>
  )
}
