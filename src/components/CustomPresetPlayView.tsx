import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PlayScreenBackLink } from './PlayScreenBackLink'
import { WordleGrid } from './WordleGrid'
import { WordleKeyboard } from './WordleKeyboard'
import { useWordleGame, type GamePhase } from '../game/useWordleGame'
import { useCountdown } from '../hooks/useCountdown'
import { pickTargetWord, wordsForPresetLength, type CustomGamePreset } from '../variants/customPreset'
import { clampLadderLength, ladderRoundLabel, nextLadderInRange } from '../variants/ladderRange'
import '../pages/ClassicWordleScreen.css'
import '../pages/CustomGameScreen.css'
import './CustomPresetPlayView.css'


function isTypingInFormField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'))
}

function CustomRound({
  preset,
  words,
  wordLength,
  target,
  roundKey,
  onEnded,
}: {
  preset: CustomGamePreset
  words: readonly string[]
  wordLength: number
  target: string
  roundKey: number
  onEnded: (result: 'won' | 'lost') => void
}) {
  const game = useWordleGame(
    { words, wordLength, maxGuesses: preset.maxGuesses },
    {
      allowNonDictionary: preset.allowNonDictionary,
      lockRevealedGreens: preset.lockRevealedGreens,
      forbidAbsentLetters: preset.forbidAbsentLetters,
      forcedTarget: target,
    },
  )

  const prevPhase = useRef<GamePhase | null>(null)
  useEffect(() => {
    prevPhase.current = null
  }, [roundKey])

  useEffect(() => {
    const p = prevPhase.current
    if (p === 'playing' && game.phase !== 'playing') {
      onEnded(game.phase === 'won' ? 'won' : 'lost')
    }
    prevPhase.current = game.phase
  }, [game.phase, onEnded])

  const { onPhysicalKey } = game

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (isTypingInFormField(e.target)) return
      if (e.key === 'Enter' || e.key === 'Backspace') e.preventDefault()
      onPhysicalKey(e.key)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onPhysicalKey])

  const secondsLeft = useCountdown(preset.timeLimitSeconds, {
    active: game.phase === 'playing',
    resetKey: roundKey,
    onExpire: () => game.forceLoss(),
  })

  const onScreenKey = (key: string) => {
    if (key === 'Enter') return game.submit()
    if (key === 'Backspace') return game.backspace()
    return game.addLetter(key)
  }

  return (
    <>
      {game.phase === 'won' && (
        <p className="classic-screen-banner classic-screen-banner--win">You got it!</p>
      )}
      {game.phase === 'lost' && (
        <p className="classic-screen-banner classic-screen-banner--lose">
          The word was <strong>{game.target}</strong>
        </p>
      )}
      {secondsLeft != null && game.phase === 'playing' && (
        <p className="custom-game-screen-timer" aria-live="polite">
          {secondsLeft}s
        </p>
      )}

      <WordleGrid
        wordLength={game.wordLength}
        maxGuesses={game.maxGuesses}
        guesses={game.guesses}
        buffer={game.buffer}
        phase={game.phase}
        shake={game.shake}
      />

      <WordleKeyboard guesses={game.guesses} disabled={game.inputLocked} onKey={onScreenKey} />
    </>
  )
}

export type CustomPresetPlayViewProps = {
  preset: CustomGamePreset
  variant?: 'page' | 'embedded'
}

