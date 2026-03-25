import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { scoreGuess } from './engine'
import type { GuessRow } from './useWordleGame'
import type { ClassicGameConfig } from '../variants/types'

/** Pause after a correct word so all-green row is visible before continuing or ending. */
const CELEBRATION_MS = 1600
/** Extra time after the first of two words is found so greens aren’t immediately replaced by the remaining-word lens. */
const FIRST_WORD_CELEBRATION_MS = 2200

function pickDistinctTargets(
  words: readonly string[],
  wordLength: number,
): [string, string] {
  const pool = words.filter((w) => w.length === wordLength)
  if (pool.length < 2) {
    throw new Error(`Need at least 2 words of length ${wordLength}`)
  }
  const a = pool[Math.floor(Math.random() * pool.length)]!.toUpperCase()
  let b = pool[Math.floor(Math.random() * pool.length)]!.toUpperCase()
  let guard = 0
  while (b === a && guard < 200) {
    b = pool[Math.floor(Math.random() * pool.length)]!.toUpperCase()
    guard++
  }
  if (b === a) throw new Error('Could not pick two distinct targets')
  return [a, b]
}

/** Word A/B are “found” if any submitted guess equals that target (turn / board does not matter). */
function hasGuessEqualTo(guesses: GuessRow[], word: string): boolean {
  return guesses.some((r) => r.letters === word)
}

