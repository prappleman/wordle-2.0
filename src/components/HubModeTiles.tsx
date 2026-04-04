import type { ReactNode } from 'react'
import { CROSS6_SLOTS } from '../game/cross6DragPuzzle'
import { PERIMETER_SLOTS } from '../game/frameDragPuzzle'
import { PLUS_SLOTS } from '../game/plusDragPuzzle'
import type { HubTilePreset } from './hubModeThemes'
import './HubModeTiles.css'

type HubModeTilesProps = {
  preset: HubTilePreset
  /** Pin cards use slightly smaller tiles */
  compact?: boolean
  /** Multi-board: one guess row per board (browse + pin). Defaults to 4 if omitted. */
  boardCount?: number
}

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}

type FeedbackTile = 'correct' | 'present' | 'absent'

/** Five varied classic feedback rows — 5×5 square preview */
const CLASSIC_GUESS_ROWS: FeedbackTile[][] = [
  ['correct', 'present', 'absent', 'present', 'correct'],
  ['absent', 'correct', 'correct', 'absent', 'present'],
  ['present', 'absent', 'correct', 'present', 'absent'],
  ['correct', 'correct', 'absent', 'absent', 'present'],
  ['absent', 'present', 'present', 'correct', 'absent'],
]

function HubClassicGuessRow({ tiles }: { tiles: FeedbackTile[] }) {
  return (
    <div className="wordle-row">
      {tiles.map((t, i) => (
        <span
          key={i}
          className={cx(
            'wordle-tile',
            t === 'correct' && 'wordle-tile--correct',
            t === 'present' && 'wordle-tile--present',
            t === 'absent' && 'wordle-tile--absent',
          )}
          aria-hidden
        />
      ))}
    </div>
  )
}

function FiveClassicGuessRows() {
  return (
    <>
      {CLASSIC_GUESS_ROWS.map((tiles, i) => (
        <HubClassicGuessRow key={i} tiles={tiles} />
      ))}
    </>
  )
}

/**
 * Square (frame drag): perimeter only (same slots as play). Center is empty grid space — no tiles.
 * Colors follow {@link PERIMETER_SLOTS} order.
 */
const SQUARE_HUB_PERIMETER_FEEDBACK: FeedbackTile[] = [
  'present', 'absent', 'correct', 'present', 'correct',
  'correct', 'absent',
  'present', 'correct',
  'absent', 'present',
  'correct', 'present', 'absent', 'correct', 'present',
]

function SquareHubPreview() {
  return (
    <div className="hub-viz-square-perimeter-grid" aria-hidden>
      {PERIMETER_SLOTS.map(([r, c], i) => {
        const t = SQUARE_HUB_PERIMETER_FEEDBACK[i]!
        return (
          <span
            key={`${r},${c}`}
            className={cx(
              'wordle-tile',
              'hub-viz-square-perimeter-tile',
              t === 'correct' && 'wordle-tile--correct',
              t === 'present' && 'wordle-tile--present',
              t === 'absent' && 'wordle-tile--absent',
            )}
            style={{ gridRow: r + 1, gridColumn: c + 1 }}
            aria-hidden
          />
        )
      })}
    </div>
  )
}

/**
 * Waffle (cross6): 5×5 grid; playable cells match {@link CROSS6_SLOTS} (border + middle row/column).
 * Four inner corners are empty — same layout as play.
 */
const WAFFLE_HUB_FEEDBACK: FeedbackTile[] = [
  'present', 'correct', 'absent', 'present', 'correct',
  'absent', 'present', 'correct',
  'correct', 'present', 'absent', 'correct', 'present',
  'present', 'correct', 'absent',
  'absent', 'correct', 'present', 'absent', 'correct',
]

