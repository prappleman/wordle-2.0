import { useCallback, useMemo, useState } from 'react'
import { scoreGuess } from './engine'
import { useWinRevealTimer } from './useWinRevealTimer'
import { WIN_REVEAL_MS } from './winReveal'
import { zenWindowGuesses } from './zenDisplay'
import type { GuessRow } from './useWordleGame'
import type { ClassicGameConfig } from '../variants/types'

const VISIBLE_ROWS = 6
const RECOLOR_DELAY_MS = WIN_REVEAL_MS

function pickTarget(words: readonly string[], wordLength: number): string {
  const pool = words.filter((w) => w.length === wordLength)
  if (pool.length === 0) {
    throw new Error(`No words of length ${wordLength}`)
  }
  return pool[Math.floor(Math.random() * pool.length)]!.toUpperCase()
}

export type ZenMode = 'zen' | 'zenInfinite'

export function useZenGame(
  config: Pick<ClassicGameConfig, 'words' | 'wordLength'> & {
    mode: ZenMode
  },
) {
  const { words, wordLength, mode } = config

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
  const [solvedCount, setSolvedCount] = useState(0)
  /** Zen only: brief “solved” cue; Zen Infinite stays silent */
  const [winFlash, setWinFlash] = useState(false)
  /** Zen Infinite: lock input while showing solved row before recolor. */
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [revealLock, setRevealLock] = useState(false)
  const { schedule: scheduleWinReveal, clear: clearWinReveal } = useWinRevealTimer()

  const advanceWord = useCallback(() => {
    setTarget(pickTarget(words, wordLength))
    setGuesses([])
    setBuffer('')
    setSolvedCount((c) => c + 1)
  }, [words, wordLength])

  const newGame = useCallback(() => {
    clearWinReveal()
    setRevealLock(false)
    setTarget(pickTarget(words, wordLength))
    setGuesses([])
    setBuffer('')
    setShake(false)
    setSolvedCount(0)
    setWinFlash(false)
    setIsTransitioning(false)
  }, [clearWinReveal, words, wordLength])

  const submit = useCallback(() => {
    if (isTransitioning || revealLock) return
    const g = buffer.toUpperCase()
    if (g.length !== wordLength) return
    if (!validSet.has(g)) {
      setShake(true)
      window.setTimeout(() => setShake(false), 450)
      return
    }

    const feedback = scoreGuess(target, g)
    const row: GuessRow = { letters: g, feedback }
    setGuesses((prev) => [...prev, row])
    setBuffer('')

    if (g === target) {
      if (mode === 'zenInfinite') {
        setIsTransitioning(true)
        window.setTimeout(() => {
          const nextTarget = pickTarget(words, wordLength)
          setTarget(nextTarget)
          setGuesses((prev) =>
            prev.map((row) => ({
              ...row,
              feedback: scoreGuess(nextTarget, row.letters),
              displayFeedback: undefined,
            })),
          )
          setBuffer('')
          setSolvedCount((c) => c + 1)
          setIsTransitioning(false)
        }, RECOLOR_DELAY_MS)
      } else {
        setRevealLock(true)
        scheduleWinReveal(() => {
          advanceWord()
          setWinFlash(true)
          window.setTimeout(() => setWinFlash(false), 900)
          setRevealLock(false)
        })
      }
    }
  }, [advanceWord, buffer, isTransitioning, mode, revealLock, scheduleWinReveal, target, validSet, wordLength, words])

  const addLetter = useCallback(
    (ch: string) => {
      if (isTransitioning || revealLock) return
      const c = ch.toUpperCase()
      if (!/^[A-Z]$/.test(c)) return
      if (buffer.length >= wordLength) return
      setBuffer((b) => b + c)
    },
    [buffer.length, isTransitioning, revealLock, wordLength],
  )

  const backspace = useCallback(() => {
    if (isTransitioning || revealLock) return
    setBuffer((b) => b.slice(0, -1))
  }, [isTransitioning, revealLock])

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

  const { gridGuesses, gridBuffer } = useMemo(
    () => zenWindowGuesses(guesses, buffer, VISIBLE_ROWS),
    [guesses, buffer],
  )

  const gridPhase: 'playing' | 'won' | 'lost' = 'playing'

  const inputLocked = isTransitioning || revealLock

  return {
    target,
    guesses,
    buffer,
    shake,
    newGame,
    submit,
    addLetter,
    backspace,
    onPhysicalKey,
    wordLength,
    maxGuesses: VISIBLE_ROWS,
    gridGuesses,
    gridBuffer,
    gridPhase,
    solvedCount,
    winFlash,
    mode,
    inputLocked,
  }
}
