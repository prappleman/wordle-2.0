import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { WordleGrid } from '../components/WordleGrid'
import { WordleKeyboard } from '../components/WordleKeyboard'
import {
  WORDS_3,
  WORDS_4,
  WORDS_5,
  WORDS_6,
  WORDS_7,
} from '../data/words/words12dictsGame'
import { useGrowingWordGame } from '../game/useGrowingWordGame'
import { wordLengthFromVariantId } from '../variants/variantWordLength'
import './GrowingWordScreen.css'

const WORDS_BY_LEN = {
  3: WORDS_3,
  4: WORDS_4,
  5: WORDS_5,
  6: WORDS_6,
  7: WORDS_7,
} as const

export default function GrowingWordScreen() {
  const { variantId = '' } = useParams<{ variantId: string }>()
  const startLength = wordLengthFromVariantId(variantId)
  const game = useGrowingWordGame(WORDS_BY_LEN, startLength as 3 | 4 | 5 | 6 | 7)
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

  const keyboardDisabled = game.phase !== 'playing'

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
        <Link to="/" className="growing-screen-back">
          ← Hub
        </Link>
        <h1 className="growing-screen-title">Growing Word</h1>
        <button type="button" className="growing-screen-new" onClick={game.newGame}>
          Reset run
        </button>
      </header>

      <p className="growing-screen-meta">
        Length <strong>{game.currentLength}</strong> · Words solved this run:{' '}
        <strong>{game.ladderStreak}</strong>
      </p>

      <p className="growing-screen-hint">
        Start at {startLength} letters. Each win adds another letter (up to 7), then loops back to 3.
        One miss resets the run to the starting length.
      </p>

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
        phase={game.phase}
        shake={game.shake}
      />

      <WordleKeyboard guesses={game.guesses} disabled={keyboardDisabled} onKey={onScreenKey} />
    </div>
  )
}
