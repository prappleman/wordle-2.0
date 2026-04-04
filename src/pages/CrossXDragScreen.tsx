import { useCallback } from 'react'
import { PlayScreenBackLink } from '../components/PlayScreenBackLink'
import { WORDS_4, WORDS_5, WORDS_6 } from '../data/words/words12dictsGame'
import {
  crosswordGridCols,
  crosswordGridRows,
  isCrosswordPuzzleCell,
  type CrosswordWordBuckets,
} from '../game/crossXDragPuzzle'
import { slotKey } from '../game/frameDragPuzzle'
import { useCrossXDragGame } from '../game/useCrossXDragGame'
import '../components/WordleGrid.css'
import './FrameDragScreen.css'

const DND_SLOT = 'application/x-wordle-cross-x-slot'

function feedbackClass(f: string): string {
  if (f === 'correct') return 'wordle-tile--correct'
  if (f === 'present') return 'wordle-tile--present'
  return 'wordle-tile--absent'
}

const CROSS_BUCKETS: CrosswordWordBuckets = { 4: WORDS_4, 5: WORDS_5, 6: WORDS_6 }

export default function CrossXDragScreen() {
  const game = useCrossXDragGame(CROSS_BUCKETS)

  const {
    puzzle,
    letters,
    swapsLeft,
    maxSwaps,
    phase,
    selectedSlot,
    newGame,
    feedbackBySlot,
    swapSlots,
    onPickSlot,
    clearSelection,
  } = game

  const onDragStart = useCallback(
    (e: React.DragEvent, sk: string) => {
      if (phase !== 'playing' || swapsLeft <= 0) {
        e.preventDefault()
        return
      }
      e.dataTransfer.setData(DND_SLOT, sk)
      e.dataTransfer.effectAllowed = 'move'
    },
    [phase, swapsLeft],
  )

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDropOnCell = useCallback(
    (e: React.DragEvent, sk: string) => {
      e.preventDefault()
      if (phase !== 'playing') return
      const from = e.dataTransfer.getData(DND_SLOT)
      if (from && from !== sk) swapSlots(from, sk)
      clearSelection()
    },
    [phase, swapSlots, clearSelection],
  )

  return (
    <div className="frame-drag-screen">
      <header className="frame-drag-screen-header">
        <PlayScreenBackLink className="frame-drag-screen-back" />
        <h1 className="frame-drag-screen-title">Cross</h1>
        <button type="button" className="frame-drag-screen-new" onClick={newGame}>
          New puzzle
        </button>
      </header>

      <p className="frame-drag-screen-hint">
        Mini crossword: three across and two down—each word is 4–6 letters, mixed per puzzle. The layout is
        built first (staggered across rows, down columns spaced inside the shared band) so short parallel
        strips do not appear. Shorter across words leave blocked cells on the right of that row. Wordle colors
        use each full word; shared cells take the stronger hint.
      </p>

      {puzzle && (
        <p className="frame-drag-screen-meta" aria-live="polite">
          Across <strong>{puzzle.lenTop}</strong>·<strong>{puzzle.lenMid}</strong>·<strong>{puzzle.lenBot}</strong>
          , down <strong>{puzzle.lenDown}</strong> · <strong>{swapsLeft}</strong> swap
          {swapsLeft === 1 ? '' : 's'} left (of {maxSwaps})
        </p>
      )}

      {phase === 'won' && (
        <p className="frame-drag-screen-banner frame-drag-screen-banner--win">
          Solved — all five words are valid and every letter is in place.
        </p>
      )}
      {phase === 'lost' && puzzle && (
        <p className="frame-drag-screen-banner frame-drag-screen-banner--lose">
          Out of swaps. Across:{' '}
          <strong>{puzzle.rowTop.toUpperCase()}</strong>, <strong>{puzzle.rowMid.toUpperCase()}</strong>,{' '}
          <strong>{puzzle.rowBot.toUpperCase()}</strong>. Down: <strong>{puzzle.colLeft.toUpperCase()}</strong>,{' '}
          <strong>{puzzle.colRight.toUpperCase()}</strong>.
        </p>
      )}

      {!puzzle && (
        <p className="frame-drag-screen-loading" role="status">
          Loading puzzle…
        </p>
      )}

      {puzzle && (
        <div
          className="frame-drag-grid"
          role="grid"
          aria-label="Crossword grid; swap letters on playable cells"
        >
          {Array.from({ length: crosswordGridRows(puzzle) }, (_, r) => (
            <div key={r} className="frame-drag-row" role="row">
              {Array.from({ length: crosswordGridCols(puzzle) }, (_, c) => {
                const play =
                  game.puzzle !== null && isCrosswordPuzzleCell(game.puzzle, r, c)
                const k = slotKey(r, c)
                const letter = letters[k]
                const fb = feedbackBySlot.get(k) ?? 'absent'
                const show = letter?.toUpperCase() ?? ''

                if (!play) {
                  return (
                    <div key={k} className="frame-drag-cell frame-drag-cell--blocked" aria-hidden />
                  )
                }

                const canSwap = phase === 'playing' && swapsLeft > 0
                const selected = selectedSlot === k

                return (
                  <button
                    key={k}
                    type="button"
                    className={`frame-drag-cell wordle-tile ${feedbackClass(fb)}${selected ? ' frame-drag-cell--selected' : ''}`}
                    draggable={canSwap}
                    onDragStart={(e) => onDragStart(e, k)}
                    onDragOver={onDragOver}
                    onDrop={(e) => onDropOnCell(e, k)}
                    onClick={() => onPickSlot(k)}
                    disabled={phase !== 'playing'}
                    aria-label={`Row ${r + 1} column ${c + 1}: ${show}.`}
                  >
                    {show}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
