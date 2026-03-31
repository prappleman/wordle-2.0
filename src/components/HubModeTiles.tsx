import type { ReactNode } from 'react'
import type { HubTilePreset } from './hubModeThemes'
import './HubModeTiles.css'

type HubModeTilesProps = {
  preset: HubTilePreset
  /** Pin cards use slightly smaller tiles */
  compact?: boolean
}

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}

/** Typical submitted row — matches classic Wordle feedback styling */
function ClassicRow() {
  return (
    <div className="wordle-row">
      <span className="wordle-tile wordle-tile--correct" aria-hidden />
      <span className="wordle-tile wordle-tile--present" aria-hidden />
      <span className="wordle-tile wordle-tile--absent" aria-hidden />
      <span className="wordle-tile wordle-tile--present" aria-hidden />
      <span className="wordle-tile wordle-tile--correct" aria-hidden />
    </div>
  )
}

/** Colorless: highlight for in-word, gray for absent (see ColorlessScreen + --colorless-highlight-*) */
function ColorlessRow() {
  const pattern: Array<'in' | 'out'> = ['in', 'in', 'out', 'in', 'in']
  return (
    <div className="wordle-row">
      {pattern.map((p, i) => (
        <span
          key={i}
          className={cx('wordle-tile', p === 'in' ? 'wordle-tile--colorless-correct' : 'wordle-tile--absent')}
          aria-hidden
        />
      ))}
    </div>
  )
}

/** Word 500: letter tiles + G/Y/R count column (see Word500Screen) */
function Word500Row() {
  return (
    <div className="hub-viz-word500-row">
      <div className="word500-tiles">
        <span className="word500-tile word500-tile--note-green" aria-hidden />
        <span className="word500-tile word500-tile--note-yellow" aria-hidden />
        <span className="word500-tile word500-tile--note-red" aria-hidden />
        <span className="word500-tile word500-tile--note-green" aria-hidden />
        <span className="word500-tile word500-tile--note-yellow" aria-hidden />
      </div>
      <div className="word500-counts">
        <span className="word500-count-cell word500-count-cell--green">
          <span className="word500-count-num">2</span>
        </span>
        <span className="word500-count-cell word500-count-cell--yellow">
          <span className="word500-count-num">1</span>
        </span>
        <span className="word500-count-cell word500-count-cell--red">
          <span className="word500-count-num">1</span>
        </span>
      </div>
    </div>
  )
}

/** Word chain: anchor row + green-only scoring row (see WordChainBoard) */
function ChainRows() {
  return (
    <>
      <div className="wordle-row">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="wordle-tile word-chain-tile--endpoint" aria-hidden />
        ))}
      </div>
      <div className="wordle-row">
        <span className="wordle-tile wordle-tile--correct" aria-hidden />
        <span className="wordle-tile wordle-tile--absent" aria-hidden />
        <span className="wordle-tile wordle-tile--correct" aria-hidden />
        <span className="wordle-tile wordle-tile--absent" aria-hidden />
        <span className="wordle-tile wordle-tile--correct" aria-hidden />
      </div>
    </>
  )
}

/** Unscramble: green length row + normal grid (see UnscrambleScreen) */
function UnscrambleStack() {
  return (
    <>
      <div className="wordle-row">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="wordle-tile wordle-tile--correct wordle-tile--unscramble-blank" aria-hidden />
        ))}
      </div>
      <ClassicRow />
    </>
  )
}

/** Multi-board: four Wordle strips in 2×2 (see MultiWordleScreen boards grid) */
function MultiBoards() {
  return (
    <div className="hub-viz-multi-boards">
      {[0, 1, 2, 3].map((b) => (
        <div key={b} className="wordle-row">
          <span className="wordle-tile wordle-tile--correct" aria-hidden />
          <span className="wordle-tile wordle-tile--present" aria-hidden />
          <span className="wordle-tile wordle-tile--absent" aria-hidden />
          <span className="wordle-tile wordle-tile--present" aria-hidden />
          <span className="wordle-tile wordle-tile--correct" aria-hidden />
        </div>
      ))}
    </div>
  )
}

/** Locked slot row (see LockedScreen locked-tile) */
function LockedRow() {
  return (
    <div className="hub-viz-locked-row">
      <span className="locked-tile" aria-hidden />
      <span className="locked-tile" aria-hidden />
      <span className="locked-tile locked-tile--lock-hint" aria-hidden>
        A
      </span>
      <span className="locked-tile" aria-hidden />
      <span className="locked-tile" aria-hidden />
    </div>
  )
}

/** Blocked wildcard column (see WordleGrid blocked + WordleGrid.css) */
function BlockedWildcardRow() {
  return (
    <div className="wordle-row">
      <span className="wordle-tile wordle-tile--correct" aria-hidden />
      <span className="wordle-tile wordle-tile--blocked" aria-hidden />
      <span className="wordle-tile wordle-tile--present" aria-hidden />
      <span className="wordle-tile wordle-tile--absent" aria-hidden />
      <span className="wordle-tile wordle-tile--correct" aria-hidden />
    </div>
  )
}

/** Doubles: emphasize a repeated pair (two “present” in the middle) */
function DoublesRow() {
  return (
    <div className="wordle-row">
      <span className="wordle-tile wordle-tile--absent" aria-hidden />
      <span className="wordle-tile wordle-tile--present" aria-hidden />
      <span className="wordle-tile wordle-tile--present" aria-hidden />
      <span className="wordle-tile wordle-tile--absent" aria-hidden />
      <span className="wordle-tile wordle-tile--correct" aria-hidden />
    </div>
  )
}

export function HubModeTiles({ preset, compact }: HubModeTilesProps) {
  const wrap = (inner: ReactNode) => (
    <div className={cx('hub-viz', compact && 'hub-viz--compact')} data-preset={preset}>
      {inner}
    </div>
  )

  switch (preset) {
    case 'colorless':
      return wrap(<ColorlessRow />)
    case 'multi':
      return wrap(<MultiBoards />)
    case 'dual':
      return wrap(<ClassicRow />)
    case 'notes':
      return wrap(<Word500Row />)
    case 'chain':
      return wrap(<ChainRows />)
    case 'streak':
    case 'misleading':
    case 'zen':
    case 'infinite':
    case 'banned':
    case 'memoryFlash':
    case 'memoryHide':
    case 'reverse':
    case 'forced':
      return wrap(<ClassicRow />)
    case 'dim':
      return wrap(<UnscrambleStack />)
    case 'locked':
      return wrap(<LockedRow />)
    case 'blocked':
    case 'spaces':
      return wrap(<BlockedWildcardRow />)
    case 'doubles':
      return wrap(<DoublesRow />)
    case 'wordle':
    default:
      return wrap(<ClassicRow />)
  }
}
