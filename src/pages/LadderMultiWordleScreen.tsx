import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { PlayScreenBackLink } from '../components/PlayScreenBackLink'
import { WordleGrid } from '../components/WordleGrid'
import { WordleKeyboard } from '../components/WordleKeyboard'
import { LadderCompleteBanner } from '../components/LadderCompleteBanner'
import { LadderRoundMeta } from '../components/LadderRoundMeta'
import { useMultiWordleGame } from '../game/useMultiWordleGame'
import { useLadderRange } from '../hooks/useLadderRange'
import { useLadderSession } from '../hooks/useLadderSession'
import { multiMaxGuesses, wordsForMultiLength } from '../variants/multiVariant'
import type { MultiBoardCount } from '../variants/multiVariant'
import './MultiWordleScreen.css'

function LadderMultiRound({
  length,
  boardCount,
  ladderLo,
  ladderHi,
  onAdvance,
  onReset,
}: {
  length: number
  boardCount: MultiBoardCount
  ladderLo: number
  ladderHi: number
  onAdvance: () => void
  onReset: () => void
}) {
  const game = useMultiWordleGame({
    words: wordsForMultiLength(length),
    wordLength: length,
    maxGuesses: multiMaxGuesses(boardCount),
    boardCount,
  })

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
  const onScreenKey = (key: string) => {
    if (game.phase !== 'playing') return
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

  const title = `Multi (${boardCount}×${length})`
  const gridPhase = game.phase === 'lost' ? 'lost' : game.phase === 'won' ? 'won' : 'playing'

  return (
    <div className="multi-wordle" data-boards={String(boardCount)}>
      <header className="multi-wordle-header">
        <PlayScreenBackLink className="multi-wordle-back" />
        <h1 className="multi-wordle-title">{title}</h1>
        <button
          type="button"
          className="multi-wordle-new"
          onClick={() => (game.phase === 'lost' ? onReset() : game.newGame())}
        >
          {game.phase === 'lost' ? 'Start new run' : 'New game'}
        </button>
      </header>

      <p className="multi-wordle-hint">
        Solve all words to advance the word length ({ladderLo}–{ladderHi}). One failure ends the run; use Start new run
        to begin again from the hub length. Guess all {boardCount} words in {game.maxGuesses} tries.
      </p>

      {game.phase === 'won' && (
        <p className="multi-wordle-banner multi-wordle-banner--win">All words solved.</p>
      )}
      {game.phase === 'lost' && (
        <div className="multi-wordle-banner multi-wordle-banner--lose">
          <p>Run over — out of guesses. Unsolved words:</p>
          <ul className="multi-wordle-answers">
            {game.solved.map((done, i) =>
              done ? null : (
                <li key={i}>
                  Board {i + 1}: <strong>{game.targets[i]}</strong>
                </li>
              ),
            )}
          </ul>
        </div>
      )}

      <div className="multi-wordle-boards" data-boards={String(boardCount)}>
        {game.guessesByBoard.map((guesses, i) => {
          const perBoardPhase = game.solved[i]
            ? 'won'
            : game.phase === 'lost'
              ? 'lost'
              : gridPhase
          return (
            <div key={i} className="multi-wordle-board">
              <WordleGrid
                wordLength={game.wordLength}
                maxGuesses={game.maxGuesses}
                guesses={guesses}
                buffer={game.buffer}
                phase={perBoardPhase}
                shake={game.shake}
              />
            </div>
          )
        })}
      </div>

      <WordleKeyboard guesses={game.keyboardGuesses} disabled={keyboardDisabled} onKey={onScreenKey} />
    </div>
  )
}

export default function LadderMultiWordleScreen() {
  const { variantId = '' } = useParams<{ variantId: string }>()
  const { lo, hi } = useLadderRange(variantId)
  const { length, session, ladderDone, onAdvance, resetToStart } = useLadderSession(lo, hi, 'stop', variantId)
  const m = variantId.match(/^ladder-multi-(\d+)$/)
  const boardCountNum = m ? Number(m[1]) : NaN
  const boardCount = boardCountNum as MultiBoardCount

  const isValid = [2, 4, 6, 8].includes(boardCountNum)
  if (!isValid) return <Navigate to="/" replace />

  return (
    <>
      {ladderDone && <LadderCompleteBanner lo={lo} hi={hi} onPlayAgain={resetToStart} />}
      <LadderRoundMeta currentLength={length} lo={lo} hi={hi} className="ladder-round-meta" />
      <LadderMultiRound
        key={`${session}-${length}`}
        length={length}
        boardCount={boardCount}
        ladderLo={lo}
        ladderHi={hi}
        onAdvance={onAdvance}
        onReset={resetToStart}
      />
    </>
  )
}

