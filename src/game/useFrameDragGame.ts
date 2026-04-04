import { useCallback, useMemo, useRef, useState } from 'react'
import {
  DEFAULT_MAX_SWAPS,
  fourEdgeWordsInDictionary,
  frameCellRowColFeedback,
  isFrameSolved,
  PERIMETER_SLOTS,
  pickRandomFramePuzzle,
  puzzleValid,
  solutionLetter,
  slotKey,
  type FramePuzzle,
} from './frameDragPuzzle'
import type { LetterFeedback } from '../variants/types'

function shuffleInPlace<T>(arr: T[], rng: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
}

function shuffledLettersRecord(p: FramePuzzle, rng: () => number): Record<string, string> {
  const list = PERIMETER_SLOTS.map(([r, c]) => solutionLetter(p, r, c))
  shuffleInPlace(list, rng)
  const out: Record<string, string> = {}
  PERIMETER_SLOTS.forEach(([r, c], i) => {
    out[slotKey(r, c)] = list[i]!
  })
  return out
}

function randomStartingLetters(p: FramePuzzle, rng: () => number): Record<string, string> {
  for (let t = 0; t < 80; t++) {
    const letters = shuffledLettersRecord(p, rng)
    if (!isFrameSolved(letters, p)) return letters
  }
  return shuffledLettersRecord(p, rng)
}

type Phase = 'playing' | 'won' | 'lost'

type RoundState = {
  puzzle: FramePuzzle | null
  letters: Record<string, string>
  swapsLeft: number
  phase: Phase
}

function freshRound(words5: readonly string[]): RoundState {
  const rng = Math.random
  for (let i = 0; i < 120; i++) {
    const p = pickRandomFramePuzzle(words5, rng)
    if (!p || !puzzleValid(p)) continue
    return {
      puzzle: p,
      letters: randomStartingLetters(p, rng),
      swapsLeft: DEFAULT_MAX_SWAPS,
      phase: 'playing',
    }
  }
  return { puzzle: null, letters: {}, swapsLeft: DEFAULT_MAX_SWAPS, phase: 'playing' }
}

export function useFrameDragGame(words5: readonly string[]) {
  const [round, setRound] = useState<RoundState>(() => freshRound(words5))
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  /** Mirrors selection for tap-to-swap; must not call setRound inside setSelectedSlot’s updater. */
  const selectedRef = useRef<string | null>(null)

  const wordSet = useMemo(() => new Set(words5), [words5])

  const newGame = useCallback(() => {
    selectedRef.current = null
    setRound(freshRound(words5))
    setSelectedSlot(null)
  }, [words5])

  const feedbackBySlot = useMemo(() => {
    const m = new Map<string, LetterFeedback>()
    const p = round.puzzle
    if (!p) return m
    for (const [r, c] of PERIMETER_SLOTS) {
      const k = slotKey(r, c)
      const ch = round.letters[k]
      if (!ch) continue
      m.set(k, frameCellRowColFeedback(p, r, c, round.letters))
    }
    return m
  }, [round.puzzle, round.letters])

  const swapSlots = useCallback((a: string, b: string) => {
    if (a === b) return
    setRound((prev) => {
      if (prev.phase !== 'playing' || prev.swapsLeft <= 0) return prev
      const la = prev.letters[a]
      const lb = prev.letters[b]
      if (!la || !lb) return prev
      const letters = { ...prev.letters, [a]: lb, [b]: la }
      const solved =
        prev.puzzle !== null &&
        isFrameSolved(letters, prev.puzzle) &&
        fourEdgeWordsInDictionary(letters, wordSet)
      const nextSwaps = prev.swapsLeft - 1
      if (solved) {
        return { ...prev, letters, swapsLeft: nextSwaps, phase: 'won' }
      }
      if (nextSwaps <= 0) {
        return { ...prev, letters, swapsLeft: 0, phase: 'lost' }
      }
      return { ...prev, letters, swapsLeft: nextSwaps }
    })
  }, [wordSet])

  const onPickSlot = useCallback(
    (slotKeyVal: string) => {
      if (round.phase !== 'playing') return
      const prev = selectedRef.current
      if (prev === null) {
        selectedRef.current = slotKeyVal
        setSelectedSlot(slotKeyVal)
        return
      }
      if (prev === slotKeyVal) {
        selectedRef.current = null
        setSelectedSlot(null)
        return
      }
      swapSlots(prev, slotKeyVal)
      selectedRef.current = null
      setSelectedSlot(null)
    },
    [round.phase, swapSlots],
  )

  const clearSelection = useCallback(() => {
    selectedRef.current = null
    setSelectedSlot(null)
  }, [])

  return {
    puzzle: round.puzzle,
    letters: round.letters,
    swapsLeft: round.swapsLeft,
    maxSwaps: DEFAULT_MAX_SWAPS,
    phase: round.phase,
    selectedSlot,
    newGame,
    feedbackBySlot,
    swapSlots,
    onPickSlot,
    clearSelection,
  }
}
