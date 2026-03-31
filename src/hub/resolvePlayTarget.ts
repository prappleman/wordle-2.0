import { ladderRangeQuery } from '../variants/ladderRange'
import type { HubPin } from './types'

/**
 * Same rules as legacy HubPage `computeVariantId` + ladder query.
 */
export function computeVariantId(
  idPrefix: string,
  wordLength: number,
  ladderMode: boolean,
  ladderStart: number,
): string {
  if (!ladderMode) return `${idPrefix}-${wordLength}`
  if (idPrefix === 'zen-infinite') return `zen-infinite-${wordLength}`
  const startLen = ladderStart
  if (idPrefix === 'classic') return `growing-word-${startLen}`
  return `ladder-${idPrefix}-${startLen}`
}

export function ladderSearchString(ladderStart: number, ladderEnd: number): string {
  return ladderRangeQuery(ladderStart, ladderEnd)
}

/** Multi-board play target (see HubMultiGridCard). */
export function computeMultiPlayTarget(
  boardCount: number,
  wordLength: number,
  ladderMode: boolean,
  ladderStart: number,
  ladderEnd: number,
): { variantId: string; search: string } {
  const search = ladderMode ? ladderSearchString(ladderStart, ladderEnd) : ''
  if (ladderMode) {
    return { variantId: `ladder-multi-${boardCount}`, search }
  }
  return { variantId: `multi-${wordLength}-${boardCount}`, search: '' }
}

export function playHrefFromPin(pin: HubPin): string {
  if (pin.kind === 'multiGrid') {
    const { variantId, search } = computeMultiPlayTarget(
      pin.boardCount,
      pin.wordLength,
      pin.ladderMode,
      pin.ladderStart,
      pin.ladderEnd,
    )
    return `/play/${variantId}${search}`
  }
  const variantId = computeVariantId(
    pin.idPrefix,
    pin.wordLength,
    pin.ladderMode,
    pin.ladderStart,
  )
  const search = pin.ladderMode ? ladderSearchString(pin.ladderStart, pin.ladderEnd) : ''
  return `/play/${variantId}${search}`
}
