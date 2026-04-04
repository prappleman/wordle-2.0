import { useEffect, useMemo } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { PlayScreenBackLink } from '../components/PlayScreenBackLink'
import { WordleGrid } from '../components/WordleGrid'
import { WordleKeyboard } from '../components/WordleKeyboard'
import { useMultiWordleGame } from '../game/useMultiWordleGame'
import { useBrowsePlayConfig } from '../play/useBrowsePlayConfig'
import { multiMaxGuesses, parseMultiVariantId, wordsForMultiLength } from '../variants/multiVariant'
import './MultiWordleScreen.css'

function MultiWordlePlay({
  wordLength,
  boardCount,
}: {
  wordLength: number
  boardCount: number
}) {
  const browse = useBrowsePlayConfig()
  const config = useMemo(
    () => ({
      words: wordsForMultiLength(wordLength),
      wordLength,
      maxGuesses: browse.maxGuesses ?? multiMaxGuesses(boardCount),
      boardCount,
    }),
    [wordLength, boardCount, browse.maxGuesses],
  )

  const game = useMultiWordleGame(config)
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

  const title = `Multi (${boardCount}×${wordLength})`

  return (
    <div className="multi-wordle" data-boards={String(boardCount)}>
      <header className="multi-wordle-header">
        <PlayScreenBackLink className="multi-wordle-back" />
        <h1 className="multi-wordle-title">{title}</h1>
        <button type="button" className="multi-wordle-new" onClick={game.newGame}>
          New game
        </button>
      </header>

      <p className="multi-wordle-hint">
        One guess applies to every unsolved grid. Solve all {boardCount} words in {game.maxGuesses}{' '}
        tries.
      </p>

      {game.phase === 'won' && (
        <p className="multi-wordle-banner multi-wordle-banner--win">All words solved.</p>
      )}
      {game.phase === 'lost' && (
        <div className="multi-wordle-banner multi-wordle-banner--lose">
          <p>Out of guesses. Unsolved words:</p>
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
          const gridPhase = game.solved[i]
            ? 'won'
            : game.phase === 'lost'
              ? 'lost'
              : 'playing'
          return (
            <div key={i} className="multi-wordle-board">
              <WordleGrid
                wordLength={game.wordLength}
                maxGuesses={game.maxGuesses}
                guesses={guesses}
                buffer={game.buffer}
                phase={gridPhase}
                shake={game.shake}
              />
            </div>
          )
        })}
      </div>

      <WordleKeyboard
        guesses={game.keyboardGuesses}
        disabled={keyboardDisabled}
        onKey={onScreenKey}
      />
    </div>
  )
}

export default function MultiWordleScreen() {
  const { variantId = '' } = useParams<{ variantId: string }>()
  const parsed = parseMultiVariantId(variantId)

  if (!parsed) {
    return <Navigate to="/" replace />
  }

  return (
    <MultiWordlePlay
      key={variantId}
      wordLength={parsed.wordLength}
      boardCount={parsed.boardCount}
    />
  )
}
