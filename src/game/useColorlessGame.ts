import { useCallback, useMemo, useState } from 'react'
import { useWinRevealTimer } from './useWinRevealTimer'
import { countLettersInWord, countPositionCorrect, scoreGuess } from './engine'
import type { GuessRow } from './useWordleGame'
import type { ClassicGameConfig } from '../variants/types'

export interface ColorlessGuessRow extends GuessRow {
  lettersInWord: number
  correctPositions: number
}

export type GamePhase = 'playing' | 'won' | 'lost'

function pickTarget(words: readonly string[], wordLength: number): string {
  const pool = words.filter((w) => w.length === wordLength)
  if (pool.length === 0) {
    throw new Error(`No words of length ${wordLength}`)
  }
  return pool[Math.floor(Math.random() * pool.length)]!.toUpperCase()
}

export function useColorlessGame(config: ClassicGameConfig) {
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
  const [guesses, setGuesses] = useState<ColorlessGuessRow[]>([])
  const [buffer, setBuffer] = useState('')
  const [phase, setPhase] = useState<GamePhase>('playing')
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

    const feedback = scoreGuess(target, g)
    const lettersInWord = countLettersInWord(feedback)
    const correctPositions = countPositionCorrect(feedback)
    const row: ColorlessGuessRow = {
      letters: g,
      feedback,
      lettersInWord,
      correctPositions,
    }
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
  }, [buffer, guesses, maxGuesses, phase, revealLock, scheduleWinReveal, target, validSet, wordLength])

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
  }
}
