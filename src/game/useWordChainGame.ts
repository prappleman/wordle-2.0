import { useCallback, useMemo, useState } from 'react'
import { hammingDistance, isReachable, pickRandomSolvablePair } from './wordChainEngine'
import type { GamePhase } from './useWordleGame'

export interface WordChainGameConfig {
  words: readonly string[]
  wordLength: number
}

function createInitialState(words: readonly string[], wordLength: number) {
  const pair = pickRandomSolvablePair(words, wordLength, Math.random)
  if (!pair) {
    throw new Error(`Could not build a word chain for length ${wordLength}`)
  }
  return {
    startWord: pair.start,
    endWord: pair.end,
    optimalEdges: pair.optimalEdges,
    optimalPath: pair.optimalPath,
    pathWords: [pair.start] as string[],
    usedWords: new Set<string>([pair.start]),
    buffer: '',
    phase: 'playing' as GamePhase,
    shake: false,
  }
}

export function useWordChainGame(config: WordChainGameConfig) {
  const { words, wordLength } = config

  const validSet = useMemo(() => {
    const s = new Set<string>()
    for (const w of words) {
      if (w.length === wordLength) s.add(w.toUpperCase())
    }
    return s
  }, [words, wordLength])

  const [state, setState] = useState(() => createInitialState(words, wordLength))

  const { startWord, endWord, optimalEdges, optimalPath, pathWords, buffer, phase, shake } = state

  const maxGuessesAllowed = useMemo(() => {
    if (!optimalEdges) return 80
    return Math.min(100, optimalEdges + 28)
  }, [optimalEdges])

  const newGame = useCallback(() => {
    setState(createInitialState(words, wordLength))
  }, [words, wordLength])

  const guessesUsed = pathWords.length - 1

  const addLetter = useCallback(
    (ch: string) => {
      if (phase !== 'playing') return
      const c = ch.toUpperCase()
      if (!/^[A-Z]$/.test(c)) return
      if (buffer.length >= wordLength) return
      setState((s) => (s.phase !== 'playing' ? s : { ...s, buffer: s.buffer + c }))
    },
    [buffer.length, phase, wordLength],
  )

  const backspace = useCallback(() => {
    if (phase !== 'playing') return
    setState((s) => (s.phase !== 'playing' ? s : { ...s, buffer: s.buffer.slice(0, -1) }))
  }, [phase])

  const submit = useCallback(() => {
    setState((s) => {
      if (s.phase !== 'playing') return s
      const g = s.buffer.trim().toUpperCase()
      if (g.length !== wordLength) {
        window.setTimeout(() => setState((cur) => ({ ...cur, shake: false })), 450)
        return { ...s, shake: true }
      }
      if (!validSet.has(g)) {
        window.setTimeout(() => setState((cur) => ({ ...cur, shake: false })), 450)
        return { ...s, shake: true }
      }
      const prev = s.pathWords[s.pathWords.length - 1]!
      if (hammingDistance(prev, g) !== 1) {
        window.setTimeout(() => setState((cur) => ({ ...cur, shake: false })), 450)
        return { ...s, shake: true }
      }
      if (s.usedWords.has(g)) {
        window.setTimeout(() => setState((cur) => ({ ...cur, shake: false })), 450)
        return { ...s, shake: true }
      }
      if (!isReachable(g, s.endWord, validSet)) {
        window.setTimeout(() => setState((cur) => ({ ...cur, shake: false })), 450)
        return { ...s, shake: true }
      }

      const nextPath = [...s.pathWords, g]
      const nextGuesses = nextPath.length - 1
      const cap = Math.min(100, s.optimalEdges + 28)

      if (g === s.endWord) {
        return {
          ...s,
          pathWords: nextPath,
          usedWords: new Set(s.usedWords).add(g),
          buffer: '',
          phase: 'won' as const,
          shake: false,
        }
      }

      if (nextGuesses >= cap) {
        return {
          ...s,
          pathWords: nextPath,
          usedWords: new Set(s.usedWords).add(g),
          buffer: '',
          phase: 'lost' as const,
          shake: false,
        }
      }

      return {
        ...s,
        pathWords: nextPath,
        usedWords: new Set(s.usedWords).add(g),
        buffer: '',
        shake: false,
      }
    })
  }, [validSet, wordLength])

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
      if (key.length === 1) addLetter(key)
    },
    [addLetter, backspace, submit],
  )

  const inputLocked = phase !== 'playing'

  return {
    startWord,
    endWord,
    optimalEdges,
    optimalPath,
    maxGuessesAllowed,
    pathWords,
    buffer,
    phase,
    shake,
    guessesUsed,
    wordLength,
    newGame,
    addLetter,
    backspace,
    submit,
    onPhysicalKey,
    inputLocked,
  }
}
