/** Clamp ladder rung to supported word lengths. */
export function clampLadderLength(n: number): number {
  if (!Number.isFinite(n)) return 2
  return Math.min(12, Math.max(2, Math.round(n)))
}

/**
 * Ladder span from URL + variant id. Path encodes first rung for most ladder ids;
 * `ladder-multi-*` has no word length in the path — use query only (defaults start 2, end 6).
 */
export function parseLadderRangeFromSearch(
  searchParams: URLSearchParams,
  variantStartLength: number | null,
): { lo: number; hi: number } {
  const startQ = searchParams.get('ladderStart') ?? searchParams.get('start')
  const endQ = searchParams.get('ladderEnd') ?? searchParams.get('end')

  const defaultEnd = 6
  const defaultStart = variantStartLength != null ? variantStartLength : 2

  const start =
    startQ != null && startQ !== '' ? clampLadderLength(Number(startQ)) : defaultStart
  const end = endQ != null && endQ !== '' ? clampLadderLength(Number(endQ)) : defaultEnd

  const lo = Math.min(start, end)
  const hi = Math.max(start, end)
  return { lo, hi }
}

/** `wrap`: after last rung, go back to first. `stop`: after last rung, ladder is finished (`null`). */
export type LadderAdvanceMode = 'wrap' | 'stop'

/**
 * Advance one rung within [lo, hi]. Returns `null` when `mode === 'stop'` and the ladder is complete
 * (including single-rung span: one solve finishes the ladder).
 */
export function nextLadderInRange(
  len: number,
  lo: number,
  hi: number,
  mode: LadderAdvanceMode = 'stop',
): number | null {
  const a = Math.min(lo, hi)
  const b = Math.max(lo, hi)
  if (a === b) {
    if (mode === 'wrap') return a
    return null
  }
  if (len === b) {
    if (mode === 'wrap') return a
    return null
  }
  if (len < a || len > b) return a
  return len + 1
}

export function ladderRangeQuery(start: number, end: number): string {
  const s = clampLadderLength(start)
  const e = clampLadderLength(end)
  return `?ladderStart=${s}&ladderEnd=${e}`
}

/** 1-based round index and total rungs for lengths `lo`…`hi` (e.g. 2–6 → 5 rounds). */
export function ladderRoundLabel(currentLength: number, lo: number, hi: number): { round: number; total: number } {
  const a = Math.min(lo, hi)
  const b = Math.max(lo, hi)
  const total = b - a + 1
  const clamped = Math.min(b, Math.max(a, currentLength))
  return { round: clamped - a + 1, total }
}
