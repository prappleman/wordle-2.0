import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { parseLadderRangeFromSearch } from '../variants/ladderRange'
import { wordLengthFromVariantId } from '../variants/variantWordLength'

/** `ladder-multi-*` ids end in board count, not word length — do not take start from the path. */
function variantStartForLadder(variantId: string): number | null {
  if (/^ladder-multi-\d+$/.test(variantId)) return null
  return wordLengthFromVariantId(variantId)
}

export function useLadderRange(variantId: string) {
  const [searchParams] = useSearchParams()
  return useMemo(
    () => parseLadderRangeFromSearch(searchParams, variantStartForLadder(variantId)),
    [searchParams, variantId],
  )
}
