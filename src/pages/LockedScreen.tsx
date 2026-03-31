import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { WordleKeyboard } from '../components/WordleKeyboard'
import { useLockedGame } from '../game/useLockedGame'
import { wordsForLength, wordLengthFromVariantId } from '../variants/variantWordLength'
import './ClassicWordleScreen.css'
import './LockedScreen.css'

export default function LockedScreen() {
  const { variantId = 'locked-5' } = useParams<{ variantId: string }>()
  const wordLength = wordLengthFromVariantId(variantId)
  const words = wordsForLength(wordLength)
  const game = useLockedGame({ words, wordLength, maxGuesses: 6 })
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

  const { buffer, lockPos, lockLetter, wordLength: n, cursorIndex } = game

  return (
    <div className="classic-screen">
      <header className="classic-screen-header">
        <Link to="/" className="classic-screen-back">
          ← Hub
        </Link>
        <h1 className="classic-screen-title">Locked ({wordLength})</h1>
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
          className={`locked-typing-row ${game.shake ? 'locked-typing-row--shake' : ''}`}
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
            return (
              <div
                key={i}
                className={[
                  'locked-tile',
                  isCursor ? 'locked-tile--cursor' : '',
                  isLockHint ? 'locked-tile--lock-hint' : '',
                  filled ? 'locked-tile--filled' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-current={isCursor ? 'true' : undefined}
              >
                {display}
              </div>
            )
          })}
        </div>
      )}

      {game.phase !== 'pre' && game.submittedList.length > 0 && (
        <ul
          style={{ textAlign: 'left', maxWidth: 360, margin: '0 auto 1rem', paddingLeft: '1.25rem' }}
        >
          {game.submittedList.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}

      {game.phase !== 'pre' && (
        <WordleKeyboard
          guesses={[]}
          disabled={game.inputLocked}
          onKey={onScreenKey}
          plain
        />
      )}
    </div>
  )
}
