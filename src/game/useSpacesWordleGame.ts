import { useCallback, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import {
  isValidWildcardGuess,
  isValidWildcardGuessMulti,
  matchesWildcardPattern,
  scoreGuess,
  scoreGuessMasked,
  scoreGuessMaskedMulti,
} from './engine'
import type { ClassicGameConfig } from '../variants/types'
import type { GuessRow } from './useWordleGame'

export type GamePhase = 'playing' | 'won' | 'lost'

const NORMAL_GUESSES = 5

function pickTarget(words: readonly string[], wordLength: number): string {
  const pool = words.filter((w) => w.length === wordLength)
  if (pool.length === 0) {
    throw new Error(`No words of length ${wordLength}`)
  }
  return pool[Math.floor(Math.random() * pool.length)]!.toUpperCase()
}

function emptyColumns(wordLength: number): string[] {
  return Array.from({ length: wordLength }, () => '')
}

function randomBlockedPair(wordLength: number): { a: number; b: number } {
  if (wordLength < 2) return { a: 0, b: 0 }
  let a = Math.floor(Math.random() * wordLength)
  let b = Math.floor(Math.random() * wordLength)
  let guard = 0
  while (b === a && guard++ < 50) {
    b = Math.floor(Math.random() * wordLength)
  }
  if (b === a) b = (a + 1) % wordLength
  return { a, b }
}

/** Letters in fixed columns; skip column omitted from short string. */
function guessShortFromColumns(columnLetters: string[], skipIndex: number | null): string {
  if (skipIndex === null) {
    return columnLetters.join('')
  }
  let out = ''
  for (let i = 0; i < columnLetters.length; i++) {
    if (i === skipIndex) continue
    out += columnLetters[i] || ''
  }
  return out
}

function guessShortFromTwoBlocked(
  columnLetters: string[],
  blockA: number,
  blockB: number,
): string {
  let out = ''
  for (let i = 0; i < columnLetters.length; i++) {
    if (i === blockA || i === blockB) continue
    out += columnLetters[i] || ''
  }
  return out
}

function cellsFromFixedColumns(columnLetters: string[], blocked: readonly number[]): string {
  const blockedSet = new Set(blocked)
  let out = ''
  for (let i = 0; i < columnLetters.length; i++) {
    if (blockedSet.has(i)) out += '\u00a0'
    else out += (columnLetters[i] || ' ')
  }
  return out
}

export function useSpacesWordleGame(config: ClassicGameConfig) {
  const { words, wordLength, maxGuesses: _legacyMax } = config
  void _legacyMax

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
  const [columnLetters, setColumnLetters] = useState<string[]>(() => emptyColumns(wordLength))
  const [lastRowBuffer, setLastRowBuffer] = useState('')
  const [phase, setPhase] = useState<GamePhase>('playing')
  const [shake, setShake] = useState(false)
  const [skipIndex, setSkipIndex] = useState<number | null>(null)
  /** Each skip adds one pair of fixed blocked cells on a bonus row before the final guess. */
  const [bonusRowSpecs, setBonusRowSpecs] = useState<{ a: number; b: number }[]>([])
  const [bonusColumnLetters, setBonusColumnLetters] = useState<string[][]>([])
  /** Prevents double-submit (e.g. Enter) from appending duplicate rows or duplicating final combined string. */
  const submitLockRef = useRef(false)

  const bonusRowCount = bonusRowSpecs.length
  const totalGridRows = NORMAL_GUESSES + bonusRowCount + 1
  const finalRowIndex = NORMAL_GUESSES + bonusRowCount

  const newGame = useCallback(() => {
    setTarget(pickTarget(words, wordLength))
    setGuesses([])
    setColumnLetters(emptyColumns(wordLength))
    setLastRowBuffer('')
    setPhase('playing')
    setShake(false)
    setSkipIndex(null)
    setBonusRowSpecs([])
    setBonusColumnLetters([])
  }, [words, wordLength])

  const currentRow = guesses.length

  const typedFullNormalRow = useMemo(() => {
    if (currentRow >= NORMAL_GUESSES) return false
    return columnLetters.every((ch) => ch.trim().length > 0)
  }, [columnLetters, currentRow])

  const letterCountInColumns = useMemo(() => {
    return columnLetters.filter((ch) => ch.trim().length > 0).length
  }, [columnLetters])

  const currentBufferMax = useMemo(() => {
    if (currentRow > finalRowIndex) return wordLength
    if (currentRow === finalRowIndex) {
      return wordLength
    }
    if (currentRow >= NORMAL_GUESSES && currentRow < finalRowIndex) {
      return wordLength - 2
    }
    return wordLength
  }, [currentRow, finalRowIndex, wordLength])

  const typingRowCells = useMemo(() => {
    if (currentRow >= finalRowIndex) return null
    if (currentRow < NORMAL_GUESSES) {
      let out = ''
      for (let i = 0; i < wordLength; i++) {
        if (skipIndex === i) out += '\u00a0'
        else out += (columnLetters[i] || ' ')
      }
      return out
    }
    const b = currentRow - NORMAL_GUESSES
    const spec = bonusRowSpecs[b]
    const cols = bonusColumnLetters[b]
    if (!spec || !cols) return null
    return cellsFromFixedColumns(cols, [spec.a, spec.b])
  }, [
    bonusColumnLetters,
    bonusRowSpecs,
    columnLetters,
    currentRow,
    finalRowIndex,
    skipIndex,
    wordLength,
  ])

  const bufferForGrid = currentRow === finalRowIndex ? lastRowBuffer : ''

  const setSkipSlot = useCallback(
    (columnIndex: number) => {
      if (phase !== 'playing') return
      if (currentRow >= NORMAL_GUESSES) return
      if (!typedFullNormalRow) return
      if (columnIndex < 0 || columnIndex >= wordLength) return
      setSkipIndex((prev) => (prev === columnIndex ? null : columnIndex))
    },
    [currentRow, phase, typedFullNormalRow, wordLength],
  )

  const submit = useCallback(() => {
    if (phase !== 'playing') return
    if (submitLockRef.current) return
    submitLockRef.current = true
    try {
      if (currentRow === finalRowIndex) {
        const core = lastRowBuffer.toUpperCase()
        if (core.length !== wordLength) return
        if (!validSet.has(core)) {
          setShake(true)
          window.setTimeout(() => setShake(false), 450)
          return
        }
        let appended = false
        flushSync(() => {
          setGuesses((prev) => {
            if (prev.length !== finalRowIndex) return prev
            const feedback = scoreGuess(target, core)
            const nextRow: GuessRow = { letters: core, feedback }
            appended = true
            return [...prev, nextRow]
          })
        })
        if (appended) {
          setLastRowBuffer('')
          setPhase(core === target ? 'won' : 'lost')
        }
        return
      }

      if (currentRow >= NORMAL_GUESSES && currentRow < finalRowIndex) {
        const b = currentRow - NORMAL_GUESSES
        const spec = bonusRowSpecs[b]
        const cols = bonusColumnLetters[b]
        if (!spec || !cols) return
        const buf = guessShortFromTwoBlocked(cols, spec.a, spec.b).toUpperCase()
        if (buf.length !== wordLength - 2) return
        if (!isValidWildcardGuessMulti(buf, [spec.a, spec.b], validSet)) {
          setShake(true)
          window.setTimeout(() => setShake(false), 450)
          return
        }
        const fb = scoreGuessMaskedMulti(target, buf, [spec.a, spec.b])
        const nextRow: GuessRow = {
          letters: buf,
          feedback: fb,
          rowBlockedIndices: [spec.a, spec.b],
        }
        setGuesses((prev) => {
          if (prev.length !== currentRow) return prev
          return [...prev, nextRow]
        })
        return
      }

      if (!typedFullNormalRow) return

      const useSkip = skipIndex !== null
      const buf = guessShortFromColumns(columnLetters, skipIndex).toUpperCase()
      const needLen = useSkip ? wordLength - 1 : wordLength
      if (buf.length !== needLen) return
      const dictOk = useSkip
        ? isValidWildcardGuess(buf, skipIndex!, validSet)
        : validSet.has(buf)
      if (!dictOk) {
        setShake(true)
        window.setTimeout(() => setShake(false), 450)
        return
      }

      const feedback = useSkip
        ? scoreGuessMasked(target, buf, skipIndex!)
        : scoreGuess(target, buf)
      const nextRow: GuessRow = {
        letters: buf,
        feedback,
        rowBlockedIndex: useSkip ? skipIndex! : undefined,
      }
      setGuesses((prev) => {
        if (prev.length !== currentRow) return prev
        return [...prev, nextRow]
      })
      setColumnLetters(emptyColumns(wordLength))
      if (useSkip) {
        setBonusRowSpecs((prev) => [...prev, randomBlockedPair(wordLength)])
        setBonusColumnLetters((prev) => [...prev, emptyColumns(wordLength)])
      }
      setSkipIndex(null)

      const won = useSkip
        ? matchesWildcardPattern(buf, target, skipIndex!)
        : buf === target
      if (won) {
        setPhase('won')
      }
    } finally {
      submitLockRef.current = false
    }
  }, [
    bonusColumnLetters,
    bonusRowCount,
    bonusRowSpecs,
    columnLetters,
    currentRow,
    finalRowIndex,
    lastRowBuffer,
    phase,
    skipIndex,
    target,
    typedFullNormalRow,
    validSet,
    wordLength,
  ])

  const addLetter = useCallback(
    (ch: string) => {
      if (phase !== 'playing') return
      const c = ch.toUpperCase()
      if (!/^[A-Z]$/.test(c)) return

      if (currentRow === finalRowIndex) {
        if (lastRowBuffer.length >= wordLength) return
        setLastRowBuffer((b) => b + c)
        return
      }

      if (currentRow >= NORMAL_GUESSES && currentRow < finalRowIndex) {
        const b = currentRow - NORMAL_GUESSES
        const spec = bonusRowSpecs[b]
        if (!spec) return
        const blocked = new Set([spec.a, spec.b])
        let count = 0
        for (let i = 0; i < wordLength; i++) {
          if (!blocked.has(i) && bonusColumnLetters[b]?.[i]) count++
        }
        if (count >= wordLength - 2) return
        setBonusColumnLetters((rows) => {
          const nextRows = [...rows]
          const cols = [...(nextRows[b] ?? emptyColumns(wordLength))]
          for (let i = 0; i < wordLength; i++) {
            if (blocked.has(i)) continue
            if (cols[i] === '') {
              cols[i] = c
              break
            }
          }
          nextRows[b] = cols
          return nextRows
        })
        return
      }

      if (letterCountInColumns >= currentBufferMax) return
      setColumnLetters((cols) => {
        const next = [...cols]
        if (skipIndex === null) {
          const i = next.findIndex((x) => x === '')
          if (i === -1) return next
          next[i] = c
          return next
        }
        for (let i = 0; i < wordLength; i++) {
          if (i === skipIndex) continue
          if (next[i] === '') {
            next[i] = c
            break
          }
        }
        return next
      })
    },
    [
      bonusColumnLetters,
      bonusRowSpecs,
      currentBufferMax,
      currentRow,
      finalRowIndex,
      lastRowBuffer.length,
      letterCountInColumns,
      phase,
      skipIndex,
      wordLength,
    ],
  )

  const backspace = useCallback(() => {
    if (phase !== 'playing') return
    if (currentRow === finalRowIndex) {
      setLastRowBuffer((b) => b.slice(0, -1))
      return
    }
    if (currentRow >= NORMAL_GUESSES && currentRow < finalRowIndex) {
      const b = currentRow - NORMAL_GUESSES
      const spec = bonusRowSpecs[b]
      if (!spec) return
      const blocked = new Set([spec.a, spec.b])
      setBonusColumnLetters((rows) => {
        const nextRows = [...rows]
        const cols = [...(nextRows[b] ?? emptyColumns(wordLength))]
        for (let i = wordLength - 1; i >= 0; i--) {
          if (blocked.has(i)) continue
          if (cols[i] !== '') {
            cols[i] = ''
            break
          }
        }
        nextRows[b] = cols
        return nextRows
      })
      return
    }
    setColumnLetters((cols) => {
      const next = [...cols]
      if (skipIndex === null) {
        let last = -1
        for (let i = 0; i < wordLength; i++) {
          if (next[i] !== '') last = i
        }
        if (last >= 0) next[last] = ''
        return next
      }
      for (let i = wordLength - 1; i >= 0; i--) {
        if (i === skipIndex) continue
        if (next[i] !== '') {
          next[i] = ''
          break
        }
      }
      return next
    })
  }, [currentRow, finalRowIndex, bonusRowSpecs, phase, skipIndex, wordLength])

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

  const blockedCellsByRow = useMemo(() => {
    const arr: (number[] | null)[] = Array.from({ length: totalGridRows }, () => null)
    for (let r = 0; r < guesses.length; r++) {
      const g = guesses[r]!
      if (g.rowBlockedIndices && g.rowBlockedIndices.length >= 2) {
        arr[r] = [...g.rowBlockedIndices].sort((x, y) => x - y)
      } else if (g.rowBlockedIndex != null && g.rowBlockedIndex >= 0) {
        arr[r] = [g.rowBlockedIndex]
      }
    }
    // As soon as bonus rows are earned, show their fixed blocked squares.
    for (let b = 0; b < bonusRowSpecs.length; b++) {
      const r = NORMAL_GUESSES + b
      if (r >= 0 && r < totalGridRows) {
        const spec = bonusRowSpecs[b]!
        arr[r] = [spec.a, spec.b].sort((x, y) => x - y)
      }
    }
    if (phase === 'playing' && currentRow < totalGridRows) {
      if (currentRow < NORMAL_GUESSES) {
        arr[currentRow] = skipIndex !== null && skipIndex >= 0 ? [skipIndex] : null
      } else if (currentRow < finalRowIndex) {
        const b = currentRow - NORMAL_GUESSES
        const spec = bonusRowSpecs[b]
        if (spec) {
          arr[currentRow] = [spec.a, spec.b].sort((x, y) => x - y)
        }
      }
    }
    return arr
  }, [
    bonusRowSpecs,
    currentRow,
    finalRowIndex,
    guesses,
    phase,
    skipIndex,
    totalGridRows,
  ])

  const rowWordLengths = useMemo(() => {
    return Array.from({ length: totalGridRows }, () => wordLength)
  }, [totalGridRows, wordLength])

  return {
    target,
    guesses,
    buffer: bufferForGrid,
    typingRowCells,
    phase,
    shake,
    inputLocked: phase !== 'playing',
    newGame,
    submit,
    addLetter,
    backspace,
    onPhysicalKey,
    setSkipSlot,
    wordLength,
    maxGuesses: totalGridRows,
    skipIndex,
    bonusSlots: bonusRowCount * 2,
    bonusRowCount,
    blockedCellsByRow,
    rowWordLengths,
    currentRow,
  }
}
