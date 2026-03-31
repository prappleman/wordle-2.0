import type { GuessRow } from '../game/useWordleGame'
import type { LetterFeedback } from '../variants/types'
import './WordleGrid.css'

function tileClass(
  feedback: LetterFeedback | undefined,
  filled: boolean,
  neutralSubmitted: boolean,
  blockedCell: boolean,
): string {
  const base = 'wordle-tile'
  if (blockedCell) return `${base} wordle-tile--blocked`
  if (feedback && !filled) {
    return `${base} wordle-tile--${feedback}`
  }
  if (!filled) return base
  if (!feedback) return `${base} wordle-tile--typing`
  if (neutralSubmitted) return `${base} wordle-tile--absent`
  return `${base} wordle-tile--${feedback}`
}

function rowWidth(
  rowIndex: number,
  wordLength: number,
  rowWordLengths: number[] | undefined,
): number {
  if (rowWordLengths && rowWordLengths[rowIndex] !== undefined) {
    return rowWordLengths[rowIndex]!
  }
  return wordLength
}

/** Map short guess to full row, skipping any blocked column indices. */
function expandBlockedMulti(short: string, blockedIndices: readonly number[], width: number): string {
  const blocked = new Set(blockedIndices)
  let si = 0
  let out = ''
  for (let i = 0; i < width; i++) {
    if (blocked.has(i)) {
      out += '\u00a0'
      continue
    }
    out += si < short.length ? short[si]! : ' '
    si++
  }
  return out
}

function getBlockedIndicesForRow(
  r: number,
  guesses: GuessRow[],
  blockedCellsByRow: (number[] | null)[] | null | undefined,
  blockedCellByRow: (number | null)[] | null | undefined,
): number[] | null {
  if (blockedCellsByRow && blockedCellsByRow[r] && blockedCellsByRow[r]!.length > 0) {
    return blockedCellsByRow[r]!
  }
  if (blockedCellByRow && blockedCellByRow[r] != null && blockedCellByRow[r]! >= 0) {
    return [blockedCellByRow[r]!]
  }
  if (r < guesses.length) {
    const g = guesses[r]!
    if (g.rowBlockedIndices && g.rowBlockedIndices.length > 0) {
      return [...g.rowBlockedIndices]
    }
    if (g.rowBlockedIndex != null && g.rowBlockedIndex >= 0) {
      return [g.rowBlockedIndex]
    }
  }
  return null
}

export interface WordleGridProps {
  wordLength: number
  maxGuesses: number
  guesses: GuessRow[]
  buffer: string
  phase: 'playing' | 'won' | 'lost'
  shake: boolean
  neutralSubmittedTiles?: boolean
  hideLettersForSubmittedRows?: boolean
  hideFeedbackForRow?: (rowIndex: number) => boolean
  blockedCellByRow?: (number | null)[] | null
  /** Multiple blocked cells per row (e.g. Spaces bonus rows). Overrides single `blockedCellByRow` when set. */
  blockedCellsByRow?: (number[] | null)[] | null
  rowWordLengths?: number[] | null
  /** Colored empty cells for rows not yet reached (reverse mode). */
  emptyRowFeedback?: (LetterFeedback[] | undefined)[] | null
  /**
   * Reverse mode: six independent slots; null = open pattern (`emptyRowFeedback[row]`).
   * When playing and any slot is open, a typing row is shown below.
   */
  reverseSlots?: (GuessRow | null)[] | null
  /** Reverse mode: row cleared (removed) after solve animation. */
  reverseClearedRows?: boolean[] | null
  /**
   * Reverse mode: show pattern rows as empty uncolored tiles (no G/Y/Gray) and hide typing row
   * (e.g. before the player starts).
   */
  reverseNeutralPatternPreview?: boolean
  /**
   * Spaces mode: on the active typing row, each column is clickable to pick the wildcard slot.
   */
  pickSkipColumn?: ((colIndex: number) => void) | null
  pickSkipSelection?: number | null
  /** Only rows with index &lt; this may pick wildcard (default: maxGuesses - 1). Spaces uses 5. */
  pickSkipMaxRowExclusive?: number
  /**
   * Fixed-column typing row (e.g. Spaces): full `wordLength` string; skips nbsp at wildcard / blocked.
   * When set for the active row, used instead of `buffer` + expandBlockedMulti.
   */
  typingRowCellsOverride?: string | null
}

