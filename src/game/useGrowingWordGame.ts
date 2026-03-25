import { useCallback, useMemo, useState } from 'react'
import { nextLadderInRange } from '../variants/ladderRange'
import { useWinRevealTimer } from './useWinRevealTimer'
import { scoreGuess } from './engine'
import type { GuessRow } from './useWordleGame'

function pickTarget(words: readonly string[], wordLength: number): string {
  const pool = words.filter((w) => w.length === wordLength)
  if (pool.length === 0) {
    throw new Error(`No words of length ${wordLength}`)
  }
  return pool[Math.floor(Math.random() * pool.length)]!.toUpperCase()
}

export function useGrowingWordGame(
  wordsByLength: {
    1: readonly string[]
    2: readonly string[]
    3: readonly string[]
    4: readonly string[]
    5: readonly string[]
    6: readonly string[]
    7: readonly string[]
    8: readonly string[]
    9: readonly string[]
    10: readonly string[]
    11: readonly string[]
    12: readonly string[]
  },
  startingLength: number,
  rangeLo: number,
  rangeHi: number,
) {
  const rungs = useMemo(() => {
    const lo = Math.min(rangeLo, rangeHi)
    const hi = Math.max(rangeLo, rangeHi)
    return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)
  }, [rangeLo, rangeHi])

  const clampToRungs = useCallback(
    (len: number) => {
      if (rungs.length === 0) return len
      if (rungs.includes(len)) return len
      return rungs[0]!
    },
    [rungs],
  )

  const initialLen = clampToRungs(startingLength)

  const [currentLength, setCurrentLength] = useState(initialLen)
  const [ladderStreak, setLadderStreak] = useState(0)
  const [target, setTarget] = useState(() => pickTarget(wordsByLength[initialLen as 1], initialLen))
  const [guesses, setGuesses] = useState<GuessRow[]>([])
  const [buffer, setBuffer] = useState('')
  const [phase, setPhase] = useState<'playing' | 'won' | 'lost' | 'ladderComplete'>('playing')
  const [shake, setShake] = useState(false)
  const [lastLostTarget, setLastLostTarget] = useState<string | null>(null)
  const [revealLock, setRevealLock] = useState(false)
  const { schedule: scheduleWinReveal, clear: clearWinReveal } = useWinRevealTimer()

  const maxGuesses = 6

  const words = wordsByLength[currentLength as keyof typeof wordsByLength]

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

  const resetToStart = useCallback(() => {
    clearWinReveal()
    setRevealLock(false)
    const s = clampToRungs(startingLength)
    setCurrentLength(s)
    setTarget(pickTarget(wordsByLength[s as keyof typeof wordsByLength], s))
    setGuesses([])
    setBuffer('')
    setPhase('playing')
    setShake(false)
    setLastLostTarget(null)
    setLadderStreak(0)
  }, [clampToRungs, clearWinReveal, startingLength, wordsByLength])

  const newGame = useCallback(() => {
    resetToStart()
  }, [resetToStart])

  const submit = useCallback(() => {
    if (phase !== 'playing' || revealLock) return
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
      setRevealLock(true)
      scheduleWinReveal(() => {
        setLadderStreak((s) => s + 1)
        const lo = rungs[0]!
        const hi = rungs[rungs.length - 1]!
        const nextLen = nextLadderInRange(currentLength, lo, hi, 'stop')
        if (nextLen === null) {
          setPhase('ladderComplete')
        } else {
          setCurrentLength(nextLen)
          setTarget(pickTarget(wordsByLength[nextLen as keyof typeof wordsByLength], nextLen))
          setGuesses([])
          setBuffer('')
          setPhase('playing')
        }
        setRevealLock(false)
      })
      return
    }

    if (next.length >= maxGuesses) {
      setLastLostTarget(target)
      setPhase('lost')
      setLadderStreak(0)
    }
  }, [buffer, currentLength, guesses, phase, revealLock, rungs, scheduleWinReveal, target, validSet, wordsByLength])

  const addLetter = useCallback(
    (ch: string) => {
      if (phase !== 'playing' || revealLock) return
      const c = ch.toUpperCase()
      if (!/^[A-Z]$/.test(c)) return
      if (buffer.length >= currentLength) return
      setBuffer((b) => b + c)
    },
    [buffer.length, currentLength, phase, revealLock],
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
    wordLength: currentLength,
    maxGuesses,
    ladderStreak,
    currentLength,
    lastLostTarget,
    ladderRungs: rungs,
  }
}