function WaffleHubPreview() {
  return (
    <div className="hub-viz-waffle-grid" aria-hidden>
      {CROSS6_SLOTS.map(([r, c], i) => {
        const t = WAFFLE_HUB_FEEDBACK[i]!
        return (
          <span
            key={`${r},${c}`}
            className={cx(
              'wordle-tile',
              'hub-viz-waffle-tile',
              t === 'correct' && 'wordle-tile--correct',
              t === 'present' && 'wordle-tile--present',
              t === 'absent' && 'wordle-tile--absent',
            )}
            style={{ gridRow: r + 1, gridColumn: c + 1 }}
            aria-hidden
          />
        )
      })}
    </div>
  )
}

/**
 * Plus: middle row + middle column only ({@link PLUS_SLOTS}, 9 cells). Corner quadrants are open.
 */
const PLUS_HUB_FEEDBACK: FeedbackTile[] = [
  'present', 'correct',
  'absent', 'present', 'correct', 'present', 'absent',
  'correct', 'present',
]

function PlusHubPreview() {
  return (
    <div className="hub-viz-plus-grid" aria-hidden>
      {PLUS_SLOTS.map(([r, c], i) => {
        const t = PLUS_HUB_FEEDBACK[i]!
        return (
          <span
            key={`${r},${c}`}
            className={cx(
              'wordle-tile',
              'hub-viz-plus-tile',
              t === 'correct' && 'wordle-tile--correct',
              t === 'present' && 'wordle-tile--present',
              t === 'absent' && 'wordle-tile--absent',
            )}
            style={{ gridRow: r + 1, gridColumn: c + 1 }}
            aria-hidden
          />
        )
      })}
    </div>
  )
}

/** Unscramble hub (`dim` preset): rows 1 & 5 all green; middle three only yellow/green (no grey). */
const UNSCRAMBLE_HUB_ROWS: FeedbackTile[][] = [
  ['correct', 'correct', 'correct', 'correct', 'correct'],
  ['present', 'correct', 'present', 'correct', 'present'],
  ['correct', 'present', 'present', 'correct', 'correct'],
  ['present', 'present', 'correct', 'present', 'correct'],
  ['correct', 'correct', 'correct', 'correct', 'correct'],
]

function UnscrambleHubPreview() {
  return (
    <>
      {UNSCRAMBLE_HUB_ROWS.map((tiles, i) => (
        <HubClassicGuessRow key={i} tiles={tiles} />
      ))}
    </>
  )
}

/**
 * Alternating (dual): rows 2 & 4 all grey (Word B turns). Rows 1 & 3 ramp toward green; row 5 is all correct.
 */
const ALTERNATING_DUET_HUB_ROWS: (FeedbackTile[] | 'grey')[] = [
  ['absent', 'absent', 'present', 'correct', 'correct'],
  'grey',
  ['present', 'correct', 'correct', 'correct', 'correct'],
  'grey',
  ['correct', 'correct', 'correct', 'correct', 'correct'],
]

function AlternatingDuetHubPreview() {
  return (
    <>
      {ALTERNATING_DUET_HUB_ROWS.map((row, ri) => (
        <div key={ri} className="wordle-row">
          {row === 'grey'
            ? [0, 1, 2, 3, 4].map((i) => (
                <span key={i} className="wordle-tile wordle-tile--absent" aria-hidden />
              ))
            : row.map((t, i) => (
                <span
                  key={i}
                  className={cx(
                    'wordle-tile',
                    t === 'correct' && 'wordle-tile--correct',
                    t === 'present' && 'wordle-tile--present',
                    t === 'absent' && 'wordle-tile--absent',
                  )}
                  aria-hidden
                />
              ))}
        </div>
      ))}
    </>
  )
}

/** Banned mode: classic solve + red ring on one tile (invalid-if-submitted hint). */
function BannedHubPreview() {
  return (
    <>
      {CLASSIC_SOLVE_ROWS.map((tiles, ri) => (
        <div key={ri} className="wordle-row">
          {tiles.map((t, i) => (
            <span
              key={i}
              className={cx(
                'wordle-tile',
                t === 'correct' && 'wordle-tile--correct',
                t === 'present' && 'wordle-tile--present',
                t === 'absent' && 'wordle-tile--absent',
                ri === 0 && i === 2 && 'hub-viz-tile--banned-reject',
              )}
              aria-hidden
            />
          ))}
        </div>
      ))}
    </>
  )
}

