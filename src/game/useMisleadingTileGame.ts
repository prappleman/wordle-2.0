import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useWinRevealTimer } from './useWinRevealTimer'
import { misleadingFeedback, scoreGuess } from './engine'
import type { GuessRow } from './useWordleGame'
import type { ClassicGameConfig, LetterFeedback } from '../variants/types'

function pickTarget(words: readonly string[], wordLength: number): string {
  const pool = words.filter((w) => w.length === wordLength)
  if (pool.length === 0) {
    throw new Error(`No words of length ${wordLength}`)
  }
  return pool[Math.floor(Math.random() * pool.length)]!.toUpperCase()
}

const ALL_DISPLAY: LetterFeedback[] = ['correct', 'present', 'absent']

function shuffleInPlace<T>(arr: T[], rng: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
}

/**
 * One tile shows a false color. Prefer using a displayed (fake) color we have not shown yet on a marked
 * tile—so early rows tend to cover green, yellow, and gray lies when the guess allows it.
 */
function buildMisleadingRow(
  letters: string,
  trueFb: GuessRow['feedback'],
  rng: () => number,
  priorShownLieColors: ReadonlySet<LetterFeedback>,
): GuessRow {
  const n = letters.length
  const need = ALL_DISPLAY.filter((f) => !priorShownLieColors.has(f))
  const tryTargets = need.length > 0 ? [...need] : [...ALL_DISPLAY]
  shuffleInPlace(tryTargets, rng)

  for (const targetFake of tryTargets) {
    const validIndices: number[] = []
    for (let i = 0; i < n; i++) {
      if (trueFb[i] !== targetFake) validIndices.push(i)
    }
    if (validIndices.length === 0) continue
    const lieIndex = validIndices[Math.floor(rng() * validIndices.length)]!
    const displayFeedback = [...trueFb]
    displayFeedback[lieIndex] = targetFake
    return { letters, feedback: trueFb, displayFeedback, misleadingTileIndex: lieIndex }
  }

  const lieIndex = Math.floor(rng() * n)
  const truth = trueFb[lieIndex]!
  let fake = misleadingFeedback(truth)
  let guard = 0
  while (fake === truth && guard < 20) {
    fake = misleadingFeedback(truth)
    guard++
  }
  const displayFeedback = [...trueFb]
  displayFeedback[lieIndex] = fake
  return { letters, feedback: trueFb, displayFeedback, misleadingTileIndex: lieIndex }
}

export function useMisleadingTileGame(config: ClassicGameConfig) {
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

  const [target, setTarget] = useState(() => pickTarget(words, wordLength))
  const [guesses, setGuesses] = useState<GuessRow[]>([])
  const [buffer, setBuffer] = useState('')
  const [phase, setPhase] = useState<'playing' | 'won' | 'lost'>('playing')
  const [shake, setShake] = useState(false)
  const [revealLock, setRevealLock] = useState(false)
  const [displayLieCoverage, setDisplayLieCoverage] = useState(() => new Set<LetterFeedback>())
  const [revealStaggerRowIndex, setRevealStaggerRowIndex] = useState<number | null>(null)
  const staggerClearRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { schedule: scheduleWinReveal, clear: clearWinReveal } = useWinRevealTimer()

  useEffect(
    () => () => {
      if (staggerClearRef.current != null) window.clearTimeout(staggerClearRef.current)
    },
    [],
  )

  const newGame = useCallback(() => {
    clearWinReveal()
    if (staggerClearRef.current != null) {
      window.clearTimeout(staggerClearRef.current)
      staggerClearRef.current = null
    }
    setRevealStaggerRowIndex(null)
    setRevealLock(false)
    setDisplayLieCoverage(new Set())
    setTarget(pickTarget(words, wordLength))
    setGuesses([])
    setBuffer('')
    setPhase('playing')
    setShake(false)
  }, [clearWinReveal, words, wordLength])

  const submit = useCallback(() => {
    if (phase !== 'playing' || revealLock) return
    const g = buffer.toUpperCase()
    if (g.length !== wordLength) return
    if (!validSet.has(g)) {
      setShake(true)
      window.setTimeout(() => setShake(false), 450)
      return
    }

    const trueFb = scoreGuess(target, g)
    const rng = Math.random
    const row = buildMisleadingRow(g, trueFb, rng, displayLieCoverage)
    setDisplayLieCoverage((prev) => {
      const next = new Set(prev)
      const idx = row.misleadingTileIndex
      const df = row.displayFeedback
      if (idx != null && df?.[idx] != null) next.add(df[idx]!)
      return next
    })
    const next = [...guesses, row]
    setGuesses(next)
    setBuffer('')

    if (staggerClearRef.current != null) window.clearTimeout(staggerClearRef.current)
    const newIdx = next.length - 1
    setRevealStaggerRowIndex(newIdx)
    const staggerMs = 140 + wordLength * 85
    staggerClearRef.current = window.setTimeout(() => {
      staggerClearRef.current = null
      setRevealStaggerRowIndex(null)
    }, staggerMs)

    if (g === target) {
      setRevealLock(true)
      scheduleWinReveal(() => {
        setPhase('won')
        setRevealLock(false)
      })
    } else if (next.length >= maxGuesses) {
      setPhase('lost')
    }
  }, [
    buffer,
    displayLieCoverage,
    guesses,
    maxGuesses,
    phase,
    revealLock,
    target,
    validSet,
    wordLength,
    scheduleWinReveal,
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

  const inputLocked = phase !== 'playing' || revealLock

  return {
    target,
    guesses,
    buffer,
    phase,
    shake,
    inputLocked,
    newGame,
    submit,
    addLetter,
    backspace,
    onPhysicalKey,
    wordLength,
    maxGuesses,
    revealStaggerRowIndex,
  }
}
