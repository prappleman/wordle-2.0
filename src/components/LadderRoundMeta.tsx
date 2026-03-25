import { ladderRoundLabel } from '../variants/ladderRange'

/** Shows “Round 2/5” for the current ladder rung vs span `lo`–`hi`. */
export function LadderRoundMeta({
  currentLength,
  lo,
  hi,
  className,
}: {
  currentLength: number
  lo: number
  hi: number
  className?: string
}) {
  const { round, total } = ladderRoundLabel(currentLength, lo, hi)
  return (
    <div className={className} role="status">
      Round <strong>{round}</strong>/<strong>{total}</strong>
    </div>
  )
}