/** Forced letter: classic solve + green ring (required letter in the current guess). */
function ForcedLetterHubPreview() {
  return (
    <>
      {CLASSIC_SOLVE_ROWS.map((tiles, ri) => (
        <div key={ri} className="wordle-row">
          {tiles.map((t, i) => (
            <span
              key={i}
              className={cx(
                'wordle-tile',
                t === 'correct' && 'wordle-tile--correct',
                t === 'present' && 'wordle-tile--present',
                t === 'absent' && 'wordle-tile--absent',
                ri === 0 && i === 2 && 'hub-viz-tile--forced-letter',
              )}
              aria-hidden
            />
          ))}
        </div>
      ))}
    </>
  )
}

/** Locked letter: green ring moves to a different column each row (slot + letter vary). */
const LOCKED_LETTER_RING_COL = [2, 0, 4, 1, 3]

function LockedLetterHubPreview() {
  return (
    <>
      {CLASSIC_SOLVE_ROWS.map((tiles, ri) => (
        <div key={ri} className="wordle-row">
          {tiles.map((t, i) => (
            <span
              key={i}
              className={cx(
                'wordle-tile',
                t === 'correct' && 'wordle-tile--correct',
                t === 'present' && 'wordle-tile--present',
                t === 'absent' && 'wordle-tile--absent',
                i === LOCKED_LETTER_RING_COL[ri] && 'hub-viz-tile--forced-letter',
              )}
              aria-hidden
            />
          ))}
        </div>
      ))}
    </>
  )
}

/**
 * Browse hub preview for Classic section games (Classic, Zen, Zen Infinite, Infinite).
 * Reads like a real solve: no greens on the first guess, greens only accumulate downward
 * (a correct letter stays green on every row below), more green toward the bottom, last row wins.
 */
const CLASSIC_SOLVE_ROWS: FeedbackTile[][] = [
  ['present', 'absent', 'absent', 'present', 'absent'],
  ['present', 'absent', 'absent', 'correct', 'absent'],
  ['present', 'correct', 'absent', 'correct', 'present'],
  ['correct', 'correct', 'present', 'correct', 'correct'],
  ['correct', 'correct', 'correct', 'correct', 'correct'],
]

/** Lie column per row for first four guesses only; last row is all green with no marker. */
const MISLEADING_HUB_LIE_COL_FIRST = [2, 0, 4, 1] as const

function MisleadingTileHubPreview() {
  return (
    <>
      {CLASSIC_SOLVE_ROWS.map((tiles, ri) => (
        <div key={ri} className="wordle-row">
          {tiles.map((t, i) => {
            const lieCol = ri < MISLEADING_HUB_LIE_COL_FIRST.length ? MISLEADING_HUB_LIE_COL_FIRST[ri] : null
            const showX = lieCol !== null && i === lieCol
            return (
              <span
                key={i}
                className={cx(
                  'wordle-tile',
                  t === 'correct' && 'wordle-tile--correct',
                  t === 'present' && 'wordle-tile--present',
                  t === 'absent' && 'wordle-tile--absent',
                  showX && 'wordle-tile--misleading-overlay',
                )}
                aria-hidden
              >
                {showX ? (
                  <span className="hub-viz-misleading-x" aria-hidden>
                    X
                  </span>
                ) : null}
              </span>
            )
          })}
        </div>
      ))}
    </>
  )
}

function ClassicHubSolvePreview() {
  return (
    <>
      {CLASSIC_SOLVE_ROWS.map((tiles, i) => (
        <HubClassicGuessRow key={i} tiles={tiles} />
      ))}
    </>
  )
}

/** Same progression as classic solve; green/yellow both use colorless “in word” white tiles. */
function ColorlessHubSolvePreview() {
  return (
    <>
      {CLASSIC_SOLVE_ROWS.map((tiles, ri) => (
        <div key={ri} className="wordle-row">
          {tiles.map((t, i) => (
            <span
              key={i}
              className={cx(
                'wordle-tile',
                t === 'absent' ? 'wordle-tile--absent' : 'wordle-tile--colorless-correct',
              )}
              aria-hidden
            />
          ))}
        </div>
      ))}
    </>
  )
}

