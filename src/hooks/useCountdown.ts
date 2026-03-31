import { useEffect, useRef, useState } from 'react'

/**
 * Per-round countdown. When `seconds` is null, timer is disabled.
 * Restarts when `resetKey` or `seconds` changes.
 */
export function useCountdown(
  seconds: number | null,
  options: { active: boolean; resetKey: string | number; onExpire: () => void },
) {
  const { active, resetKey, onExpire } = options
  const [left, setLeft] = useState(0)
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  useEffect(() => {
    if (seconds == null) {
      setLeft(0)
      return
    }
    setLeft(seconds)
  }, [seconds, resetKey])

  useEffect(() => {
    if (seconds == null || !active) return
    let remaining = seconds
    setLeft(remaining)
    const id = window.setInterval(() => {
      remaining -= 1
      setLeft(remaining)
      if (remaining <= 0) {
        window.clearInterval(id)
        onExpireRef.current()
      }
    }, 1000)
    return () => window.clearInterval(id)
  }, [seconds, resetKey, active])

  return seconds == null ? null : left
}
