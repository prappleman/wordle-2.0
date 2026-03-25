import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { WordleGrid } from '../components/WordleGrid'
import { WordleKeyboard } from '../components/WordleKeyboard'
import { useAlternatingDuetGame } from '../game/useAlternatingDuetGame'
import { wordsForLength, wordLengthFromVariantId } from '../variants/variantWordLength'
import './AlternatingDuetScreen.css'

export default function AlternatingDuetScreen() {
  const { variantId = '' } = useParams<{ variantId: string }>()
  const wordLength = wordLengthFromVariantId(variantId)
  const words = wordsForLength(wordLength)
  const game = useAlternatingDuetGame({
    words,
    wordLength,
    maxGuesses: 12,
  })
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

  const keyboardDisabled = game.phase !== 'playing' || game.celebrationLock

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
        <h1 className="duet-screen-title">Alternating ({wordLength})</h1>
        <button type="button" className="duet-screen-new" onClick={game.newGame}>
          New game
        </button>
      </header>

      <p className="duet-screen-hint">
        Two hidden words. Each guess is checked against both answers: if your letters match Word A or Word B,
        that word counts as found (even on the other word’s “turn”). While both are unknown, odd/even turns
        choose which answer is used for scoring and the board re-tints to that lens. After one word is found,
        tiles and keyboard use only the remaining word. Twelve guesses total.
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
                (1st/3rd/5th/7th/9th/11th → A · 2nd/4th/6th/8th/10th/12th → B)
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
            className={`duet-screen-summary ${game.phase === 'won' ? 'duet-screen-summary--win' : 'duet-screen-summary--lose'}`}
            role="status"
          >
            {summaryMessage}
            {game.phase === 'lost' && <span className="duet-screen-summary-sub"> Out of guesses.</span>}
          </p>

          <div className="duet-boards duet-boards--summary">
            <section className="duet-panel" aria-label="Word A summary">
              <p className="duet-panel-label">
                Word A
                {game.solvedA ? (
                  <span className="duet-panel-solved"> · Solved</span>
                ) : (
                  <span className="duet-panel-answer">
                    {' '}
                    · <strong>{game.targets[0]}</strong>
                  </span>
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
                  <span className="duet-panel-answer">
                    {' '}
                    · <strong>{game.targets[1]}</strong>
                  </span>
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
