import { useCallback, useMemo, useState } from 'react'
import { useWinRevealTimer } from './useWinRevealTimer'
import { scoreGuess } from './engine'
import type { GuessRow } from './useWordleGame'
import type { ClassicGameConfig } from '../variants/types'

export interface MultiWordleConfig extends ClassicGameConfig {
  boardCount: number
}

function pickDistinctTargets(
  words: readonly string[],
  wordLength: number,
  count: number,
): string[] {
  const pool = words.filter((w) => w.length === wordLength)
  if (pool.length < count) {
    throw new Error(`Need at least ${count} words of length ${wordLength}`)
  }
  const picked: string[] = []
  const used = new Set<string>()
  let guard = 0
  while (picked.length < count && guard < count * 200) {
    guard++
    const t = pool[Math.floor(Math.random() * pool.length)]!.toUpperCase()
    if (!used.has(t)) {
      used.add(t)
      picked.push(t)
    }
  }
  if (picked.length < count) {
    throw new Error(`Could not pick ${count} distinct targets`)
  }
  return picked
}

export function useMultiWordleGame(config: MultiWordleConfig) {
  const { words, wordLength, maxGuesses, boardCount } = config

  const validSet = useMemo(() => {
    const s = new Set<string>()
    for (const w of words) {
      if (w.length === wordLength) {
        s.add(w.toUpperCase())
      }
    }
    return s
  }, [words, wordLength])

  const [targets, setTargets] = useState(() =>
    pickDistinctTargets(words, wordLength, boardCount),
  )
  const [guessesByBoard, setGuessesByBoard] = useState<GuessRow[][]>(() =>
    Array.from({ length: boardCount }, () => []),
  )
  const [solved, setSolved] = useState<boolean[]>(() =>
    Array(boardCount).fill(false),
  )
  const [guessCount, setGuessCount] = useState(0)
  const [buffer, setBuffer] = useState('')
  const [phase, setPhase] = useState<'playing' | 'won' | 'lost'>('playing')
  const [shake, setShake] = useState(false)
  const [revealLock, setRevealLock] = useState(false)
  const { schedule: scheduleWinReveal, clear: clearWinReveal } = useWinRevealTimer()

  const newGame = useCallback(() => {
    clearWinReveal()
    setRevealLock(false)
    setTargets(pickDistinctTargets(words, wordLength, boardCount))
    setGuessesByBoard(Array.from({ length: boardCount }, () => []))
    setSolved(Array(boardCount).fill(false))
    setGuessCount(0)
    setBuffer('')
    setPhase('playing')
    setShake(false)
  }, [boardCount, clearWinReveal, words, wordLength])

  const submit = useCallback(() => {
    if (phase !== 'playing' || revealLock) return
    const g = buffer.toUpperCase()
    if (g.length !== wordLength) return
    if (!validSet.has(g)) {
      setShake(true)
      window.setTimeout(() => setShake(false), 450)
      return
    }

    const nextGuesses = guessesByBoard.map((rows, i) => {
      if (solved[i]) return rows
      const feedback = scoreGuess(targets[i]!, g)
      return [...rows, { letters: g, feedback }]
    })

    const nextSolved = solved.map((s, i) => s || g === targets[i])

    setGuessesByBoard(nextGuesses)
    setSolved(nextSolved)
    setBuffer('')

    const nextCount = guessCount + 1
    setGuessCount(nextCount)

    if (nextSolved.every(Boolean)) {
      setRevealLock(true)
      scheduleWinReveal(() => {
        setPhase('won')
        setRevealLock(false)
      })
      return
    }

    if (nextCount >= maxGuesses) {
      setPhase('lost')
    }
  }, [
    buffer,
    guessCount,
    guessesByBoard,
    maxGuesses,
    phase,
    revealLock,
    scheduleWinReveal,
    solved,
    targets,
    validSet,
    wordLength,
  ])

  const addLetter = useCallback(
    (ch: string) => {
      if (phase !== 'playing' || revealLock) return
      const c = ch.toUpperCase()
      if (!/^[A-Z]$/.test(c)) return
      if (buffer.length >= wordLength) return
      setBuffer((b) => b + c)
    },
    [buffer.length, phase, revealLock, wordLength],
  )

  const backspace = useCallback(() => {
    if (phase !== 'playing' || revealLock) return
    setBuffer((b) => b.slice(0, -1))
  }, [phase, revealLock])

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

  const keyboardGuesses = useMemo(
    () => guessesByBoard.flat(),
    [guessesByBoard],
  )

  const inputLocked = phase !== 'playing' || revealLock

  return {
    targets,
    guessesByBoard,
    solved,
    buffer,
    phase,
    shake,
    inputLocked,
    guessCount,
    newGame,
    submit,
    addLetter,
    backspace,
    onPhysicalKey,
    wordLength,
    maxGuesses,
    boardCount,
    keyboardGuesses,
  }
}
