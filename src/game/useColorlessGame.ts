import { useCallback, useMemo, useState } from 'react'
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

  const newGame = useCallback(() => {
    setTarget(pickTarget(words, wordLength))
    setGuesses([])
    setBuffer('')
    setPhase('playing')
    setShake(false)
  }, [words, wordLength])

  const submit = useCallback(() => {
    if (phase !== 'playing') return
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
      setPhase('won')
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
    [buffer.length, phase, wordLength],
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
  }
}
