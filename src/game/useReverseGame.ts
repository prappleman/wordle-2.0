import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { scoreGuess } from './engine'
import type { ClassicGameConfig, LetterFeedback } from '../variants/types'
import type { GuessRow } from './useWordleGame'

export type GamePhase = 'pre' | 'playing' | 'won'

const ROWS = 6
const CLEAR_ROW_MS = 700

function pickTarget(words: readonly string[], wordLength: number): string {
  const pool = words.filter((w) => w.length === wordLength)
  if (pool.length === 0) {
    throw new Error(`No words of length ${wordLength}`)
  }
  return pool[Math.floor(Math.random() * pool.length)]!.toUpperCase()
}

function pickRandomWord(words: readonly string[], wordLength: number): string {
  return pickTarget(words, wordLength)
}

function patternKey(fb: readonly LetterFeedback[]): string {
  return fb.join(',')
}

function buildPuzzle(words: readonly string[], wordLength: number, depth = 0): {
  target: string
  expectedRows: LetterFeedback[][]
} {
  if (depth > 80) {
    throw new Error('Could not build reverse puzzle with six unique patterns')
  }
  const t = pickTarget(words, wordLength)
  const expectedRows: LetterFeedback[][] = []
  const seen = new Set<string>()
  for (let attempt = 0; attempt < 12000 && expectedRows.length < ROWS; attempt++) {
    const w = pickRandomWord(words, wordLength)
    const fb = scoreGuess(t, w)
    const key = patternKey(fb)
    if (seen.has(key)) continue
    seen.add(key)
    expectedRows.push(fb)
  }
  if (expectedRows.length < ROWS) {
    return buildPuzzle(words, wordLength, depth + 1)
  }
  return { target: t, expectedRows }
}

function feedbackEqual(a: readonly LetterFeedback[], b: readonly LetterFeedback[]): boolean {
  if (a.length !== b.length) return false
  return a.every((x, i) => x === b[i]!)
}

function allCorrectFeedback(n: number): LetterFeedback[] {
  return Array.from({ length: n }, () => 'correct' as LetterFeedback)
}

