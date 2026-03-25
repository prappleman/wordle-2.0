import { useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { LadderCompleteBanner } from '../components/LadderCompleteBanner'
import { LadderRoundMeta } from '../components/LadderRoundMeta'
import { WordleKeyboard } from '../components/WordleKeyboard'
import { useColorlessGame } from '../game/useColorlessGame'
import { useLadderRange } from '../hooks/useLadderRange'
import { useLadderSession } from '../hooks/useLadderSession'
import { wordsForLength } from '../variants/variantWordLength'
import './ColorlessScreen.css'

function ColorlessRound({
  length,
  onAdvance,
  onReset,
}: {
  length: number
  onAdvance: () => void
  onReset: () => void
}) {
  const words = wordsForLength(length)
  const game = useColorlessGame({ words, wordLength: length, maxGuesses: 8 })
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
    if (game.phase === 'lost') onReset()
  }, [game.phase, onAdvance, onReset])

  const keyboardDisabled = game.inputLocked

  const absentAndHints = useMemo(() => {
    const inWord = new Set<string>()
    const absent = new Set<string>()

    for (const row of game.guesses) {
      for (let i = 0; i < row.letters.length; i++) {
        const L = row.letters[i]!.toUpperCase()
        const fb = row.feedback[i]!
        if (fb === 'correct' || fb === 'present') inWord.add(L)
        if (fb === 'absent') absent.add(L)
      }
    }
    for (const L of inWord) absent.delete(L)

    const hints = new Map<string, 'correct' | 'present' | 'absent'>()
    for (const L of inWord) hints.set(L, 'correct')
    return { absentKeys: absent, letterHints: hints }
  }, [game.guesses])

  const onScreenKey = (key: string) => {
    if (key === 'Enter') return game.submit()
    if (key === 'Backspace') return game.backspace()
    game.addLetter(key)
  }

  const { absentKeys, letterHints } = absentAndHints

  return (
    <div className="colorless-screen">
      <header className="colorless-screen-header">
        <Link to="/" className="colorless-screen-back">
          ← Hub
        </Link>
        <h1 className="colorless-screen-title">Colorless ({length}) · Ladder</h1>
        <button
          type="button"
          className="colorless-screen-new"
          onClick={() => (game.phase === 'lost' ? onReset() : game.newGame())}
        >
          {game.phase === 'lost' ? 'Start new run' : 'Reset'}
        </button>
      </header>

      {game.phase === 'lost' && (
        <p className="colorless-screen-banner colorless-screen-banner--lose">
          Run over. The word was <strong>{game.target}</strong>
        </p>
      )}

      <p className="colorless-screen-hint">
        Any tile that would be green or yellow is white. Tiles that are not in the answer are absent (gray).
        Ladder advances to the next length on a solve.
      </p>

      <div className={`colorless-board ${game.shake ? 'colorless-board--shake' : ''}`} data-cols={length}>
        {Array.from({ length: game.maxGuesses }, (_, ri) => {
          const row = game.guesses[ri]
          const isCurrent = ri === game.guesses.length && game.phase === 'playing'
          const padded = game.buffer.padEnd(length, ' ')
          return (
            <div key={ri} className="colorless-row">
              <div className="wordle-row">
                {Array.from({ length }, (_, i) => {
                  const ch = row ? row.letters[i] ?? ' ' : isCurrent ? padded[i] ?? ' ' : ' '
                  const filled = ch.trim().length > 0
                  let tileClass = 'wordle-tile'
                  if (filled) {
                    if (row) {
                      const fb = row.feedback?.[i]
                      tileClass += fb === 'correct' || fb === 'present' ? ' wordle-tile--colorless-correct' : ' wordle-tile--absent'
                    } else {
                      tileClass += ' wordle-tile--typing'
                    }
                  }
                  return (
                    <div key={i} className={tileClass} role="gridcell">
                      {filled ? ch : ''}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <WordleKeyboard guesses={game.guesses} disabled={keyboardDisabled} letterHints={letterHints} absentKeys={absentKeys} onKey={onScreenKey} />
    </div>
  )
}

export default function LadderColorlessScreen() {
  const { variantId = '' } = useParams<{ variantId: string }>()
  const { lo, hi } = useLadderRange(variantId)
  const { length, session, ladderDone, onAdvance, resetToStart } = useLadderSession(lo, hi, 'stop', variantId)

  return (
    <>
      {ladderDone && <LadderCompleteBanner lo={lo} hi={hi} onPlayAgain={resetToStart} />}
      <LadderRoundMeta currentLength={length} lo={lo} hi={hi} className="ladder-round-meta" />
      <ColorlessRound
        key={`${session}-${length}`}
        length={length}
        onAdvance={onAdvance}
        onReset={resetToStart}
      />
    </>
  )
}

