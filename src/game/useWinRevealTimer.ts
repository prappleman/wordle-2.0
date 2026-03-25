import { useCallback, useEffect, useRef } from 'react'
import { WIN_REVEAL_MS } from './winReveal'

/** Schedules a callback after {@link WIN_REVEAL_MS}; clears on unmount and when `clear()` runs. */
export function useWinRevealTimer() {
  const ref = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clear = useCallback(() => {
    if (ref.current != null) {
      window.clearTimeout(ref.current)
      ref.current = null
    }
  }, [])
  useEffect(() => () => clear(), [clear])
  const schedule = useCallback(
    (fn: () => void) => {
      clear()
      ref.current = window.setTimeout(() => {
        ref.current = null
        fn()
      }, WIN_REVEAL_MS)
    },
    [clear],
  )
  return { schedule, clear }
}
