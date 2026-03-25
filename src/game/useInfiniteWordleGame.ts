import { useCallback, useEffect, useMemo, useState } from 'react'
import { scoreGuess } from './engine'
import type { GuessRow } from './useWordleGame'
import type { ClassicGameConfig } from '../variants/types'

const MAX_ROWS = 6
/** Time to show all-green row before sliding (matches tile flip feel). */
const SLIDE_DELAY_MS = 1500

function pickTarget(words: readonly string[], wordLength: number): string {
  const pool = words.filter((w) => w.length === wordLength)
  if (pool.length === 0) {
    throw new Error(`No words of length ${wordLength}`)
  }
  return pool[Math.floor(Math.random() * pool.length)]!.toUpperCase()
}

/**
 * Six rows max. Wrong guesses fill the grid; if you use all six without solving, you lose.
 * Solve the word: greens animate, then the oldest two guesses drop, new target, re-score the rest.
 */
export function useInfiniteWordleGame(config: Pick<ClassicGameConfig, 'words' | 'wordLength'>) {
  const { words, wordLength } = config

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
  const [shake, setShake] = useState(false)
  const [slides, setSlides] = useState(0)
  const [phase, setPhase] = useState<'playing' | 'lost'>('playing')
  const [winPending, setWinPending] = useState(false)

  useEffect(() => {
    if (!winPending) return
    const id = window.setTimeout(() => {
      const nextTarget = pickTarget(words, wordLength)
      setTarget(nextTarget)
      setGuesses((prev) =>
        prev.slice(2).map((row) => ({
          letters: row.letters,
          feedback: scoreGuess(nextTarget, row.letters),
        })),
      )
      setSlides((s) => s + 1)
      setWinPending(false)
    }, SLIDE_DELAY_MS)
    return () => clearTimeout(id)
  }, [winPending, words, wordLength])

  const inputLocked = phase !== 'playing' || winPending

  const newGame = useCallback(() => {
    setTarget(pickTarget(words, wordLength))
    setGuesses([])
    setBuffer('')
    setShake(false)
    setSlides(0)
    setPhase('playing')
    setWinPending(false)
  }, [words, wordLength])

  const submit = useCallback(() => {
    if (inputLocked) return
    const g = buffer.toUpperCase()
    if (g.length !== wordLength) return
    if (guesses.length >= MAX_ROWS) return

    if (!validSet.has(g)) {
      setShake(true)
      window.setTimeout(() => setShake(false), 450)
      return
    }

    const feedback = scoreGuess(target, g)
    const newRow: GuessRow = { letters: g, feedback }
    const combined = [...guesses, newRow]

    if (g === target) {
      setGuesses(combined)
      setBuffer('')
      setWinPending(true)
      return
    }

    setGuesses(combined)
    setBuffer('')

    if (combined.length >= MAX_ROWS) {
      setPhase('lost')
    }
  }, [buffer, guesses, inputLocked, target, validSet, wordLength])

  const addLetter = useCallback(
    (ch: string) => {
      if (inputLocked) return
      if (guesses.length >= MAX_ROWS) return
      const c = ch.toUpperCase()
      if (!/^[A-Z]$/.test(c)) return
      if (buffer.length >= wordLength) return
      setBuffer((b) => b + c)
    },
    [buffer.length, guesses.length, inputLocked, wordLength],
  )

  const backspace = useCallback(() => {
    if (inputLocked) return
    setBuffer((b) => b.slice(0, -1))
  }, [inputLocked])

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

  const gridPhase: 'playing' | 'won' | 'lost' =
    phase === 'lost' ? 'lost' : winPending ? 'won' : 'playing'

  return {
    target,
    guesses,
    buffer,
    shake,
    slides,
    phase,
    winPending,
    newGame,
    submit,
    addLetter,
    backspace,
    onPhysicalKey,
    wordLength,
    maxGuesses: MAX_ROWS,
    gridPhase,
    inputLocked,
  }
}
