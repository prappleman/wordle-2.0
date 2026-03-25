import { useCallback, useMemo, useState } from 'react'
import { scoreGuessAggregate } from './word500Aggregate'
import type { ClassicGameConfig } from '../variants/types'

const MAX_GUESSES = 8

function pickTarget(words: readonly string[], wordLength: number): string {
  const pool = words.filter((w) => w.length === wordLength)
  if (pool.length === 0) {
    throw new Error(`No words of length ${wordLength}`)
  }
  return pool[Math.floor(Math.random() * pool.length)]!.toUpperCase()
}

export interface Word500GuessRow {
  letters: string
  aggregate: { green: number; yellow: number; red: number }
}

export type TileNote = 'none' | 'green' | 'yellow' | 'red'

function markKey(row: number, col: number): string {
  return `${row},${col}`
}

const NOTE_CYCLE: TileNote[] = ['none', 'green', 'yellow', 'red']

export function useWord500Game(config: Pick<ClassicGameConfig, 'words' | 'wordLength'>) {
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
  const [guesses, setGuesses] = useState<Word500GuessRow[]>([])
  const [buffer, setBuffer] = useState('')
  const [shake, setShake] = useState(false)
  const [phase, setPhase] = useState<'playing' | 'won' | 'lost'>('playing')
  const [marks, setMarks] = useState<Record<string, TileNote>>({})
  /** Letters confirmed not in the word (from a guess where every tile was absent / “all red”). */
  const [absentLetters, setAbsentLetters] = useState<Set<string>>(() => new Set())

  const newGame = useCallback(() => {
    setTarget(pickTarget(words, wordLength))
    setGuesses([])
    setBuffer('')
    setShake(false)
    setPhase('playing')
    setMarks({})
    setAbsentLetters(new Set())
  }, [words, wordLength])

  const cycleMark = useCallback((row: number, col: number) => {
    if (phase !== 'playing' && phase !== 'won') return
    if (row < 0 || row >= guesses.length) return
    const k = markKey(row, col)
    setMarks((prev) => {
      const cur = prev[k] ?? 'none'
      const idx = NOTE_CYCLE.indexOf(cur)
      const next = NOTE_CYCLE[(idx + 1) % NOTE_CYCLE.length]!
      const out = { ...prev }
      if (next === 'none') {
        delete out[k]
      } else {
        out[k] = next
      }
      return out
    })
  }, [guesses.length, phase])

  const submit = useCallback(() => {
    if (phase !== 'playing') return
    const g = buffer.toUpperCase()
    if (g.length !== wordLength) return
    if (guesses.length >= MAX_GUESSES) return

    if (!validSet.has(g)) {
      setShake(true)
      window.setTimeout(() => setShake(false), 450)
      return
    }

    const aggregate = scoreGuessAggregate(target, g)
    const row: Word500GuessRow = { letters: g, aggregate }

    const allRed =
      aggregate.red === wordLength && aggregate.green === 0 && aggregate.yellow === 0
    if (allRed) {
      setAbsentLetters((prev) => {
        const next = new Set(prev)
        for (let i = 0; i < g.length; i++) {
          next.add(g[i]!)
        }
        return next
      })
    }

    if (g === target) {
      setGuesses((prev) => [...prev, row])
      setBuffer('')
      setPhase('won')
      return
    }

    setGuesses((prev) => {
      const next = [...prev, row]
      if (next.length >= MAX_GUESSES) {
        setPhase('lost')
      }
      return next
    })
    setBuffer('')
  }, [buffer, guesses.length, phase, target, validSet, wordLength])

  const addLetter = useCallback(
    (ch: string) => {
      if (phase !== 'playing') return
      if (guesses.length >= MAX_GUESSES) return
      const c = ch.toUpperCase()
      if (!/^[A-Z]$/.test(c)) return
      if (buffer.length >= wordLength) return
      setBuffer((b) => b + c)
    },
    [buffer.length, guesses.length, phase, wordLength],
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

  const getMark = useCallback(
    (row: number, col: number): TileNote => {
      return marks[markKey(row, col)] ?? 'none'
    },
    [marks],
  )

  return {
    target,
    guesses,
    buffer,
    shake,
    phase,
    newGame,
    submit,
    addLetter,
    backspace,
    onPhysicalKey,
    wordLength,
    maxGuesses: MAX_GUESSES,
    cycleMark,
    getMark,
    absentLetters,
  }
}
