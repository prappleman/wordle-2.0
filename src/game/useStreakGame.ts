import { useCallback, useMemo, useState } from 'react'
import { scoreGuess } from './engine'
import type { GuessRow } from './useWordleGame'
import type { ClassicGameConfig } from '../variants/types'

export function streakBestStorageKey(variantId: string): string {
  return `wordle-hub-streak-best-${variantId}`
}

function readBest(key: string): number {
  try {
    const v = localStorage.getItem(key)
    if (v === null) return 0
    const n = Number.parseInt(v, 10)
    return Number.isFinite(n) ? n : 0
  } catch {
    return 0
  }
}

function writeBest(key: string, n: number) {
  try {
    localStorage.setItem(key, String(n))
  } catch {
    /* ignore */
  }
}

function pickTarget(words: readonly string[], wordLength: number): string {
  const pool = words.filter((w) => w.length === wordLength)
  if (pool.length === 0) {
    throw new Error(`No words of length ${wordLength}`)
  }
  return pool[Math.floor(Math.random() * pool.length)]!.toUpperCase()
}

export function useStreakGame(config: ClassicGameConfig & { variantId: string }) {
  const { words, wordLength, maxGuesses, variantId } = config
  const bestKey = streakBestStorageKey(variantId)

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
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(() => readBest(bestKey))

  const newRun = useCallback(() => {
    setTarget(pickTarget(words, wordLength))
    setGuesses([])
    setBuffer('')
    setPhase('playing')
    setShake(false)
    setStreak(0)
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
    const row: GuessRow = { letters: g, feedback }
    const next = [...guesses, row]
    setGuesses(next)
    setBuffer('')

    if (g === target) {
      setStreak((s) => {
        const ns = s + 1
        setBest((b) => {
          if (ns > b) {
            writeBest(bestKey, ns)
            return ns
          }
          return b
        })
        return ns
      })
      setTarget(pickTarget(words, wordLength))
      setGuesses([])
      setPhase('playing')
      return
    }

    if (next.length >= maxGuesses) {
      setPhase('lost')
    }
  }, [buffer, guesses, maxGuesses, phase, target, validSet, wordLength, words, bestKey])

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
    streak,
    best,
    newRun,
    submit,
    addLetter,
    backspace,
    onPhysicalKey,
    wordLength,
    maxGuesses,
  }
}
