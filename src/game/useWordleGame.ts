import { useCallback, useMemo, useState } from 'react'
import { keyboardLetterHints } from '../components/keyboardHints'
import { useWinRevealTimer } from './useWinRevealTimer'
import { scoreGuess } from './engine'
import { satisfiesHardMode } from './wordleHardMode'
import type { ClassicGameConfig, LetterFeedback } from '../variants/types'

export interface GuessRow {
  letters: string
  feedback: LetterFeedback[]
  /** Misleading tile mode: tiles and keyboard hints use this; win uses true `feedback`. */
  displayFeedback?: LetterFeedback[]
  /** Alternating duet: which hidden word (0 = A, 1 = B) this row was scored against. */
  scoredTarget?: 0 | 1
  /** Spaces mode: skipped column index for this row (masked guess). */
  rowBlockedIndex?: number | null
  /** Spaces mode: two fixed blocked cells (bonus rows). */
  rowBlockedIndices?: number[] | null
}

export type GamePhase = 'playing' | 'won' | 'lost'

function pickTarget(words: readonly string[], wordLength: number): string {
  const pool = words.filter((w) => w.length === wordLength)
  if (pool.length === 0) {
    throw new Error(`No words of length ${wordLength}`)
  }
  return pool[Math.floor(Math.random() * pool.length)]!.toUpperCase()
}

export type WordleGameOptions = {
  /** Allow any A–Z string without dictionary check (still scored normally). */
  allowNonDictionary?: boolean
  /** Wordle hard mode: revealed greens stay in place on later guesses. */
  lockRevealedGreens?: boolean
  /** Cannot type letters that are known absent from prior guesses. */
  forbidAbsentLetters?: boolean
  /** Use this target instead of a random pick (e.g. custom session). */
  forcedTarget?: string
}

export function useWordleGame(config: ClassicGameConfig, options: WordleGameOptions = {}) {
  const { words, wordLength, maxGuesses } = config
  const { allowNonDictionary, lockRevealedGreens, forbidAbsentLetters, forcedTarget } = options

  const validSet = useMemo(() => {
    const s = new Set<string>()
    for (const w of words) {
      if (w.length === wordLength) {
        s.add(w.toUpperCase())
      }
    }
    return s
  }, [words, wordLength])

  const [target, setTarget] = useState(() => {
    if (forcedTarget && forcedTarget.length === wordLength) return forcedTarget.toUpperCase()
    return pickTarget(words, wordLength)
  })
  const [guesses, setGuesses] = useState<GuessRow[]>([])
  const [buffer, setBuffer] = useState('')
  const [phase, setPhase] = useState<GamePhase>('playing')
  const [shake, setShake] = useState(false)
  const [revealLock, setRevealLock] = useState(false)
  const { clear: clearWinReveal } = useWinRevealTimer()

  const newGame = useCallback(
    (nextTarget?: string) => {
      clearWinReveal()
      setRevealLock(false)
      setTarget(
        nextTarget !== undefined && nextTarget.length === wordLength
          ? nextTarget.toUpperCase()
          : pickTarget(words, wordLength),
      )
      setGuesses([])
      setBuffer('')
      setPhase('playing')
      setShake(false)
    },
    [clearWinReveal, wordLength, words],
  )

  const submit = useCallback(() => {
    if (phase !== 'playing' || revealLock) return
    const g = buffer.toUpperCase()
    if (g.length !== wordLength) return
    if (!/^[A-Z]+$/.test(g)) {
      setShake(true)
      window.setTimeout(() => setShake(false), 450)
      return
    }
    if (!allowNonDictionary && !validSet.has(g)) {
      setShake(true)
      window.setTimeout(() => setShake(false), 450)
      return
    }
    if (lockRevealedGreens && !satisfiesHardMode(g, guesses, wordLength)) {
      setShake(true)
      window.setTimeout(() => setShake(false), 450)
      return
    }

    const feedback = scoreGuess(target, g)
    const row: GuessRow = { letters: g, feedback }
    const next = [...guesses, row]
    setGuesses(next)
    setBuffer('')

    if (g === target) {
      setPhase('won')
    } else if (next.length >= maxGuesses) {
      setPhase('lost')
    }
  }, [allowNonDictionary, buffer, guesses, lockRevealedGreens, maxGuesses, phase, revealLock, target, validSet, wordLength])

  const forceLoss = useCallback(() => {
    if (phase !== 'playing') return
    setPhase('lost')
  }, [phase])

  const absentHint = useMemo(() => {
    if (!forbidAbsentLetters) return null
    return keyboardLetterHints(guesses)
  }, [forbidAbsentLetters, guesses])

  const addLetter = useCallback(
    (ch: string) => {
      if (phase !== 'playing' || revealLock) return
      const c = ch.toUpperCase()
      if (!/^[A-Z]$/.test(c)) return
      if (buffer.length >= wordLength) return
      if (absentHint?.get(c) === 'absent') return
      setBuffer((b) => b + c)
    },
    [absentHint, buffer.length, phase, revealLock, wordLength],
  )

  const backspace = useCallback(() => {
    if (phase !== 'playing') return
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
    forceLoss,
  }
}
