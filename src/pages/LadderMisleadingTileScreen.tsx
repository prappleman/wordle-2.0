import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { PlayScreenBackLink } from '../components/PlayScreenBackLink'
import { WordleGrid } from '../components/WordleGrid'
import { WordleKeyboard } from '../components/WordleKeyboard'
import { LadderCompleteBanner } from '../components/LadderCompleteBanner'
import { LadderRoundMeta } from '../components/LadderRoundMeta'
import { keyboardLetterHints } from '../components/keyboardHints'
import { useMisleadingTileGame } from '../game/useMisleadingTileGame'
import { useLadderRange } from '../hooks/useLadderRange'
import { useLadderSession } from '../hooks/useLadderSession'
import { wordsForLength } from '../variants/variantWordLength'
import './MisleadingTileScreen.css'

function MisleadingRound({
  length,
  onAdvance,
  onReset,
}: {
  length: number
  onAdvance: () => void
  onReset: () => void
}) {
  const words = wordsForLength(length)
  const game = useMisleadingTileGame({ words, wordLength: length, maxGuesses: 10 })
  const { onPhysicalKey } = game

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

  const keyboardDisabled = game.inputLocked
  const keyboardHints = useMemo(() => keyboardLetterHints(game.guesses), [game.guesses])

  const onScreenKey = (key: string) => {
    if (key === 'Enter') return game.submit()
    if (key === 'Backspace') return game.backspace()
    return game.addLetter(key)
  }

  return (
    <div className="misleading-screen">
      <header className="misleading-screen-header">
        <PlayScreenBackLink className="misleading-screen-back" />
        <h1 className="misleading-screen-title">Misleading Tile ({length}) · Ladder</h1>
        <button
          type="button"
          className="misleading-screen-new"
          onClick={() => (game.phase === 'lost' ? onReset() : game.newGame())}
        >
          {game.phase === 'lost' ? 'Start new run' : 'Reset'}
        </button>
      </header>

      <p className="misleading-screen-hint">
        One tile per guess lies about its color. Early guesses try to lie on green, yellow, and gray at least
        once when possible. The keyboard uses true Wordle hints (classic rules). Compare each letter’s tile to
        its key—when they disagree, that tile is misleading.
      </p>

      {game.phase === 'won' && (
        <p className="misleading-screen-banner misleading-screen-banner--win">You got it!</p>
      )}
      {game.phase === 'lost' && (
        <p className="misleading-screen-banner misleading-screen-banner--lose">
          Run over. The word was <strong>{game.target}</strong>
        </p>
      )}

      <WordleGrid
        wordLength={game.wordLength}
        maxGuesses={game.maxGuesses}
        guesses={game.guesses}
        buffer={game.buffer}
        phase={game.phase}
        shake={game.shake}
        staggerFeedbackRevealRowIndex={game.revealStaggerRowIndex}
      />

      <WordleKeyboard
        guesses={game.guesses}
        letterHints={keyboardHints}
        disabled={keyboardDisabled}
        onKey={onScreenKey}
      />
    </div>
  )
}

export default function LadderMisleadingTileScreen() {
  const { variantId = '' } = useParams<{ variantId: string }>()
  const { lo, hi } = useLadderRange(variantId)
  const { length, session, ladderDone, onAdvance, resetToStart } = useLadderSession(lo, hi, 'stop', variantId)

  return (
    <>
      {ladderDone && <LadderCompleteBanner lo={lo} hi={hi} onPlayAgain={resetToStart} />}
      <LadderRoundMeta currentLength={length} lo={lo} hi={hi} className="ladder-round-meta" />
      <MisleadingRound
        key={`${session}-${length}`}
        length={length}
        onAdvance={onAdvance}
        onReset={resetToStart}
      />
    </>
  )
}

