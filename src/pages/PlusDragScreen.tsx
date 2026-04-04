import { useCallback } from 'react'
import { PlayScreenBackLink } from '../components/PlayScreenBackLink'
import { WORDS_5 } from '../data/words/words12dictsGame'
import { GRID_SIZE, isPlusCell } from '../game/plusDragPuzzle'
import { slotKey } from '../game/frameDragPuzzle'
import { usePlusDragGame } from '../game/usePlusDragGame'
import '../components/WordleGrid.css'
import './FrameDragScreen.css'

const DND_SLOT = 'application/x-wordle-plus-slot'

function feedbackClass(f: string): string {
  if (f === 'correct') return 'wordle-tile--correct'
  if (f === 'present') return 'wordle-tile--present'
  return 'wordle-tile--absent'
}

export default function PlusDragScreen() {
  const game = usePlusDragGame(WORDS_5)

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
        <h1 className="frame-drag-screen-title">Plus</h1>
        <button type="button" className="frame-drag-screen-new" onClick={newGame}>
          New puzzle
        </button>
      </header>

      <p className="frame-drag-screen-hint">
        Middle row and middle column only—two five-letter words sharing the center. Letters start scrambled.
        Wordle-style hints per line; on the center row/column overlap we take the stronger signal (yellow if
        either line would). Swap by drag or two taps. Limited swaps.
      </p>

      {puzzle && (
        <p className="frame-drag-screen-meta" aria-live="polite">
          <strong>{swapsLeft}</strong> swap{swapsLeft === 1 ? '' : 's'} left (of {maxSwaps})
        </p>
      )}

      {phase === 'won' && (
        <p className="frame-drag-screen-banner frame-drag-screen-banner--win">
          Solved — both words are valid and every letter is in place.
        </p>
      )}
      {phase === 'lost' && puzzle && (
        <p className="frame-drag-screen-banner frame-drag-screen-banner--lose">
          Out of swaps. Row <strong>{puzzle.middleRow.toUpperCase()}</strong>, column{' '}
          <strong>{puzzle.middleCol.toUpperCase()}</strong>.
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
          aria-label="5 by 5 plus shape; swap letters on the cross"
        >
          {Array.from({ length: GRID_SIZE }, (_, r) => (
            <div key={r} className="frame-drag-row" role="row">
              {Array.from({ length: GRID_SIZE }, (_, c) => {
                const play = isPlusCell(r, c)
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
