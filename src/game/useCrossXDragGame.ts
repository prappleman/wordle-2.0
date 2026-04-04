import { useCallback, useMemo, useRef, useState } from 'react'
import {
  CROSS_X_DEFAULT_MAX_SWAPS,
  crossXCellRowColFeedback,
  getCrosswordSlots,
  isCrossXSolved,
  pickRandomCrosswordPuzzle,
  puzzleValidCrossX,
  solutionLetterCrossX,
  twoWordsCrossXInDictionary,
  type CrosswordWordBuckets,
  type CrossXPuzzle,
} from './crossXDragPuzzle'
import { slotKey } from './frameDragPuzzle'
import type { LetterFeedback } from '../variants/types'

function shuffleInPlace<T>(arr: T[], rng: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
}

function shuffledLettersRecord(p: CrossXPuzzle, rng: () => number): Record<string, string> {
  const slots = getCrosswordSlots(p)
  const list = slots.map(([r, c]) => solutionLetterCrossX(p, r, c))
  shuffleInPlace(list, rng)
  const out: Record<string, string> = {}
  slots.forEach(([r, c], i) => {
    out[slotKey(r, c)] = list[i]!
  })
  return out
}

function randomStartingLetters(p: CrossXPuzzle, rng: () => number): Record<string, string> {
  for (let t = 0; t < 100; t++) {
    const letters = shuffledLettersRecord(p, rng)
    if (!isCrossXSolved(letters, p)) return letters
  }
  return shuffledLettersRecord(p, rng)
}

type Phase = 'playing' | 'won' | 'lost'

type RoundState = {
  puzzle: CrossXPuzzle | null
  letters: Record<string, string>
  swapsLeft: number
  phase: Phase
}

function freshRound(buckets: CrosswordWordBuckets): RoundState {
  const rng = Math.random
  for (let i = 0; i < 200; i++) {
    const p = pickRandomCrosswordPuzzle(buckets, rng)
    if (!p || !puzzleValidCrossX(p)) continue
    return {
      puzzle: p,
      letters: randomStartingLetters(p, rng),
      swapsLeft: CROSS_X_DEFAULT_MAX_SWAPS,
      phase: 'playing',
    }
  }
  return { puzzle: null, letters: {}, swapsLeft: CROSS_X_DEFAULT_MAX_SWAPS, phase: 'playing' }
}

function unionWordSet(buckets: CrosswordWordBuckets): Set<string> {
  return new Set([...buckets[4], ...buckets[5], ...buckets[6]])
}

export function useCrossXDragGame(buckets: CrosswordWordBuckets) {
  const [round, setRound] = useState<RoundState>(() => freshRound(buckets))
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const selectedRef = useRef<string | null>(null)

  const wordSet = useMemo(() => unionWordSet(buckets), [buckets])

  const newGame = useCallback(() => {
    selectedRef.current = null
    setRound(freshRound(buckets))
    setSelectedSlot(null)
  }, [buckets])

  const feedbackBySlot = useMemo(() => {
    const m = new Map<string, LetterFeedback>()
    const p = round.puzzle
    if (!p) return m
    for (const [r, c] of getCrosswordSlots(p)) {
      const k = slotKey(r, c)
      const ch = round.letters[k]
      if (!ch) continue
      m.set(k, crossXCellRowColFeedback(p, r, c, round.letters))
    }
    return m
  }, [round.puzzle, round.letters])

  const swapSlots = useCallback(
    (a: string, b: string) => {
      if (a === b) return
      setRound((prev) => {
        if (prev.phase !== 'playing' || prev.swapsLeft <= 0) return prev
        const la = prev.letters[a]
        const lb = prev.letters[b]
        if (!la || !lb) return prev
        const letters = { ...prev.letters, [a]: lb, [b]: la }
        const solved =
          prev.puzzle !== null &&
          isCrossXSolved(letters, prev.puzzle) &&
          twoWordsCrossXInDictionary(letters, wordSet, prev.puzzle)
        const nextSwaps = prev.swapsLeft - 1
        if (solved) {
          return { ...prev, letters, swapsLeft: nextSwaps, phase: 'won' }
        }
        if (nextSwaps <= 0) {
          return { ...prev, letters, swapsLeft: 0, phase: 'lost' }
        }
        return { ...prev, letters, swapsLeft: nextSwaps }
      })
    },
    [wordSet],
  )

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
    maxSwaps: CROSS_X_DEFAULT_MAX_SWAPS,
    phase: round.phase,
    selectedSlot,
    newGame,
    feedbackBySlot,
    swapSlots,
    onPickSlot,
    clearSelection,
  }
}
