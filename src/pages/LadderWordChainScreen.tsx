import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { WordChainBoard } from '../components/WordChainBoard'
import { WordChainOptimalModal } from '../components/WordChainOptimalModal'
import { WordleKeyboard } from '../components/WordleKeyboard'
import { LadderCompleteBanner } from '../components/LadderCompleteBanner'
import { LadderRoundMeta } from '../components/LadderRoundMeta'
import { useWordChainGame } from '../game/useWordChainGame'
import { useLadderRange } from '../hooks/useLadderRange'
import { useLadderSession } from '../hooks/useLadderSession'
import { wordsForLength } from '../variants/variantWordLength'
import '../components/WordleGrid.css'
import './WordChainScreen.css'

function WordChainRound({
  length,
  onAdvance,
  onReset,
}: {
  length: number
  onAdvance: () => void
  onReset: () => void
}) {
  const words = wordsForLength(length)
  const game = useWordChainGame({ words, wordLength: length })
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

  useEffect(() => {
    if (game.phase === 'won') onAdvance()
  }, [game.phase, onAdvance])

  const onScreenKey = (key: string) => {
    if (key === 'Enter') return game.submit()
    if (key === 'Backspace') return game.backspace()
    return game.addLetter(key)
  }

  const finished = game.phase === 'won' || game.phase === 'lost'

  return (
    <div className="word-chain-screen">
      <header className="word-chain-screen-header">
        <Link to="/" className="word-chain-screen-back">
          ← Hub
        </Link>
        <h1 className="word-chain-screen-title">Word chain ({length}) · Ladder</h1>
        <button
          type="button"
          className="word-chain-screen-new"
          onClick={() => (game.phase === 'lost' ? onReset() : game.newGame())}
        >
          {game.phase === 'lost' ? 'Start new run' : 'Reset'}
        </button>
      </header>

      <p className="word-chain-screen-meta">
        Optimal: <strong>{game.optimalEdges}</strong> · Cap: <strong>{game.maxGuessesAllowed}</strong> guesses.
      </p>

      <p className="word-chain-screen-hint">
        One letter per step, dictionary words only. Guessed rows: green only vs goal. Start and goal use a light
        background; the final word turns green when you solve. Keyboard is not colored.
      </p>

      {game.phase === 'won' && (
        <p className="word-chain-screen-banner word-chain-screen-banner--win">
          Solved in <strong>{game.guessesUsed}</strong> guesses (optimal {game.optimalEdges}).
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

export default function LadderWordChainScreen() {
  const { variantId = '' } = useParams<{ variantId: string }>()
  const { lo, hi } = useLadderRange(variantId)
  const { length, session, ladderDone, onAdvance, resetToStart } = useLadderSession(lo, hi, 'stop', variantId)

  return (
    <>
      {ladderDone && <LadderCompleteBanner lo={lo} hi={hi} onPlayAgain={resetToStart} />}
      <LadderRoundMeta currentLength={length} lo={lo} hi={hi} className="ladder-round-meta" />
      <WordChainRound
        key={`${session}-${length}`}
        length={length}
        onAdvance={onAdvance}
        onReset={resetToStart}
      />
    </>
  )
}