export function useReverseGame(config: ClassicGameConfig) {
  const { words, wordLength, maxGuesses } = config
  if (maxGuesses !== ROWS) {
    throw new Error('Reverse mode expects maxGuesses === 6')
  }

  const validSet = useMemo(() => {
    const s = new Set<string>()
    for (const w of words) {
      if (w.length === wordLength) {
        s.add(w.toUpperCase())
      }
    }
    return s
  }, [words, wordLength])

  const [{ target, expectedRows }, setPuzzle] = useState(() => buildPuzzle(words, wordLength))
  /** Row index -> solved guess (flash uses all-green displayFeedback), or null if open. */
  const [filledByRow, setFilledByRow] = useState<(GuessRow | null)[]>(() =>
    Array.from({ length: ROWS }, () => null),
  )
  const [clearedRows, setClearedRows] = useState<boolean[]>(() => Array.from({ length: ROWS }, () => false))
  const [buffer, setBuffer] = useState('')
  const [phase, setPhase] = useState<GamePhase>('pre')
  const [shake, setShake] = useState(false)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [, setElapsedTick] = useState(0)
  const [finalElapsedMs, setFinalElapsedMs] = useState<number | null>(null)
  const [rowClearAnimating, setRowClearAnimating] = useState(false)
  const [usedGuesses, setUsedGuesses] = useState<string[]>([])
  const clearRowTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (clearRowTimeoutRef.current !== null) {
        window.clearTimeout(clearRowTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (phase !== 'playing' || startedAt === null) return
    const id = window.setInterval(() => setElapsedTick((t) => t + 1), 250)
    return () => window.clearInterval(id)
  }, [phase, startedAt])

  const elapsedMsLive =
    phase === 'playing' && startedAt !== null ? Math.max(0, Date.now() - startedAt) : 0

  const startGame = useCallback(() => {
    if (phase !== 'pre') return
    setStartedAt(Date.now())
    setPhase('playing')
    setElapsedTick(0)
  }, [phase])

  const newGame = useCallback(() => {
    if (clearRowTimeoutRef.current !== null) {
      window.clearTimeout(clearRowTimeoutRef.current)
      clearRowTimeoutRef.current = null
    }
    setPuzzle(buildPuzzle(words, wordLength))
    setFilledByRow(Array.from({ length: ROWS }, () => null))
    setClearedRows(Array.from({ length: ROWS }, () => false))
    setBuffer('')
    setPhase('pre')
    setShake(false)
    setStartedAt(null)
    setElapsedTick(0)
    setFinalElapsedMs(null)
    setRowClearAnimating(false)
    setUsedGuesses([])
  }, [words, wordLength])

  const submit = useCallback(() => {
    if (phase !== 'playing' || rowClearAnimating) return
    const g = buffer.toUpperCase()
    if (g.length !== wordLength) return
    if (!validSet.has(g)) {
      setShake(true)
      window.setTimeout(() => setShake(false), 450)
      return
    }
    if (usedGuesses.includes(g)) {
      setShake(true)
      window.setTimeout(() => setShake(false), 450)
      return
    }

    const fb = scoreGuess(target, g)
    const matching: number[] = []
    for (let k = 0; k < ROWS; k++) {
      if (clearedRows[k]) continue
      if (filledByRow[k] !== null) continue
      if (feedbackEqual(fb, expectedRows[k]!)) {
        matching.push(k)
      }
    }

    if (matching.length === 0) {
      setShake(true)
      window.setTimeout(() => setShake(false), 450)
      return
    }

    const rowFlash: GuessRow = {
      letters: g,
      feedback: fb,
      displayFeedback: allCorrectFeedback(wordLength),
    }
    const nextFilled = [...filledByRow]
    for (const k of matching) {
      nextFilled[k] = rowFlash
    }
    setFilledByRow(nextFilled)
    setUsedGuesses((prev) => [...prev, g])
    setBuffer('')
    setRowClearAnimating(true)

    if (clearRowTimeoutRef.current !== null) {
      window.clearTimeout(clearRowTimeoutRef.current)
    }
    const t0 = startedAt
    clearRowTimeoutRef.current = window.setTimeout(() => {
      clearRowTimeoutRef.current = null
      setClearedRows((prev) => {
        const next = [...prev]
        for (const k of matching) next[k] = true
        if (next.every(Boolean) && t0 !== null) {
          setFinalElapsedMs(Date.now() - t0)
          setPhase('won')
        }
        return next
      })
      setFilledByRow((prev) => {
        const next = [...prev]
        for (const k of matching) next[k] = null
        return next
      })
      setRowClearAnimating(false)
    }, CLEAR_ROW_MS)
  }, [
    buffer,
    clearedRows,
    expectedRows,
    filledByRow,
    phase,
    rowClearAnimating,
    startedAt,
    target,
    usedGuesses,
    validSet,
    wordLength,
  ])

  const addLetter = useCallback(
    (ch: string) => {
      if (phase !== 'playing' || rowClearAnimating) return
      const c = ch.toUpperCase()
      if (!/^[A-Z]$/.test(c)) return
      if (buffer.length >= wordLength) return
      setBuffer((b) => b + c)
    },
    [buffer.length, phase, rowClearAnimating, wordLength],
  )

  const backspace = useCallback(() => {
    if (phase !== 'playing' || rowClearAnimating) return
    setBuffer((b) => b.slice(0, -1))
  }, [phase, rowClearAnimating])

  const onPhysicalKey = useCallback(
    (key: string) => {
      if (phase !== 'playing' || rowClearAnimating) return
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
    [addLetter, backspace, phase, rowClearAnimating, submit],
  )

  const displayElapsedMs =
    phase === 'won' && finalElapsedMs !== null
      ? finalElapsedMs
      : phase === 'playing'
        ? elapsedMsLive
        : 0

  return {
    target,
    expectedRows,
    filledByRow,
    clearedRows,
    buffer,
    phase,
    shake,
    inputLocked: phase !== 'playing' || rowClearAnimating,
    newGame,
    startGame,
    submit,
    addLetter,
    backspace,
    onPhysicalKey,
    wordLength,
    maxGuesses: ROWS,
    displayElapsedMs,
  }
}