export function useAlternatingDuetGame(config: ClassicGameConfig) {
  const { words, wordLength, maxGuesses } = config

  const validSet = useMemo(() => {
    const s = new Set<string>()
    for (const w of words) {
      if (w.length === wordLength) {
        s.add(w.toUpperCase())
      }
    }
    return s
  }, [words, wordLength])

  const [targets, setTargets] = useState(() => pickDistinctTargets(words, wordLength))
  const [guesses, setGuesses] = useState<GuessRow[]>([])
  const guessesRef = useRef(guesses)
  guessesRef.current = guesses
  const [turnIndex, setTurnIndex] = useState(0)
  const [totalGuesses, setTotalGuesses] = useState(0)
  const [buffer, setBuffer] = useState('')
  const [phase, setPhase] = useState<'playing' | 'won' | 'lost'>('playing')
  const [shake, setShake] = useState(false)
  const [celebrationLock, setCelebrationLock] = useState(false)
  const celebrationTimerRef = useRef<number | null>(null)

  const clearCelebrationTimer = useCallback(() => {
    if (celebrationTimerRef.current != null) {
      window.clearTimeout(celebrationTimerRef.current)
      celebrationTimerRef.current = null
    }
  }, [])

  useEffect(() => () => clearCelebrationTimer(), [clearCelebrationTimer])

  const newGame = useCallback(() => {
    clearCelebrationTimer()
    setCelebrationLock(false)
    setTargets(pickDistinctTargets(words, wordLength))
    setGuesses([])
    setTurnIndex(0)
    setTotalGuesses(0)
    setBuffer('')
    setPhase('playing')
    setShake(false)
  }, [clearCelebrationTimer, words, wordLength])

  const submit = useCallback(() => {
    if (phase !== 'playing' || celebrationLock) return
    const prevGuesses = guessesRef.current
    if (prevGuesses.length >= maxGuesses) return
    const g = buffer.toUpperCase()
    if (g.length !== wordLength) return
    if (!validSet.has(g)) {
      setShake(true)
      window.setTimeout(() => setShake(false), 450)
      return
    }

    const t0 = targets[0]!
    const t1 = targets[1]!
    const solvedBeforeA = hasGuessEqualTo(prevGuesses, t0)
    const solvedBeforeB = hasGuessEqualTo(prevGuesses, t1)

    if (solvedBeforeA && solvedBeforeB) {
      setPhase('won')
      return
    }

    /** Alternating *scoring* only while neither target has been guessed yet. */
    let board: 0 | 1
    if (!solvedBeforeA && !solvedBeforeB) {
      board = (turnIndex % 2) as 0 | 1
    } else if (solvedBeforeA && !solvedBeforeB) {
      board = 1
    } else if (!solvedBeforeA && solvedBeforeB) {
      board = 0
    } else {
      return
    }

    const target = board === 0 ? t0 : t1
    const feedback = scoreGuess(target, g)
    const row: GuessRow = { letters: g, feedback, scoredTarget: board }

    const nextSolvedA = solvedBeforeA || g === t0
    const nextSolvedB = solvedBeforeB || g === t1
    const solvedNewWordThisTurn =
      (g === t0 && !solvedBeforeA) || (g === t1 && !solvedBeforeB)

    setGuesses((prev) => [...prev, row])
    setTurnIndex((t) => t + 1)
    const nextCount = totalGuesses + 1
    setTotalGuesses(nextCount)
    setBuffer('')

    const runAfterCelebration = (then: () => void, ms: number = CELEBRATION_MS) => {
      clearCelebrationTimer()
      setCelebrationLock(true)
      celebrationTimerRef.current = window.setTimeout(() => {
        celebrationTimerRef.current = null
        then()
        setCelebrationLock(false)
      }, ms)
    }

    if (nextSolvedA && nextSolvedB) {
      runAfterCelebration(() => setPhase('won'))
      return
    }
    if (solvedNewWordThisTurn) {
      runAfterCelebration(
        () => {
          if (nextCount >= maxGuesses && !(nextSolvedA && nextSolvedB)) {
            setPhase('lost')
          }
        },
        FIRST_WORD_CELEBRATION_MS,
      )
      return
    }
    if (nextCount >= maxGuesses) {
      setPhase('lost')
    }
  }, [
    buffer,
    celebrationLock,
    clearCelebrationTimer,
    maxGuesses,
    phase,
    targets,
    totalGuesses,
    turnIndex,
    validSet,
    wordLength,
  ])

  const addLetter = useCallback(
    (ch: string) => {
      if (phase !== 'playing' || celebrationLock) return
      const c = ch.toUpperCase()
      if (!/^[A-Z]$/.test(c)) return
      if (buffer.length >= wordLength) return
      setBuffer((b) => b + c)
    },
    [buffer.length, celebrationLock, phase, wordLength],
  )

  const backspace = useCallback(() => {
    if (phase !== 'playing' || celebrationLock) return
    setBuffer((b) => b.slice(0, -1))
  }, [celebrationLock, phase])

  const onPhysicalKey = useCallback(
    (key: string) => {
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
    [addLetter, backspace, submit],
  )

  const t0 = targets[0]!
  const t1 = targets[1]!

  const solvedA = useMemo(() => hasGuessEqualTo(guesses, t0), [guesses, t0])
  const solvedB = useMemo(() => hasGuessEqualTo(guesses, t1), [guesses, t1])

  const nextScoresWord: 'A' | 'B' = useMemo(() => {
    if (!solvedA && !solvedB) {
      return turnIndex % 2 === 0 ? 'A' : 'B'
    }
    if (solvedA && !solvedB) return 'B'
    if (!solvedA && solvedB) return 'A'
    return 'A'
  }, [solvedA, solvedB, turnIndex])

  /** Both targets still unknown: alternating “lens” on tiles. Once one is guessed, only the other word colors the board. */
  const dualPhase = !solvedA && !solvedB

  const lastColorTarget = useMemo(() => {
    if (!dualPhase || guesses.length === 0) return null
    const st = guesses[guesses.length - 1]!.scoredTarget
    if (st === undefined) return null
    return st === 0 ? t0 : t1
  }, [dualPhase, guesses, t0, t1])

  const remainingTargetWord = useMemo(() => {
    if (solvedA && !solvedB) return t1
    if (!solvedA && solvedB) return t0
    return null
  }, [solvedA, solvedB, t0, t1])

  const gridGuesses = useMemo(() => {
    if (solvedA && solvedB) {
      return guesses
    }

    /**
     * Run before dual-phase and remaining-word branches so we never flash the “remaining word” lens
     * before the timer ends. Rows that exactly match Word A or B are shown all-green vs that target
     * (fixes the case where the guess matched on the “wrong” turn’s board score).
     */
    if (celebrationLock && solvedA !== solvedB) {
      return guesses.map((row) => {
        if (row.letters === t0) {
          return { ...row, displayFeedback: scoreGuess(t0, row.letters) }
        }
        if (row.letters === t1) {
          return { ...row, displayFeedback: scoreGuess(t1, row.letters) }
        }
        return { ...row }
      })
    }

    if (dualPhase) {
      if (!lastColorTarget) return guesses
      return guesses.map((row) => ({
        ...row,
        displayFeedback: scoreGuess(lastColorTarget, row.letters),
      }))
    }

    if (!remainingTargetWord) {
      return guesses
    }

    return guesses.map((row) => ({
      ...row,
      displayFeedback: scoreGuess(remainingTargetWord, row.letters),
    }))
  }, [
    celebrationLock,
    dualPhase,
    guesses,
    lastColorTarget,
    remainingTargetWord,
    solvedA,
    solvedB,
    t0,
    t1,
  ])

  const keyboardGuesses = useMemo(() => {
    if (guesses.length === 0) return []
    if (solvedA && solvedB) {
      return []
    }
    if (celebrationLock && solvedA !== solvedB) {
      return []
    }
    if (dualPhase) {
      if (!lastColorTarget) return []
      return guesses.map((row) => ({
        letters: row.letters,
        feedback: scoreGuess(lastColorTarget, row.letters),
      }))
    }
    if (!remainingTargetWord) {
      return []
    }
    return guesses.map((row) => ({
      letters: row.letters,
      feedback: scoreGuess(remainingTargetWord, row.letters),
    }))
  }, [celebrationLock, dualPhase, guesses, lastColorTarget, remainingTargetWord, solvedA, solvedB])

  const summaryGridAllA = useMemo(
    () =>
      guesses.map((row) => ({
        letters: row.letters,
        feedback: scoreGuess(t0, row.letters),
      })),
    [guesses, t0],
  )
  const summaryGridAllB = useMemo(
    () =>
      guesses.map((row) => ({
        letters: row.letters,
        feedback: scoreGuess(t1, row.letters),
      })),
    [guesses, t1],
  )

  const solvedCount = (solvedA ? 1 : 0) + (solvedB ? 1 : 0)

  return {
    targets,
    guesses,
    celebrationLock,
    gridGuesses,
    summaryGridAllA,
    summaryGridAllB,
    solvedCount,
    solvedA,
    solvedB,
    turnIndex,
    nextScoresWord,
    buffer,
    phase,
    shake,
    newGame,
    submit,
    addLetter,
    backspace,
    onPhysicalKey,
    wordLength,
    maxGuesses,
    keyboardGuesses,
  }
}
