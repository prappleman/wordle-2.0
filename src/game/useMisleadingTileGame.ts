import { useCallback, useMemo, useState } from 'react'
import { useWinRevealTimer } from './useWinRevealTimer'
import { misleadingFeedback, scoreGuess } from './engine'
import type { GuessRow } from './useWordleGame'
import type { ClassicGameConfig } from '../variants/types'

function pickTarget(words: readonly string[], wordLength: number): string {
  const pool = words.filter((w) => w.length === wordLength)
  if (pool.length === 0) {
    throw new Error(`No words of length ${wordLength}`)
  }
  return pool[Math.floor(Math.random() * pool.length)]!.toUpperCase()
}

function buildMisleadingRow(letters: string, trueFb: GuessRow['feedback']): GuessRow {
  const n = letters.length
  const lieIndex = Math.floor(Math.random() * n)
  const displayFeedback = [...trueFb]
  const truth = trueFb[lieIndex]!
  let fake = misleadingFeedback(truth)
  let guard = 0
  while (fake === truth && guard < 10) {
    fake = misleadingFeedback(truth)
    guard++
  }
  displayFeedback[lieIndex] = fake
  return { letters, feedback: trueFb, displayFeedback }
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
  const { schedule: scheduleWinReveal, clear: clearWinReveal } = useWinRevealTimer()

  const newGame = useCallback(() => {
    clearWinReveal()
    setRevealLock(false)
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
    const row = buildMisleadingRow(g, trueFb)
    const next = [...guesses, row]
    setGuesses(next)
    setBuffer('')

    if (g === target) {
      setRevealLock(true)
      scheduleWinReveal(() => {
        setPhase('won')
        setRevealLock(false)
      })
    } else if (next.length >= maxGuesses) {
      setPhase('lost')
    }
  }, [buffer, guesses, maxGuesses, phase, target, validSet, wordLength])

  const addLetter = useCallback(
    (ch: string) => {
      if (phase !== 'playing') return
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
  }, [phase])

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
  }
}
