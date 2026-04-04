import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { PlayScreenBackLink } from '../components/PlayScreenBackLink'
import { WordleKeyboard } from '../components/WordleKeyboard'
import { scoreGuess } from '../game/engine'
import { useRepeatGame } from '../game/useRepeatGame'
import type { GuessRow } from '../game/useWordleGame'
import { wordsForLength, wordLengthFromVariantId } from '../variants/variantWordLength'
import '../components/WordleGrid.css'
import './ClassicWordleScreen.css'
import './RepeatScreen.css'

export default function RepeatScreen() {
  const { variantId = 'repeat-5' } = useParams<{ variantId: string }>()
  const wordLength = wordLengthFromVariantId(variantId)
  const words = wordsForLength(wordLength)
  const game = useRepeatGame({ words, wordLength, maxGuesses: 6 })
  const { onPhysicalKey } = game

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (game.phase !== 'playing') return
      if (e.key === 'Enter' || e.key === 'Backspace') {
        e.preventDefault()
      }
      onPhysicalKey(e.key)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onPhysicalKey, game.phase])

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

  const { buffer, lockPos, lockLetter, wordLength: n, cursorIndex, target } = game

  const keyboardGuesses = useMemo((): GuessRow[] => {
    return game.submittedList.map((letters) => ({
      letters,
      feedback: scoreGuess(target, letters),
    }))
  }, [game.submittedList, target])

  const rowPreviewFeedback =
    game.phase === 'playing' && buffer.length === n ? scoreGuess(target, buffer) : null

  return (
    <div className="classic-screen">
      <header className="classic-screen-header">
        <PlayScreenBackLink className="classic-screen-back" />
        <h1 className="classic-screen-title">Repeat ({wordLength})</h1>
        <button type="button" className="classic-screen-new" onClick={game.newGame}>
          New round
        </button>
      </header>

      {game.phase === 'pre' && (
        <>
          <p className="classic-screen-banner">
            When you start, one slot will show a fixed letter. Type a full word that includes that
            letter in that spot—then enter as many distinct valid words as you can before time runs
            out.
          </p>
          <p className="locked-start-wrap">
            <button type="button" className="locked-start-btn" onClick={game.startTimer}>
              Start timer
            </button>
          </p>
        </>
      )}

      {game.phase !== 'pre' && (
        <p className="classic-screen-banner">
          Position <strong>{lockPos + 1}</strong> must be <strong>{lockLetter}</strong>. Enter as
          many valid words as you can.
        </p>
      )}
      {game.phase !== 'pre' && (
        <p className="classic-screen-banner">
          Time: <strong>{game.secondsLeft}s</strong> · Found: <strong>{game.submittedCount}</strong>{' '}
          · Possible: <strong>{game.totalPossible}</strong>
        </p>
      )}

      {game.phase === 'ended' && (
        <p className="classic-screen-banner classic-screen-banner--win">
          Round over. You found <strong>{game.submittedCount}</strong> of{' '}
          <strong>{game.totalPossible}</strong> words.
        </p>
      )}

      {game.phase !== 'pre' && (
        <div
          className={`repeat-typing-row ${game.shake ? 'repeat-typing-row--shake' : ''}`}
          role="group"
          aria-label="Current word"
        >
          {Array.from({ length: n }, (_, i) => {
            const typed = i < buffer.length ? buffer[i]! : ''
            const showFixedLock =
              game.phase === 'playing' && i === lockPos && buffer.length <= lockPos
            const display = typed || (showFixedLock ? lockLetter : '')
            const filled = typed.trim().length > 0
            const isCursor = game.phase === 'playing' && cursorIndex === i
            const isLockHint = showFixedLock && !typed
            const fb = rowPreviewFeedback?.[i]
            const tileCls = [
              'wordle-tile',
              fb ? `wordle-tile--${fb}` : '',
              !fb && (filled || isLockHint) ? 'wordle-tile--typing' : '',
              !fb && isLockHint ? 'repeat-tile--lock-hint' : '',
              !fb && isCursor ? 'repeat-tile--cursor' : '',
            ]
              .filter(Boolean)
              .join(' ')
            return (
              <div
                key={i}
                className={tileCls}
                aria-current={isCursor ? 'true' : undefined}
              >
                {display}
              </div>
            )
          })}
        </div>
      )}

      {game.phase !== 'pre' && game.submittedList.length > 0 && (
        <ul className="repeat-submitted-list" aria-label="Submitted words">
          {game.submittedList.map((w) => {
            const fb = scoreGuess(target, w)
            return (
              <li key={w} className="repeat-submitted-row">
                {w.split('').map((ch, i) => (
                  <span
                    key={i}
                    className={`wordle-tile wordle-tile--${fb[i]!}`}
                  >
                    {ch}
                  </span>
                ))}
              </li>
            )
          })}
        </ul>
      )}

      {game.phase !== 'pre' && (
        <WordleKeyboard guesses={keyboardGuesses} disabled={game.inputLocked} onKey={onScreenKey} />
      )}
    </div>
  )
}
