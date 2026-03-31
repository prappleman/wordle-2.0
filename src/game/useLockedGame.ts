import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ClassicGameConfig } from '../variants/types'

const DEFAULT_SECONDS = 60

export type LockedPhase = 'pre' | 'playing' | 'ended'

function pickTarget(words: readonly string[], wordLength: number): string {
  const pool = words.filter((w) => w.length === wordLength)
  if (pool.length === 0) {
    throw new Error(`No words of length ${wordLength}`)
  }
  return pool[Math.floor(Math.random() * pool.length)]!.toUpperCase()
}

function buildRound(words: readonly string[], wordLength: number) {
  const t = pickTarget(words, wordLength)
  const pos = Math.floor(Math.random() * wordLength)
  const letter = t[pos]!
  let count = 0
  for (const w of words) {
    if (w.length === wordLength && w.toUpperCase()[pos] === letter) {
      count++
    }
  }
  return { lockPos: pos, lockLetter: letter, totalPossible: count }
}

export function useLockedGame(
  config: ClassicGameConfig & { timerSeconds?: number },
) {
  const { words, wordLength, timerSeconds = DEFAULT_SECONDS } = config

  const validSet = useMemo(() => {
    const s = new Set<string>()
    for (const w of words) {
      if (w.length === wordLength) {
        s.add(w.toUpperCase())
      }
    }
    return s
  }, [words, wordLength])

  const [round, setRound] = useState(() => buildRound(words, wordLength))
  const [submitted, setSubmitted] = useState<Set<string>>(new Set())
  const [buffer, setBuffer] = useState('')
  const [phase, setPhase] = useState<LockedPhase>('pre')
  const [shake, setShake] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(timerSeconds)

  useEffect(() => {
    if (phase !== 'playing') return
    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setPhase('ended')
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [phase])

  const startTimer = useCallback(() => {
    if (phase !== 'pre') return
    setSecondsLeft(timerSeconds)
    setPhase('playing')
  }, [phase, timerSeconds])

  const newGame = useCallback(() => {
    setRound(buildRound(words, wordLength))
    setSubmitted(new Set())
    setBuffer('')
    setPhase('pre')
    setShake(false)
    setSecondsLeft(timerSeconds)
  }, [words, wordLength, timerSeconds])

  const submit = useCallback(() => {
    if (phase !== 'playing') return
    const g = buffer.toUpperCase()
    if (g.length !== wordLength) return
    if (g[round.lockPos] !== round.lockLetter) {
      setShake(true)
      window.setTimeout(() => setShake(false), 450)
      return
    }
    if (!validSet.has(g)) {
      setShake(true)
      window.setTimeout(() => setShake(false), 450)
      return
    }
    if (submitted.has(g)) {
      setShake(true)
      window.setTimeout(() => setShake(false), 450)
      return
    }
    setSubmitted((prev) => new Set(prev).add(g))
    setBuffer('')
  }, [buffer, phase, round.lockLetter, round.lockPos, submitted, validSet, wordLength])

  const addLetter = useCallback(
    (ch: string) => {
      if (phase !== 'playing') return
      const c = ch.toUpperCase()
      if (!/^[A-Z]$/.test(c)) return
      if (buffer.length >= wordLength) return
      setBuffer((b) => b + c)
    },
    [buffer.length, phase, wordLength],
  )

  const backspace = useCallback(() => {
    if (phase !== 'playing') return
    setBuffer((b) => b.slice(0, -1))
  }, [phase])

  const onPhysicalKey = useCallback(
    (key: string) => {
      if (phase !== 'playing') return
      if (key === 'Enter') {
        submit()
        return
      }
      if (key === 'Backspace') {
        backspace()
        return
      }
      if (key.length === 1) {
        addLetter(key)
      }
    },
    [addLetter, backspace, phase, submit],
  )

  const submittedList = useMemo(() => [...submitted], [submitted])

  /** Next typing slot (cursor); 0 .. wordLength-1 */
  const cursorIndex = buffer.length

  const inputLocked = phase !== 'playing'

  return {
    lockPos: round.lockPos,
    lockLetter: round.lockLetter,
    totalPossible: round.totalPossible,
    submittedCount: submitted.size,
    submittedList,
    buffer,
    phase,
    shake,
    secondsLeft,
    timerSeconds,
    cursorIndex,
    newGame,
    startTimer,
    submit,
    addLetter,
    backspace,
    onPhysicalKey,
    wordLength,
    inputLocked,
  }
}