function classicRowToWord500Counts(tiles: FeedbackTile[]): { g: string; y: string; r: string } {
  let g = 0
  let y = 0
  let r = 0
  for (const t of tiles) {
    if (t === 'correct') g++
    else if (t === 'present') y++
    else r++
  }
  return { g: String(g), y: String(y), r: String(r) }
}

/** Word 500: G/Y/R counts per row match the classic solve example (green/yellow/absent tallies). */
function Word500CountsOnlyRows() {
  const rows = CLASSIC_SOLVE_ROWS.map((tiles) => classicRowToWord500Counts(tiles))
  return (
    <>
      {rows.map((row, i) => (
        <div key={i} className="hub-viz-word500-counts-only-row">
          <div className="word500-counts">
            <span className="word500-count-cell word500-count-cell--green">
              <span className="word500-count-num">{row.g}</span>
            </span>
            <span className="word500-count-cell word500-count-cell--yellow">
              <span className="word500-count-num">{row.y}</span>
            </span>
            <span className="word500-count-cell word500-count-cell--red">
              <span className="word500-count-num">{row.r}</span>
            </span>
          </div>
        </div>
      ))}
    </>
  )
}

/** Memory colors: same 5×5 grid shape; tiles are grey (feedback hidden until recall). */
function MemoryColorsHubPreview() {
  return (
    <>
      {CLASSIC_SOLVE_ROWS.map((_, ri) => (
        <div key={ri} className="wordle-row">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="wordle-tile wordle-tile--absent" aria-hidden />
          ))}
        </div>
      ))}
    </>
  )
}

/** Word chain: white start/goal; scoring rows greens on columns 1,3,5 then add column 2, then all five. */
const CHAIN_HUB_SCORING_ROWS: FeedbackTile[][] = [
  ['correct', 'absent', 'correct', 'absent', 'correct'],
  ['correct', 'correct', 'correct', 'absent', 'correct'],
  ['correct', 'correct', 'correct', 'correct', 'correct'],
]

function FiveChainGuessRows() {
  return (
    <>
      <div className="wordle-row">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="wordle-tile word-chain-hub-tile--white" aria-hidden />
        ))}
      </div>
      {CHAIN_HUB_SCORING_ROWS.map((tiles, ri) => (
        <HubClassicGuessRow key={ri} tiles={tiles} />
      ))}
      <div className="wordle-row">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="wordle-tile word-chain-hub-tile--white" aria-hidden />
        ))}
      </div>
    </>
  )
}

/** One classic row per board — stack shows board count */
function MultiBoardsOneRowEach({ boardCount }: { boardCount: number }) {
  const n = Math.max(1, Math.min(boardCount, 16))
  return (
    <div className="hub-viz-multi-stacked">
      {Array.from({ length: n }, (_, i) => (
        <HubClassicGuessRow key={i} tiles={CLASSIC_GUESS_ROWS[i % CLASSIC_GUESS_ROWS.length]} />
      ))}
    </div>
  )
}

/** Repeat: grey rows only; same lock column every row with “A” (no Wordle colors on the card). */
const REPEAT_HUB_ROW_COUNT = 5
const REPEAT_HUB_LOCK_INDEX = 2

function RepeatHubPreview() {
  return (
    <>
      {Array.from({ length: REPEAT_HUB_ROW_COUNT }, (_, ri) => (
        <div key={ri} className="wordle-row">
          {Array.from({ length: 5 }, (__, i) => {
            const isLock = i === REPEAT_HUB_LOCK_INDEX
            return (
              <span
                key={i}
                className={cx(
                  'wordle-tile',
                  'wordle-tile--absent',
                  isLock && 'hub-viz-repeat-letter',
                )}
                aria-hidden
              >
                {isLock ? 'a' : null}
              </span>
            )
          })}
        </div>
      ))}
    </>
  )
}