export function CustomPresetPlayView({ preset, variant = 'page' }: CustomPresetPlayViewProps) {
  const embedded = variant === 'embedded'

  const lo = Math.min(preset.ladderLo, preset.ladderHi)
  const hi = Math.max(preset.ladderLo, preset.ladderHi)
  const customAnyLength = preset.wordSource === 'custom' && !preset.ladderEnabled

  const [roundKey, setRoundKey] = useState(0)
  const [roundIndex, setRoundIndex] = useState(0)
  const [currentLength, setCurrentLength] = useState(() =>
    preset.ladderEnabled ? clampLadderLength(lo) : clampLadderLength(preset.wordLength),
  )
  const [sessionComplete, setSessionComplete] = useState(false)
  const [sessionLost, setSessionLost] = useState(false)

  useEffect(() => {
    setRoundIndex(0)
    setSessionComplete(false)
    setSessionLost(false)
    setCurrentLength(preset.ladderEnabled ? clampLadderLength(lo) : clampLadderLength(preset.wordLength))
    setRoundKey((k) => k + 1)
  }, [preset, preset.ladderEnabled, preset.wordLength, lo])

  const customAll = useMemo(() => {
    if (preset.wordSource !== 'custom') return [] as string[]
    return preset.customWords.map((w) => w.toUpperCase())
  }, [preset.customWords, preset.wordSource])

  const targetWord = useMemo(() => {
    if (!customAnyLength) {
      const words = wordsForPresetLength(preset, currentLength)
      if (words.length === 0) return ''
      try {
        return pickTargetWord(preset, words, roundIndex)
      } catch {
        return ''
      }
    }
    if (customAll.length === 0) return ''
    // For custom lists (non-ladder): pick target from all words, then set length to match that word.
    if (preset.customWordOrder === 'sequential') {
      return customAll[roundIndex % customAll.length] ?? ''
    }
    return customAll[Math.floor(Math.random() * customAll.length)] ?? ''
  }, [customAll, customAnyLength, currentLength, preset, roundIndex])

  const effectiveLength = customAnyLength && targetWord ? targetWord.length : currentLength
  const words = useMemo(() => wordsForPresetLength(preset, effectiveLength), [preset, effectiveLength])

  const handleRoundEnd = useCallback(
    (result: 'won' | 'lost') => {
      if (result === 'lost') {
        setSessionLost(true)
        return
      }
      if (roundIndex + 1 >= preset.maxSessionRounds) {
        setSessionComplete(true)
        return
      }
      if (preset.ladderEnabled) {
        const n = nextLadderInRange(currentLength, lo, hi, preset.ladderMode)
        if (n === null) {
          setSessionComplete(true)
          return
        }
        setCurrentLength(n)
        setRoundIndex((i) => i + 1)
        setRoundKey((k) => k + 1)
        return
      }
      // For custom lists without ladder, word length can change per-round; we only advance the round.
      setRoundIndex((i) => i + 1)
      setRoundKey((k) => k + 1)
    },
    [currentLength, hi, lo, preset, roundIndex],
  )

  const resetSession = useCallback(() => {
    setSessionLost(false)
    setSessionComplete(false)
    setRoundIndex(0)
    setCurrentLength(preset.ladderEnabled ? clampLadderLength(lo) : clampLadderLength(preset.wordLength))
    setRoundKey((k) => k + 1)
  }, [lo, preset.ladderEnabled, preset.wordLength])

  if (words.length === 0 || !targetWord) {
    return (
      <div className={`classic-screen custom-game-screen${embedded ? ' custom-preset-play--embedded' : ''}`}>
        <p className="custom-game-screen-missing">
          No words available for length {effectiveLength}. Add dictionary words or custom list entries for this length.
        </p>
      </div>
    )
  }

  const meta = preset.ladderEnabled ? ladderRoundLabel(effectiveLength, lo, hi) : null
  const timerLabel = preset.timeLimitSeconds != null ? `${preset.timeLimitSeconds}s per round` : null

  return (
    <div
      className={`classic-screen custom-game-screen${embedded ? ' custom-preset-play--embedded' : ''}`}
      tabIndex={embedded ? -1 : undefined}
    >
      <header className="classic-screen-header">
        {embedded ? (
          <span className="custom-preset-play-embedded-label" aria-hidden>
            Test
          </span>
        ) : (
          <PlayScreenBackLink className="classic-screen-back" />
        )}
        <h1 className="classic-screen-title">{preset.name}</h1>
        <button type="button" className="classic-screen-new" onClick={resetSession}>
          Restart
        </button>
      </header>

      <p className="custom-game-screen-meta">
        {meta && (
          <>
            Ladder: {meta.round}/{meta.total} · length {effectiveLength}
          </>
        )}
        {!meta && preset.maxSessionRounds === 1 && <>{effectiveLength} letters</>}
        {!meta && preset.maxSessionRounds !== 1 && (
          <>
            {effectiveLength} letters · round {roundIndex + 1}/{preset.maxSessionRounds}
          </>
        )}
        {timerLabel && ` · ${timerLabel}`}
      </p>

      {sessionLost && (
        <p className="classic-screen-banner classic-screen-banner--lose">Session over — you ran out of guesses.</p>
      )}
      {sessionComplete && <p className="classic-screen-banner classic-screen-banner--win">Session complete!</p>}

      {!sessionLost && !sessionComplete && (
        <CustomRound
          key={`${roundKey}-${targetWord}-${effectiveLength}`}
          preset={preset}
          words={words}
          wordLength={effectiveLength}
          target={targetWord}
          roundKey={roundKey}
          onEnded={handleRoundEnd}
        />
      )}
    </div>
  )
}
