import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { PlayScreenBackLink } from '../components/PlayScreenBackLink'
import { WordleGrid } from '../components/WordleGrid'
import { WordleKeyboard } from '../components/WordleKeyboard'
import { useZenGame } from '../game/useZenGame'
import { wordsForLength, wordLengthFromVariantId } from '../variants/variantWordLength'
import './ZenScreen.css'

export default function ZenScreen() {
  const { variantId = '' } = useParams<{ variantId: string }>()
  const wordLength = wordLengthFromVariantId(variantId)
  const words = wordsForLength(wordLength)
  const mode = variantId.startsWith('zen-infinite') ? 'zenInfinite' : 'zen'
  const game = useZenGame({ words, wordLength, mode })
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

  const title =
    mode === 'zenInfinite' ? `Zen Infinite (${wordLength})` : `Zen (${wordLength})`

  return (
    <div className="zen-screen">
      <header className="zen-screen-header">
        <PlayScreenBackLink className="zen-screen-back" />
        <h1 className="zen-screen-title">{title}</h1>
        <button type="button" className="zen-screen-new" onClick={game.newGame}>
          Reset
        </button>
      </header>

      {mode === 'zenInfinite' && (
        <p className="zen-screen-meta">
          Solved this session: <strong>{game.solvedCount}</strong>
        </p>
      )}

      <p className="zen-screen-hint">
        {mode === 'zenInfinite'
          ? 'Unlimited guesses with a scrolling six-row board. No losing—solve to move on instantly.'
          : 'Unlimited guesses with a scrolling six-row board. No losing—solve to load the next word.'}
      </p>

      {mode === 'zen' && game.winFlash && (
        <p className="zen-screen-flash" aria-live="polite">
          Solved — next word
        </p>
      )}

      <WordleGrid
        wordLength={game.wordLength}
        maxGuesses={game.maxGuesses}
        guesses={game.gridGuesses}
        buffer={game.gridBuffer}
        phase={game.gridPhase}
        shake={game.shake}
      />

      <WordleKeyboard guesses={game.gridGuesses} disabled={game.inputLocked} onKey={onScreenKey} />
    </div>
  )
}
