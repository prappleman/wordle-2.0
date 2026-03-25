import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { WordleGrid } from '../components/WordleGrid'
import { WordleKeyboard } from '../components/WordleKeyboard'
import { useZenGame } from '../game/useZenGame'
import { useLadderRange } from '../hooks/useLadderRange'
import { nextLadderInRange } from '../variants/ladderRange'
import { wordsForLength } from '../variants/variantWordLength'
import './ZenScreen.css'

function ZenRound({
  length,
  ladderLo,
  ladderHi,
  onAdvance,
}: {
  length: number
  ladderLo: number
  ladderHi: number
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
        Unlimited guesses with a scrolling six-row board. In ladder mode, each solved word advances the word
        length through {ladderLo}–{ladderHi} (after {ladderHi}, back to {ladderLo}).
      </p>

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

export default function LadderZenScreen() {
  const { variantId = '' } = useParams<{ variantId: string }>()
  const { lo, hi } = useLadderRange(variantId)
  const [length, setLength] = useState(lo)

  return (
    <ZenRound
      key={length}
      length={length}
      ladderLo={lo}
      ladderHi={hi}
      onAdvance={() => setLength((l) => nextLadderInRange(l, lo, hi, 'wrap') ?? l)}
    />
  )
}