function WildcardGuessRow({ wildcardIdx, pattern }: { wildcardIdx: number; pattern: FeedbackTile[] }) {
  return (
    <div className="wordle-row">
      {[0, 1, 2, 3, 4].map((i) =>
        i === wildcardIdx ? (
          <span key={i} className="wordle-tile wordle-tile--blocked" aria-hidden />
        ) : (
          <span
            key={i}
            className={cx(
              'wordle-tile',
              pattern[i] === 'correct' && 'wordle-tile--correct',
              pattern[i] === 'present' && 'wordle-tile--present',
              pattern[i] === 'absent' && 'wordle-tile--absent',
            )}
            aria-hidden
          />
        ),
      )}
    </div>
  )
}

function FiveWildcardGuessRows() {
  return (
    <>
      <WildcardGuessRow wildcardIdx={1} pattern={CLASSIC_GUESS_ROWS[0]} />
      <WildcardGuessRow wildcardIdx={3} pattern={CLASSIC_GUESS_ROWS[1]} />
      <WildcardGuessRow wildcardIdx={2} pattern={CLASSIC_GUESS_ROWS[2]} />
      <WildcardGuessRow wildcardIdx={0} pattern={CLASSIC_GUESS_ROWS[3]} />
      <WildcardGuessRow wildcardIdx={4} pattern={CLASSIC_GUESS_ROWS[4]} />
    </>
  )
}

const DOUBLES_ROWS: FeedbackTile[][] = [
  ['absent', 'present', 'present', 'absent', 'correct'],
  ['present', 'absent', 'present', 'present', 'absent'],
  ['correct', 'present', 'present', 'correct', 'absent'],
  ['absent', 'absent', 'present', 'present', 'correct'],
  ['present', 'present', 'absent', 'correct', 'absent'],
]

function FiveDoublesGuessRows() {
  return (
    <>
      {DOUBLES_ROWS.map((tiles, i) => (
        <HubClassicGuessRow key={i} tiles={tiles} />
      ))}
    </>
  )
}

export function HubModeTiles({ preset, compact, boardCount }: HubModeTilesProps) {
  const multiCount = preset === 'multi' ? (boardCount ?? 4) : 0
  const multiTight = preset === 'multi' && multiCount > 4

  const wrap = (inner: ReactNode) => (
    <div
      className={cx('hub-viz', compact && 'hub-viz--compact', multiTight && 'hub-viz--multi-tight')}
      data-preset={preset}
    >
      {inner}
    </div>
  )

  switch (preset) {
    case 'square':
      return wrap(<SquareHubPreview />)
    case 'waffle':
      return wrap(<WaffleHubPreview />)
    case 'plus':
      return wrap(<PlusHubPreview />)
    case 'colorless':
      return wrap(<ColorlessHubSolvePreview />)
    case 'multi':
      return wrap(<MultiBoardsOneRowEach boardCount={multiCount} />)
    case 'dual':
      return wrap(<AlternatingDuetHubPreview />)
    case 'notes':
      return wrap(<Word500CountsOnlyRows />)
    case 'chain':
      return wrap(<FiveChainGuessRows />)
    case 'zen':
    case 'infinite':
    case 'wordle':
    default:
      return wrap(<ClassicHubSolvePreview />)
    case 'misleading':
      return wrap(<MisleadingTileHubPreview />)
    case 'memoryHide':
    case 'reverse':
      return wrap(<FiveClassicGuessRows />)
    case 'forced':
      return wrap(<ForcedLetterHubPreview />)
    case 'lockedLetter':
      return wrap(<LockedLetterHubPreview />)
    case 'memoryFlash':
      return wrap(<MemoryColorsHubPreview />)
    case 'banned':
      return wrap(<BannedHubPreview />)
    case 'dim':
      return wrap(<UnscrambleHubPreview />)
    case 'repeat':
      return wrap(<RepeatHubPreview />)
    case 'wildcard':
    case 'spaces':
      return wrap(<FiveWildcardGuessRows />)
    case 'doubles':
      return wrap(<FiveDoublesGuessRows />)
  }
}
