import { useCallback, useMemo, useState } from 'react'
import { scoreGuess } from './engine'
import type { GuessRow } from './useWordleGame'
const LENGTHS = [3, 4, 5, 6, 7] as const

function pickTarget(words: readonly string[], wordLength: number): string {
  const pool = words.filter((w) => w.length === wordLength)
  if (pool.length === 0) {
    throw new Error(`No words of length ${wordLength}`)
  }
  return pool[Math.floor(Math.random() * pool.length)]!.toUpperCase()
}

export function useGrowingWordGame(wordsByLength: {
  3: readonly string[]
  4: readonly string[]
  5: readonly string[]
  6: readonly string[]
  7: readonly string[]
}, startingLength: 3 | 4 | 5 | 6 | 7 = 3) {
  const [currentLength, setCurrentLength] = useState(startingLength)
  const [ladderStreak, setLadderStreak] = useState(0)
  const [target, setTarget] = useState(() => pickTarget(wordsByLength[startingLength], startingLength))
  const [guesses, setGuesses] = useState<GuessRow[]>([])
  const [buffer, setBuffer] = useState('')
  const [phase, setPhase] = useState<'playing' | 'won' | 'lost'>('playing')
  const [shake, setShake] = useState(false)
  const [lastLostTarget, setLastLostTarget] = useState<string | null>(null)

  const maxGuesses = 6

  const words = wordsByLength[currentLength as 3 | 4 | 5 | 6 | 7]

  const validSet = useMemo(() => {
    const s = new Set<string>()
    const wl = currentLength
    for (const w of words) {
      if (w.length === wl) {
        s.add(w.toUpperCase())
      }
    }
    return s
  }, [words, currentLength])

  const newGame = useCallback(() => {
    setCurrentLength(startingLength)
    setLadderStreak(0)
    setTarget(pickTarget(wordsByLength[startingLength], startingLength))
    setGuesses([])
    setBuffer('')
    setPhase('playing')
    setShake(false)
    setLastLostTarget(null)
  }, [startingLength, wordsByLength])

  const submit = useCallback(() => {
    if (phase !== 'playing') return
    const g = buffer.toUpperCase()
    if (g.length !== currentLength) return
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
      setLadderStreak((s) => s + 1)
      const idx = LENGTHS.indexOf(currentLength as (typeof LENGTHS)[number])
      const nextLen =
        idx >= 0 && idx < LENGTHS.length - 1 ? LENGTHS[idx + 1]! : LENGTHS[0]!
      const pool = wordsByLength[nextLen]
      setCurrentLength(nextLen)
      setTarget(pickTarget(pool, nextLen))
      setGuesses([])
      setBuffer('')
      setPhase('playing')
      return
    }

    if (next.length >= maxGuesses) {
      setLastLostTarget(target)
      setPhase('lost')
      setCurrentLength(startingLength)
      setLadderStreak(0)
      setTarget(pickTarget(wordsByLength[startingLength], startingLength))
      setGuesses([])
      setBuffer('')
    }
  }, [buffer, currentLength, guesses, phase, target, validSet, wordsByLength, startingLength])

  const addLetter = useCallback(
    (ch: string) => {
      if (phase !== 'playing') return
      const c = ch.toUpperCase()
      if (!/^[A-Z]$/.test(c)) return
      if (buffer.length >= currentLength) return
      setBuffer((b) => b + c)
    },
    [buffer.length, currentLength, phase],
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
    wordLength: currentLength,
    maxGuesses,
    ladderStreak,
    currentLength,
    lastLostTarget,
  }
}
