import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { PlayScreenBackLink } from '../components/PlayScreenBackLink'
import { WordChainBoard } from '../components/WordChainBoard'
import { WordChainOptimalModal } from '../components/WordChainOptimalModal'
import { WordleKeyboard } from '../components/WordleKeyboard'
import { useWordChainGame } from '../game/useWordChainGame'
import { wordsForLength, wordLengthFromVariantId } from '../variants/variantWordLength'
import '../components/WordleGrid.css'
import './WordChainScreen.css'

export default function WordChainScreen() {
  const { variantId = '' } = useParams<{ variantId: string }>()
  const wordLength = wordLengthFromVariantId(variantId)
  const words = wordsForLength(wordLength)
  const game = useWordChainGame({ words, wordLength })
  const { onPhysicalKey } = game
  const [showOptimal, setShowOptimal] = useState(false)

  useEffect(() => {
    setShowOptimal(false)
  }, [game.startWord, game.endWord])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === 'Enter' || e.key === 'Backspace') e.preventDefault()
      onPhysicalKey(e.key)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onPhysicalKey])

  const onScreenKey = (key: string) => {
    if (key === 'Enter') return game.submit()
    if (key === 'Backspace') return game.backspace()
    return game.addLetter(key)
  }

  const finished = game.phase === 'won' || game.phase === 'lost'

  return (
    <div className="word-chain-screen">
      <header className="word-chain-screen-header">
        <PlayScreenBackLink className="word-chain-screen-back" />
        <h1 className="word-chain-screen-title">Word chain ({wordLength})</h1>
        <button type="button" className="word-chain-screen-new" onClick={game.newGame}>
          New game
        </button>
      </header>

      <p className="word-chain-screen-meta">
        Optimal: <strong>{game.optimalEdges}</strong> guesses · Par or fewer is a strong solve. You have up to{' '}
        <strong>{game.maxGuessesAllowed}</strong> guesses.
      </p>

      <p className="word-chain-screen-hint">
        Change one letter per step (valid words only). Guessed rows show green only where letters match the goal
        (no yellow). Start and goal use a light background; the final word turns green when you solve. Keyboard
        is not colored.
      </p>

      {game.phase === 'won' && (
        <p className="word-chain-screen-banner word-chain-screen-banner--win">
          Solved in <strong>{game.guessesUsed}</strong> guesses (optimal: {game.optimalEdges}).
        </p>
      )}

      {game.phase === 'lost' && (
        <p className="word-chain-screen-banner word-chain-screen-banner--lose">
          Run over. The goal was <strong>{game.endWord}</strong>.
        </p>
      )}

      <WordChainBoard
        endWord={game.endWord}
        pathWords={game.pathWords}
        buffer={game.buffer}
        wordLength={game.wordLength}
        phase={game.phase}
        shake={game.shake}
      />

      {finished && (
        <div className="word-chain-screen-actions">
          <button type="button" className="word-chain-screen-optimal-btn" onClick={() => setShowOptimal(true)}>
            View optimal path
          </button>
        </div>
      )}

      <WordleKeyboard plain guesses={[]} disabled={game.inputLocked} onKey={onScreenKey} />

      <WordChainOptimalModal
        open={showOptimal}
        onClose={() => setShowOptimal(false)}
        path={game.optimalPath}
      />
    </div>
  )
}
