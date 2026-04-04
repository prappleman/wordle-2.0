import { useCallback, useMemo, useState } from 'react'
import { scoreGuess } from './engine'
import type { ClassicGameConfig } from '../variants/types'
import type { GuessRow } from './useWordleGame'

export type LockedLetterPhase = 'playing' | 'won' | 'lost'

function pickTarget(words: readonly string[], wordLength: number): string {
  const pool = words.filter((w) => w.length === wordLength)
  if (pool.length === 0) {
    throw new Error(`No words of length ${wordLength}`)
  }
  return pool[Math.floor(Math.random() * pool.length)]!.toUpperCase()
}

/** Random (index, letter) from a random valid word—guarantees some word matches that slot. */
function pickForcedSlot(validSet: ReadonlySet<string>, wordLength: number): { index: number; letter: string } {
  const arr = [...validSet]
  const w = arr[Math.floor(Math.random() * arr.length)]!.toUpperCase()
  const index = Math.floor(Math.random() * wordLength)
  return { index, letter: w[index]! }
}

export function useLockedLetterGame(config: ClassicGameConfig) {
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
  const [buffer, setBuffer] = useState('')
  const [guesses, setGuesses] = useState<GuessRow[]>([])
  const [phase, setPhase] = useState<LockedLetterPhase>('playing')
  const [shake, setShake] = useState(false)
  const [forcedSlot, setForcedSlot] = useState<{ index: number; letter: string } | null>(() =>
    maxGuesses <= 1 ? null : pickForcedSlot(validSet, wordLength),
  )

  const newGame = useCallback(() => {
    setTarget(pickTarget(words, wordLength))
    setBuffer('')
    setGuesses([])
    setPhase('playing')
    setShake(false)
    setForcedSlot(maxGuesses <= 1 ? null : pickForcedSlot(validSet, wordLength))
  }, [words, wordLength, maxGuesses, validSet])

  const currentRow = guesses.length
  const needsForcedSlot = currentRow < maxGuesses - 1

  const submit = useCallback(() => {
    if (phase !== 'playing') return
    const g = buffer.toUpperCase()
    if (g.length !== wordLength) return
    if (!validSet.has(g)) {
      setShake(true)
      window.setTimeout(() => setShake(false), 450)
      return
    }
    const bypassForced = !needsForcedSlot || g === target
    if (!bypassForced && forcedSlot && g[forcedSlot.index] !== forcedSlot.letter) {
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
      return
    }
    const nextRow = next.length
    if (nextRow < maxGuesses - 1) {
      setForcedSlot(pickForcedSlot(validSet, wordLength))
    } else {
      setForcedSlot(null)
    }
  }, [
    buffer,
    forcedSlot,
    guesses,
    maxGuesses,
    needsForcedSlot,
    phase,
    target,
    validSet,
    wordLength,
  ])

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
    inputLocked: phase !== 'playing',
    newGame,
    submit,
    addLetter,
    backspace,
    onPhysicalKey,
    wordLength,
    maxGuesses,
    forcedSlot,
    forcedHighlightKey:
      needsForcedSlot && forcedSlot ? forcedSlot.letter : null,
  }
}
