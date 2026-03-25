import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { WordleKeyboard } from '../components/WordleKeyboard'
import { useWord500Game, type TileNote } from '../game/useWord500Game'
import { wordsForLength, wordLengthFromVariantId } from '../variants/variantWordLength'
import './Word500Screen.css'

function nextLadderLength(len: number) {
  return len === 7 ? 3 : len + 1
}

function tileNoteClass(note: TileNote): string {
  const base = 'word500-tile word500-tile--submitted'
  if (note === 'none') return base
  return `${base} word500-tile--note-${note}`
}

function lettersWithGreenOrYellow(
  guesses: { letters: string }[],
  getMark: (row: number, col: number) => TileNote,
): Set<string> {
  const s = new Set<string>()
  for (let row = 0; row < guesses.length; row++) {
    const letters = guesses[row]!.letters
    for (let col = 0; col < letters.length; col++) {
      const m = getMark(row, col)
      if (m === 'green' || m === 'yellow') {
        s.add(letters[col]!.toUpperCase())
      }
    }
  }
  return s
}

function submittedTileClass(
  ch: string,
  mark: TileNote,
  absent: ReadonlySet<string>,
  greenOrYellowLetters: ReadonlySet<string>,
): string {
  if (mark !== 'none') return tileNoteClass(mark)
  if (absent.has(ch) && !greenOrYellowLetters.has(ch)) {
    return 'word500-tile word500-tile--submitted word500-tile--inferred-red'
  }
  return tileNoteClass('none')
}

function Word500Round({
  length,
  onAdvance,
  onReset,
}: {
  length: number
  onAdvance: () => void
  onReset: () => void
}) {
  const words = wordsForLength(length)
  const game = useWord500Game({ words, wordLength: length })
  const { onPhysicalKey } = game

  const prevPhaseRef = useRef(game.phase)

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

  useEffect(() => {
    const prev = prevPhaseRef.current
    if (prev === game.phase) return
    prevPhaseRef.current = game.phase
    if (game.phase === 'won') onAdvance()
    if (game.phase === 'lost') onReset()
  }, [game.phase, onAdvance, onReset])

  const keyboardDisabled = game.phase !== 'playing'
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

  const { wordLength, maxGuesses, guesses, buffer, absentLetters } = game
  const greenOrYellowLetters = useMemo(
    () => lettersWithGreenOrYellow(guesses, game.getMark),
    [guesses, game],
  )

  const keyboardAbsentKeys = new Set<string>()
  for (const L of absentLetters) {
    if (!greenOrYellowLetters.has(L)) keyboardAbsentKeys.add(L)
  }
  for (let row = 0; row < guesses.length; row++) {
    const letters = guesses[row]!.letters
    for (let col = 0; col < letters.length; col++) {
      if (game.getMark(row, col) === 'red') {
        const L = letters[col]!.toUpperCase()
        if (!greenOrYellowLetters.has(L)) keyboardAbsentKeys.add(L)
      }
    }
  }

  return (
    <div className="word500">
      <header className="word500-header">
        <Link to="/" className="word500-back">
          ← Hub
        </Link>
        <h1 className="word500-title">Word 500 ({wordLength}) · Ladder</h1>
        <button type="button" className="word500-new" onClick={game.newGame}>
          Reset
        </button>
      </header>

      <p className="word500-hint">
        You only see how many letters are in the right spot (green), in the word but wrong spot (yellow),
        or not in the word (red)—not which letters. Ladder advances to the next length on a solve.
      </p>

      {game.phase === 'won' && <p className="word500-banner word500-banner--win">Solved!</p>}
      {game.phase === 'lost' && (
        <p className="word500-banner word500-banner--lose">
          The word was <strong>{game.target}</strong>
        </p>
      )}

      <div
        className={`word500-board ${game.shake ? 'word500-board--shake' : ''}`}
        role="group"
        aria-label="Word 500 board"
      >
        {Array.from({ length: maxGuesses }, (_, rowIndex) => {
          const isPast = rowIndex < guesses.length
          const isCurrent = rowIndex === guesses.length && game.phase === 'playing'
          const row = guesses[rowIndex]

          if (isPast && row) {
            return (
              <div key={rowIndex} className="word500-row">
                <div className="word500-tiles">
                  {row.letters.split('').map((ch, col) => (
                    <button
                      key={col}
                      type="button"
                      className={submittedTileClass(
                        ch,
                        game.getMark(rowIndex, col),
                        absentLetters,
                        greenOrYellowLetters,
                      )}
                      onClick={() => game.cycleMark(rowIndex, col)}
                      aria-label={`Row ${rowIndex + 1} letter ${col + 1}, cycle note color`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
                <div className="word500-counts" aria-label="Feedback counts">
                  <span className="word500-count-cell word500-count-cell--green">
                    <span className="word500-count-num">{row.aggregate.green}</span>
                  </span>
                  <span className="word500-count-cell word500-count-cell--yellow">
                    <span className="word500-count-num">{row.aggregate.yellow}</span>
                  </span>
                  <span className="word500-count-cell word500-count-cell--red">
                    <span className="word500-count-num">{row.aggregate.red}</span>
                  </span>
                </div>
              </div>
            )
          }

          if (isCurrent) {
            const padded = buffer.padEnd(wordLength, ' ')
            return (
              <div key={rowIndex} className="word500-row word500-row--current">
                <div className="word500-tiles">
                  {Array.from({ length: wordLength }, (_, col) => {
                    const ch = padded[col] ?? ' '
                    const filled = ch.trim().length > 0
                    const letter = ch.toUpperCase()
                    const isRuledOut =
                      filled && absentLetters.has(letter) && !greenOrYellowLetters.has(letter)
                    return (
                      <div
                        key={col}
                        className={
                          filled
                            ? isRuledOut
                              ? 'word500-tile word500-tile--typing word500-tile--inferred-red'
                              : 'word500-tile word500-tile--typing'
                            : 'word500-tile'
                        }
                      >
                        {filled ? ch : ''}
                      </div>
                    )
                  })}
                </div>
                <div className="word500-counts" aria-hidden="true">
                  <span className="word500-count-cell word500-count-cell--green" />
                  <span className="word500-count-cell word500-count-cell--yellow" />
                  <span className="word500-count-cell word500-count-cell--red" />
                </div>
              </div>
            )
          }

          return (
            <div key={rowIndex} className="word500-row word500-row--empty">
              <div className="word500-tiles">
                {Array.from({ length: wordLength }, (_, col) => (
                  <div key={col} className="word500-tile" />
                ))}
              </div>
              <div className="word500-counts" aria-hidden="true">
                <span className="word500-count-cell word500-count-cell--green" />
                <span className="word500-count-cell word500-count-cell--yellow" />
                <span className="word500-count-cell word500-count-cell--red" />
              </div>
            </div>
          )
        })}
      </div>

      <WordleKeyboard
        guesses={[]}
        disabled={keyboardDisabled}
        plain
        absentKeys={keyboardAbsentKeys}
        onKey={onScreenKey}
      />
    </div>
  )
}

export default function LadderWord500Screen() {
  const { variantId = '' } = useParams<{ variantId: string }>()
  const startLength = wordLengthFromVariantId(variantId)
  const [length, setLength] = useState(startLength)

  return (
    <Word500Round
      key={length}
      length={length}
      onAdvance={() => setLength((l) => nextLadderLength(l))}
      onReset={() => setLength(startLength)}
    />
  )
}

