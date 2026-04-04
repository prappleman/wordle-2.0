import { useCallback, useMemo, useState } from 'react'
import { isValidWildcardGuess, matchesWildcardPattern, scoreGuessMasked } from './engine'
import type { ClassicGameConfig } from '../variants/types'
import type { GuessRow } from './useWordleGame'

export type WildcardGamePhase = 'playing' | 'won' | 'lost'

function pickTarget(words: readonly string[], wordLength: number): string {
  const pool = words.filter((w) => w.length === wordLength)
  if (pool.length === 0) {
    throw new Error(`No words of length ${wordLength}`)
  }
  return pool[Math.floor(Math.random() * pool.length)]!.toUpperCase()
}

function randomWildcardColumnIndices(maxGuesses: number, wordLength: number): number[] {
  return Array.from({ length: maxGuesses }, () => Math.floor(Math.random() * wordLength))
}

export function useWildcardWordleGame(config: ClassicGameConfig) {
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
  const [wildcardColumnByRow, setWildcardColumnByRow] = useState(() =>
    randomWildcardColumnIndices(maxGuesses, wordLength),
  )
  const [guesses, setGuesses] = useState<GuessRow[]>([])
  const [buffer, setBuffer] = useState('')
  const [phase, setPhase] = useState<WildcardGamePhase>('playing')
  const [shake, setShake] = useState(false)

  const newGame = useCallback(() => {
    setTarget(pickTarget(words, wordLength))
    setWildcardColumnByRow(randomWildcardColumnIndices(maxGuesses, wordLength))
    setGuesses([])
    setBuffer('')
    setPhase('playing')
    setShake(false)
  }, [maxGuesses, words, wordLength])

  const submit = useCallback(() => {
    if (phase !== 'playing') return
    const row = guesses.length
    const wildcardCol = wildcardColumnByRow[row] ?? 0
    const needLen = wordLength - 1
    const g = buffer.toUpperCase()
    if (g.length !== needLen) return
    if (!isValidWildcardGuess(g, wildcardCol, validSet)) {
      setShake(true)
      window.setTimeout(() => setShake(false), 450)
      return
    }

    const feedback = scoreGuessMasked(target, g, wildcardCol)
    const nextRow: GuessRow = { letters: g, feedback }
    const next = [...guesses, nextRow]
    setGuesses(next)
    setBuffer('')

    if (matchesWildcardPattern(g, target, wildcardCol)) {
      setPhase('won')
    } else if (next.length >= maxGuesses) {
      setPhase('lost')
    }
  }, [buffer, guesses, maxGuesses, phase, target, validSet, wildcardColumnByRow, wordLength])

  const addLetter = useCallback(
    (ch: string) => {
      if (phase !== 'playing') return
      const c = ch.toUpperCase()
      if (!/^[A-Z]$/.test(c)) return
      const needLen = wordLength - 1
      if (buffer.length >= needLen) return
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

  const inputLocked = phase !== 'playing'

  const blockedCellByRow = useMemo(
    () => wildcardColumnByRow.map((b) => b) as (number | null)[],
    [wildcardColumnByRow],
  )

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
    blockedCellByRow,
  }
}
