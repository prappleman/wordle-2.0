import { useCallback, useMemo, useState } from 'react'
import { keyboardLetterHints } from '../components/keyboardHints'
import { scoreGuess } from './engine'
import type { ClassicGameConfig } from '../variants/types'
import type { GuessRow } from './useWordleGame'

export type GamePhase = 'playing' | 'won' | 'lost'

const BAN_POOL = 'AEIOURSTLNH'

/** Letters the player has learned are not in the answer (best key state is gray). */
function lettersKnownNotInWord(guesses: GuessRow[]): Set<string> {
  const hints = keyboardLetterHints(guesses)
  const out = new Set<string>()
  for (const [L, fb] of hints) {
    if (fb === 'absent') out.add(L)
  }
  return out
}

/**
 * Random ban from common letters, excluding: letters in the answer, and letters
 * already ruled out as absent from prior guesses.
 */
function pickBannedLetter(target: string, guesses: GuessRow[]): string {
  const inTarget = new Set(target.toUpperCase().split(''))
  const ruledOut = lettersKnownNotInWord(guesses)

  const pickFrom = (candidates: readonly string[]) => {
    const pool = candidates.filter((c) => !inTarget.has(c) && !ruledOut.has(c))
    if (pool.length === 0) return ''
    return pool[Math.floor(Math.random() * pool.length)]!
  }

  const fromCommon = pickFrom(BAN_POOL.split(''))
  if (fromCommon) return fromCommon

  const fromRest = pickFrom('BCDFGHJKMPQVWXYZ'.split(''))
  if (fromRest) return fromRest

  return pickFrom('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''))
}

function pickTarget(words: readonly string[], wordLength: number): string {
  const pool = words.filter((w) => w.length === wordLength)
  if (pool.length === 0) {
    throw new Error(`No words of length ${wordLength}`)
  }
  return pool[Math.floor(Math.random() * pool.length)]!.toUpperCase()
}

function newTargetAndBan(words: readonly string[], wordLength: number) {
  const t = pickTarget(words, wordLength)
  return { target: t, bannedLetter: pickBannedLetter(t, []) }
}

export function useBannedWordleGame(config: ClassicGameConfig) {
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

  const [{ target, bannedLetter }, setCore] = useState(() => newTargetAndBan(words, wordLength))
  const [guesses, setGuesses] = useState<GuessRow[]>([])
  const [buffer, setBuffer] = useState('')
  const [phase, setPhase] = useState<GamePhase>('playing')
  const [shake, setShake] = useState(false)

  const newGame = useCallback(() => {
    setCore(newTargetAndBan(words, wordLength))
    setGuesses([])
    setBuffer('')
    setPhase('playing')
    setShake(false)
  }, [words, wordLength])

  const submit = useCallback(() => {
    if (phase !== 'playing') return
    const g = buffer.toUpperCase()
    if (g.length !== wordLength) return
    if (!validSet.has(g)) {
      setShake(true)
      window.setTimeout(() => setShake(false), 450)
      return
    }

    const ban = guesses.length < maxGuesses - 1 ? bannedLetter : ''
    if (ban && g.includes(ban)) {
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
    setCore((c) => {
      if (next.length < maxGuesses - 1) {
        return { ...c, bannedLetter: pickBannedLetter(c.target, next) }
      }
      return { ...c, bannedLetter: '' }
    })
  }, [buffer, bannedLetter, guesses, maxGuesses, phase, target, validSet, wordLength])

  const addLetter = useCallback(
    (ch: string) => {
      if (phase !== 'playing') return
      const c = ch.toUpperCase()
      if (!/^[A-Z]$/.test(c)) return
      if (buffer.length >= wordLength) return
      const ban = guesses.length < maxGuesses - 1 ? bannedLetter : ''
      if (ban && c === ban) {
        setShake(true)
        window.setTimeout(() => setShake(false), 450)
        return
      }
      setBuffer((b) => b + c)
    },
    [bannedLetter, buffer.length, guesses.length, maxGuesses, phase, wordLength],
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

  const inputLocked = phase !== 'playing'
  const activeBan =
    guesses.length < maxGuesses - 1 && phase === 'playing' ? bannedLetter : ''

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
    wordLength,
    maxGuesses,
    bannedLetter: activeBan,
  }
}
