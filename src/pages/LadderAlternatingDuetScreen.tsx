import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { LadderCompleteBanner } from '../components/LadderCompleteBanner'
import { LadderRoundMeta } from '../components/LadderRoundMeta'
import { WordleGrid } from '../components/WordleGrid'
import { WordleKeyboard } from '../components/WordleKeyboard'
import { useAlternatingDuetGame } from '../game/useAlternatingDuetGame'
import { useLadderRange } from '../hooks/useLadderRange'
import { useLadderSession } from '../hooks/useLadderSession'
import { wordsForLength } from '../variants/variantWordLength'
import './AlternatingDuetScreen.css'

function AlternatingRound({
  length,
  onAdvance,
  onReset,
}: {
  length: number
  onAdvance: () => void
  onReset: () => void
}) {
  const words = wordsForLength(length)
  const game = useAlternatingDuetGame({ words, wordLength: length, maxGuesses: 10 })
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

  const keyboardDisabled = game.phase !== 'playing' || game.celebrationLock
  const onScreenKey = (key: string) => {
    if (key === 'Enter') return game.submit()
    if (key === 'Backspace') return game.backspace()
    return game.addLetter(key)
  }

  const gridPhase: 'playing' | 'won' | 'lost' =
    game.phase === 'won' ? 'won' : game.phase === 'lost' ? 'lost' : 'playing'

  const finished = game.phase !== 'playing'
  const summaryMessage =
    game.phase === 'won'
      ? '2/2 · Both words solved.'
      : game.solvedCount === 0
        ? '0/2 · Neither word solved.'
        : '1/2 · One word solved.'

  return (
    <div className="duet-screen">
      <header className="duet-screen-header">
        <Link to="/" className="duet-screen-back">
          ← Hub
        </Link>
        <h1 className="duet-screen-title">Alternating ({length}) · Ladder</h1>
        <button
          type="button"
          className="duet-screen-new"
          onClick={() => (game.phase === 'lost' ? onReset() : game.newGame())}
        >
          {game.phase === 'lost' ? 'Start new run' : 'Reset'}
        </button>
      </header>

      <p className="duet-screen-hint">
        Two hidden words. Odd/even turns alternate which answer lens scores your guess. When you
        solve both words, this ladder advances to the next length.
      </p>

      {game.phase === 'playing' && game.celebrationLock && (
        <p className="duet-screen-banner duet-screen-banner--win" aria-live="polite">
          {game.solvedA && game.solvedB ? 'You got both!' : 'You got it!'}
        </p>
      )}

      {game.phase === 'playing' && !game.celebrationLock && (
        <p className="duet-screen-next" aria-live="polite">
          {!game.solvedA && !game.solvedB ? (
            <>
              Next guess scores: <strong>Word {game.nextScoresWord}</strong>
              <span className="duet-screen-next-sub">
                {' '}
                (1st/3rd/5th/7th/9th → A · 2nd/4th/6th/8th/10th → B)
              </span>
            </>
          ) : (
            <>
              Next guess: <strong>Word {game.nextScoresWord}</strong> only — classic Wordle (no alternating).
            </>
          )}
        </p>
      )}

      {finished && (
        <>
          <p
            className={`duet-screen-summary ${
              game.phase === 'won' ? 'duet-screen-summary--win' : 'duet-screen-summary--lose'
            }`}
            role="status"
          >
            {summaryMessage}
            {game.phase === 'lost' && (
              <span className="duet-screen-summary-sub"> Run over — out of guesses.</span>
            )}
          </p>

          <div className="duet-boards duet-boards--summary">
            <section className="duet-panel" aria-label="Word A summary">
              <p className="duet-panel-label">
                Word A
                {game.solvedA ? (
                  <span className="duet-panel-solved"> · Solved</span>
                ) : (
                  <span className="duet-panel-answer"> · <strong>{game.targets[0]}</strong></span>
                )}
              </p>
              <WordleGrid
                wordLength={game.wordLength}
                maxGuesses={game.maxGuesses}
                guesses={game.summaryGridAllA}
                buffer=""
                phase="lost"
                shake={false}
              />
            </section>
            <section className="duet-panel" aria-label="Word B summary">
              <p className="duet-panel-label">
                Word B
                {game.solvedB ? (
                  <span className="duet-panel-solved"> · Solved</span>
                ) : (
                  <span className="duet-panel-answer"> · <strong>{game.targets[1]}</strong></span>
                )}
              </p>
              <WordleGrid
                wordLength={game.wordLength}
                maxGuesses={game.maxGuesses}
                guesses={game.summaryGridAllB}
                buffer=""
                phase="lost"
                shake={false}
              />
            </section>
          </div>
        </>
      )}

      {!finished && (
        <>
          <WordleGrid
            wordLength={game.wordLength}
            maxGuesses={game.maxGuesses}
            guesses={game.gridGuesses}
            buffer={game.buffer}
            phase={gridPhase}
            shake={game.shake}
          />

          <WordleKeyboard guesses={game.keyboardGuesses} disabled={keyboardDisabled} onKey={onScreenKey} />
        </>
      )}
    </div>
  )
}

export default function LadderAlternatingDuetScreen() {
  const { variantId = '' } = useParams<{ variantId: string }>()
  const { lo, hi } = useLadderRange(variantId)
  const { length, session, ladderDone, onAdvance, resetToStart } = useLadderSession(lo, hi, 'stop', variantId)

  return (
    <>
      {ladderDone && <LadderCompleteBanner lo={lo} hi={hi} onPlayAgain={resetToStart} />}
      <LadderRoundMeta currentLength={length} lo={lo} hi={hi} className="ladder-round-meta" />
      <AlternatingRound
        key={`${session}-${length}`}
        length={length}
        onAdvance={onAdvance}
        onReset={resetToStart}
      />
    </>
  )
}