export function WordleGrid({
  wordLength,
  maxGuesses,
  guesses,
  buffer,
  phase,
  shake,
  neutralSubmittedTiles = false,
  hideLettersForSubmittedRows = false,
  hideFeedbackForRow,
  blockedCellByRow = null,
  blockedCellsByRow = null,
  rowWordLengths = null,
  emptyRowFeedback = null,
  reverseSlots = null,
  reverseClearedRows = null,
  reverseNeutralPatternPreview = false,
  pickSkipColumn = null,
  pickSkipSelection = null,
  pickSkipMaxRowExclusive,
  typingRowCellsOverride = null,
}: WordleGridProps) {
  const slotReverse = reverseSlots != null && reverseSlots.length > 0
  const slotCount = slotReverse ? reverseSlots!.length : 0
  const cleared = reverseClearedRows
  const showTypingRow =
    !reverseNeutralPatternPreview &&
    slotReverse &&
    phase === 'playing' &&
    reverseSlots!.some((c, r) => !cleared?.[r] && c === null)
  const visualRowCount = slotReverse
    ? reverseSlots!.filter((_, r) => !cleared?.[r]).length + (showTypingRow ? 1 : 0)
    : maxGuesses

  const currentRow = guesses.length
  const pickSkipMax = pickSkipMaxRowExclusive ?? maxGuesses - 1
  const isPickSkipRow =
    Boolean(pickSkipColumn) && phase === 'playing' && currentRow < pickSkipMax && !slotReverse
  const widths: number[] = []
  for (let r = 0; r < (slotReverse ? visualRowCount : maxGuesses); r++) {
    const bi = getBlockedIndicesForRow(r, guesses, blockedCellsByRow, blockedCellByRow)
    const w = rowWidth(r, wordLength, rowWordLengths ?? undefined)
    widths.push(bi && bi.length > 0 ? wordLength : w)
  }
  const maxCols = Math.max(wordLength, ...widths)

  const rows: {
    cells: string
    feedback?: LetterFeedback[]
    blockedIndices: number[] | null
    colCount: number
  }[] = []

  if (slotReverse) {
    for (let r = 0; r < slotCount; r++) {
      if (cleared?.[r]) continue
      const cell = reverseSlots![r]
      if (cell) {
        const g = cell
        const fb = g.displayFeedback ?? g.feedback
        rows.push({
          cells: g.letters.padEnd(wordLength, ' '),
          feedback: fb,
          blockedIndices: null,
          colCount: wordLength,
        })
      } else if (emptyRowFeedback?.[r] && !reverseNeutralPatternPreview) {
        rows.push({
          cells: ' '.repeat(wordLength),
          feedback: emptyRowFeedback[r],
          blockedIndices: null,
          colCount: wordLength,
        })
      } else {
        rows.push({
          cells: ' '.repeat(wordLength),
          feedback: undefined,
          blockedIndices: null,
          colCount: wordLength,
        })
      }
    }
    if (showTypingRow) {
      rows.push({
        cells: buffer.padEnd(wordLength, ' '),
        feedback: undefined,
        blockedIndices: null,
        colCount: wordLength,
      })
    }
  } else
    for (let r = 0; r < maxGuesses; r++) {
      const blockedIndices = getBlockedIndicesForRow(r, guesses, blockedCellsByRow, blockedCellByRow)
      const colCount =
        blockedIndices && blockedIndices.length > 0
          ? wordLength
          : rowWidth(r, wordLength, rowWordLengths ?? undefined)

      if (r < guesses.length) {
        const g = guesses[r]!
        const fb = g.displayFeedback ?? g.feedback
        let cells: string
        if (blockedIndices && blockedIndices.length > 0) {
          cells = expandBlockedMulti(g.letters, blockedIndices, wordLength)
        } else {
          cells = g.letters.padEnd(colCount, ' ')
        }
        rows.push({ cells, feedback: fb, blockedIndices, colCount })
      } else if (r === currentRow && phase === 'playing') {
        let cells: string
        if (typingRowCellsOverride != null) {
          cells = typingRowCellsOverride.padEnd(wordLength, ' ').slice(0, wordLength)
        } else if (blockedIndices && blockedIndices.length > 0) {
          cells = expandBlockedMulti(buffer, blockedIndices, wordLength)
        } else {
          cells = buffer.padEnd(colCount, ' ')
        }
        rows.push({ cells, feedback: undefined, blockedIndices, colCount })
      } else if (emptyRowFeedback?.[r] && r > currentRow && phase === 'playing') {
        rows.push({
          cells: ' '.repeat(wordLength),
          feedback: emptyRowFeedback[r],
          blockedIndices: null,
          colCount: wordLength,
        })
      } else {
        const pad = blockedIndices && blockedIndices.length > 0 ? wordLength : colCount
        rows.push({
          cells: ' '.repeat(pad),
          feedback: undefined,
          blockedIndices,
          colCount: pad,
        })
      }
    }

  return (
    <div
      className={`wordle-grid ${shake ? 'wordle-grid--shake' : ''}`}
      data-cols={maxCols}
      role="grid"
      aria-label="Guess grid"
    >
      {rows.map((row, ri) => (
        <div key={ri} className="wordle-row" role="row">
          {Array.from({ length: row.colCount }, (_, i) => {
            const ch = row.cells[i] ?? ' '
            const blockedSet = row.blockedIndices ? new Set(row.blockedIndices) : null
            const isBlocked = blockedSet ? blockedSet.has(i) : false
            const filled = ch.trim().length > 0
            let fb = row.feedback?.[i]
            if (hideFeedbackForRow?.(ri)) {
              fb = undefined
            }
            const rowIsFilledGuess = slotReverse
              ? (() => {
                  let seen = 0
                  for (let rr = 0; rr < slotCount; rr++) {
                    if (cleared?.[rr]) continue
                    if (seen === ri) return reverseSlots![rr] != null
                    seen++
                  }
                  return false
                })()
              : ri < guesses.length
            const useNeutral =
              neutralSubmittedTiles && rowIsFilledGuess && row.feedback !== undefined
            const hideLetter =
              hideLettersForSubmittedRows && rowIsFilledGuess && row.feedback !== undefined
            const tileCls = [
              tileClass(fb, filled, useNeutral, isBlocked),
              isPickSkipRow && ri === currentRow && i < wordLength ? 'wordle-tile--pick-skip' : '',
              isPickSkipRow &&
              ri === currentRow &&
              pickSkipSelection === i &&
              i < wordLength
                ? 'wordle-tile--pick-skip-selected'
                : '',
            ]
              .filter(Boolean)
              .join(' ')
            const showPick = isPickSkipRow && ri === currentRow && i < wordLength
            const inner = hideLetter ? '' : filled ? ch : ''
            if (showPick && pickSkipColumn) {
              return (
                <div
                  key={i}
                  className={tileCls}
                  role="button"
                  aria-label={
                    pickSkipSelection === i
                      ? `Column ${i + 1}, wildcard selected`
                      : `Column ${i + 1}, set as wildcard`
                  }
                  aria-pressed={pickSkipSelection === i}
                  tabIndex={-1}
                  onMouseDown={(e) => {
                    e.preventDefault()
                  }}
                  onClick={() => pickSkipColumn(i)}
                >
                  {inner}
                </div>
              )
            }
            return (
              <div key={i} className={tileCls} role="gridcell">
                {inner}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
