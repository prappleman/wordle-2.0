import { useCallback, useMemo, useState } from 'react'
import { scoreGuess } from './engine'
import type { GuessRow } from './useWordleGame'
import type { ClassicGameConfig } from '../variants/types'

function pickTarget(words: readonly string[], wordLength: number): string {
  const pool = words.filter((w) => w.length === wordLength)
  if (pool.length === 0) {
    throw new Error(`No words of length ${wordLength}`)
  }
  return pool[Math.floor(Math.random() * pool.length)]!.toUpperCase()
}

function newRound(words: readonly string[], wordLength: number) {
  const target = pickTarget(words, wordLength)
  return { target }
}

export function useUnscrambleGame(config: ClassicGameConfig) {
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

  const [round, setRound] = useState(() => newRound(words, wordLength))
  const { target } = round

  const [guesses, setGuesses] = useState<GuessRow[]>([])
  const [buffer, setBuffer] = useState('')
  const [phase, setPhase] = useState<'playing' | 'won' | 'lost'>('playing')
  const [shake, setShake] = useState(false)

  const newGame = useCallback(() => {
    const r = newRound(words, wordLength)
    setRound(r)
    setGuesses([])
    setBuffer('')
    setPhase('playing')
    setShake(false)
  }, [words, wordLength])

  const submit = useCallback(() => {
    if (phase !== 'playing') return
    const g = buffer.toUpperCase()
    if (g.length !== wordLength) return
    if (guesses.length >= maxGuesses) return
    if (!validSet.has(g)) {
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
      return
    }
    if (next.length >= maxGuesses) {
      setPhase('lost')
    }
  }, [buffer, guesses.length, maxGuesses, phase, target, validSet, wordLength])

  const addLetter = useCallback(
    (ch: string) => {
      if (phase !== 'playing') return
      if (guesses.length >= maxGuesses) return
      const c = ch.toUpperCase()
      if (!/^[A-Z]$/.test(c)) return
      if (buffer.length >= wordLength) return
      setBuffer((b) => b + c)
    },
    [buffer.length, guesses.length, maxGuesses, phase, wordLength],
  )

  const backspace = useCallback(() => {
    if (phase !== 'playing') return
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

  return {
    target,
    guesses,
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
    keyboardGuesses: guesses,
  }
}
