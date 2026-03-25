import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { WordleGrid } from '../components/WordleGrid'
import { WordleKeyboard } from '../components/WordleKeyboard'
import { useZenGame } from '../game/useZenGame'
import { wordsForLength, wordLengthFromVariantId } from '../variants/variantWordLength'
import './ZenScreen.css'

function nextLadderLength(len: number) {
  return len === 7 ? 3 : len + 1
}

function ZenRound({
  length,
  onAdvance,
}: {
  length: number
  onAdvance: () => void
}) {
  const words = wordsForLength(length)
  const game = useZenGame({ words, wordLength: length, mode: 'zen' })
  const { onPhysicalKey } = game

  const prevWinFlashRef = useRef(game.winFlash)

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
    const prev = prevWinFlashRef.current
    if (!prev && game.winFlash) onAdvance()
    prevWinFlashRef.current = game.winFlash
  }, [game.winFlash, onAdvance])

  const onScreenKey = (key: string) => {
    if (key === 'Enter') return game.submit()
    if (key === 'Backspace') return game.backspace()
    return game.addLetter(key)
  }

  return (
    <div className="zen-screen">
      <header className="zen-screen-header">
        <Link to="/" className="zen-screen-back">
          ← Hub
        </Link>
        <h1 className="zen-screen-title">Zen ({length}) · Ladder</h1>
        <button type="button" className="zen-screen-new" onClick={game.newGame}>
          Reset
        </button>
      </header>

      {game.winFlash && (
        <p className="zen-screen-flash" aria-live="polite">
          Solved — next length
        </p>
      )}

      <p className="zen-screen-hint">
        Unlimited guesses with a scrolling six-row board. In ladder mode, each solved word advances
        the word length (7 to 3, then 4–7 again).
      </p>

      <WordleGrid
        wordLength={game.wordLength}
        maxGuesses={game.maxGuesses}
        guesses={game.gridGuesses}
        buffer={game.gridBuffer}
        phase={game.gridPhase}
        shake={game.shake}
      />

      <WordleKeyboard guesses={game.gridGuesses} disabled={false} onKey={onScreenKey} />
    </div>
  )
}

export default function LadderZenScreen() {
  const { variantId = '' } = useParams<{ variantId: string }>()
  const startLength = wordLengthFromVariantId(variantId)
  const [length, setLength] = useState(startLength)

  return <ZenRound key={length} length={length} onAdvance={() => setLength((l) => nextLadderLength(l))} />
}

