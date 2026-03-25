import { useCallback, useEffect, useState } from 'react'
import { nextLadderInRange, type LadderAdvanceMode } from '../variants/ladderRange'

/**
 * Ladder length + optional "ladder finished" state for modes that stop after the last rung (`stop`).
 * `wrap` modes never set ladderDone.
 */
export function useLadderSession(lo: number, hi: number, mode: LadderAdvanceMode, variantId: string) {
  const [length, setLength] = useState(lo)
  const [ladderDone, setLadderDone] = useState(false)
  const [session, setSession] = useState(0)

  useEffect(() => {
    setLength(lo)
    setLadderDone(false)
    setSession((s) => s + 1)
  }, [variantId, lo, hi])

  const onAdvance = useCallback(() => {
    setLength((prev) => {
      const n = nextLadderInRange(prev, lo, hi, mode)
      if (n === null) {
        setLadderDone(true)
        return prev
      }
      return n
    })
  }, [lo, hi, mode])

  const resetToStart = useCallback(() => {
    setLength(lo)
    setLadderDone(false)
    setSession((s) => s + 1)
  }, [lo])

  return { length, session, ladderDone, onAdvance, resetToStart }
}
