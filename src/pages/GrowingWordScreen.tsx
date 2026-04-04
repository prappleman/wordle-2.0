import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { PlayScreenBackLink } from '../components/PlayScreenBackLink'
import { WordleGrid } from '../components/WordleGrid'
import { WordleKeyboard } from '../components/WordleKeyboard'
import {
  WORDS_1,
  WORDS_2,
  WORDS_3,
  WORDS_4,
  WORDS_5,
  WORDS_6,
  WORDS_7,
  WORDS_8,
  WORDS_9,
  WORDS_10,
  WORDS_11,
  WORDS_12,
} from '../data/words/words12dictsGame'
import { LadderCompleteBanner } from '../components/LadderCompleteBanner'
import { LadderRoundMeta } from '../components/LadderRoundMeta'
import { useGrowingWordGame } from '../game/useGrowingWordGame'
import { useLadderRange } from '../hooks/useLadderRange'
import { wordLengthFromVariantId } from '../variants/variantWordLength'
import './GrowingWordScreen.css'

const WORDS_BY_LEN = {
  1: WORDS_1,
  2: WORDS_2,
  3: WORDS_3,
  4: WORDS_4,
  5: WORDS_5,
  6: WORDS_6,
  7: WORDS_7,
  8: WORDS_8,
  9: WORDS_9,
  10: WORDS_10,
  11: WORDS_11,
  12: WORDS_12,
} as const

export default function GrowingWordScreen() {
  const { variantId = '' } = useParams<{ variantId: string }>()
  const startLength = wordLengthFromVariantId(variantId)
  const { lo, hi } = useLadderRange(variantId)
  const game = useGrowingWordGame(WORDS_BY_LEN, startLength, lo, hi)
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

  const gridPhase: 'playing' | 'won' | 'lost' =
    game.phase === 'ladderComplete' ? 'won' : game.phase === 'won' ? 'won' : game.phase

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
    <div className="growing-screen">
      <header className="growing-screen-header">
        <PlayScreenBackLink className="growing-screen-back" />
        <h1 className="growing-screen-title">Growing Word</h1>
        <button type="button" className="growing-screen-new" onClick={game.newGame}>
          {game.phase === 'lost' && game.lastLostTarget ? 'Start new run' : 'Reset run'}
        </button>
      </header>

      <LadderRoundMeta
        currentLength={game.currentLength}
        lo={lo}
        hi={hi}
        className="growing-screen-meta"
      />
      <p className="growing-screen-meta">
        Length <strong>{game.currentLength}</strong> · Words solved this run:{' '}
        <strong>{game.ladderStreak}</strong>
      </p>

      <p className="growing-screen-hint">
        Start at {startLength} letters. Solve every length from {lo} to {hi} to finish the ladder. One miss ends the
        run; use Reset to start again from the hub length.
      </p>

      {game.phase === 'ladderComplete' && (
        <LadderCompleteBanner lo={lo} hi={hi} onPlayAgain={game.newGame} />
      )}

      {game.phase === 'lost' && game.lastLostTarget && (
        <p className="growing-screen-banner growing-screen-banner--lose">
          Run over. The word was <strong>{game.lastLostTarget}</strong>
        </p>
      )}

      <WordleGrid
        wordLength={game.wordLength}
        maxGuesses={game.maxGuesses}
        guesses={game.guesses}
        buffer={game.buffer}
        phase={gridPhase}
        shake={game.shake}
      />

      <WordleKeyboard guesses={game.guesses} disabled={keyboardDisabled} onKey={onScreenKey} />
    </div>
  )
}
