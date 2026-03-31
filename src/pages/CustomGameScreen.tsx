import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { WordleGrid } from '../components/WordleGrid'
import { WordleKeyboard } from '../components/WordleKeyboard'
import { useWordleGame, type GamePhase } from '../game/useWordleGame'
import { useCountdown } from '../hooks/useCountdown'
import { getPresetById } from '../lib/customPresets'
import { pickTargetWord, wordsForPresetLength, type CustomGamePreset } from '../variants/customPreset'
import { clampLadderLength, ladderRoundLabel, nextLadderInRange } from '../variants/ladderRange'
import './ClassicWordleScreen.css'
import './CustomGameScreen.css'

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

export default function CustomGameScreen() {
  const { presetId = '' } = useParams<{ presetId: string }>()
  const preset = presetId ? getPresetById(presetId) : undefined

  const lo = preset ? Math.min(preset.ladderLo, preset.ladderHi) : 2
  const hi = preset ? Math.max(preset.ladderLo, preset.ladderHi) : 12

  const [roundKey, setRoundKey] = useState(0)
  const [roundIndex, setRoundIndex] = useState(0)
  const [currentLength, setCurrentLength] = useState(() =>
    preset?.ladderEnabled ? clampLadderLength(lo) : clampLadderLength(preset?.wordLength ?? 5),
  )
  const [sessionComplete, setSessionComplete] = useState(false)
  const [sessionLost, setSessionLost] = useState(false)

  useEffect(() => {
    if (!preset) return
    setRoundIndex(0)
    setSessionComplete(false)
    setSessionLost(false)
    setCurrentLength(preset.ladderEnabled ? clampLadderLength(lo) : clampLadderLength(preset.wordLength))
    setRoundKey((k) => k + 1)
  }, [presetId, preset?.ladderEnabled, preset?.wordLength, lo])

  const words = useMemo(() => {
    if (!preset) return [] as readonly string[]
    return wordsForPresetLength(preset, currentLength)
  }, [preset, currentLength])

  const targetWord = useMemo(() => {
    if (!preset || words.length === 0) return ''
    try {
      return pickTargetWord(preset, words, roundIndex)
    } catch {
      return ''
    }
  }, [preset, words, roundIndex, roundKey])

  const handleRoundEnd = useCallback(
    (result: 'won' | 'lost') => {
      if (!preset) return
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
      setRoundIndex((i) => i + 1)
      setRoundKey((k) => k + 1)
    },
    [currentLength, hi, lo, preset, roundIndex],
  )

  const resetSession = useCallback(() => {
    if (!preset) return
    setSessionLost(false)
    setSessionComplete(false)
    setRoundIndex(0)
    setCurrentLength(preset.ladderEnabled ? clampLadderLength(lo) : clampLadderLength(preset.wordLength))
    setRoundKey((k) => k + 1)
  }, [lo, preset])

  if (!presetId) {
    return <Navigate to="/my-variants" replace />
  }
  if (!preset) {
    return (
      <div className="classic-screen">
        <p className="custom-game-screen-missing">Preset not found.</p>
        <Link to="/my-variants">← My variants</Link>
      </div>
    )
  }

  if (words.length === 0 || !targetWord) {
    return (
      <div className="classic-screen">
        <p className="custom-game-screen-missing">
          No words available for length {currentLength}. Edit your preset and add words for this length.
        </p>
        <Link to="/my-variants">← My variants</Link>
      </div>
    )
  }

  const meta = preset.ladderEnabled ? ladderRoundLabel(currentLength, lo, hi) : null
  const timerLabel =
    preset.timeLimitSeconds != null ? `${preset.timeLimitSeconds}s per round` : null

  return (
    <div className="classic-screen custom-game-screen">
      <header className="classic-screen-header">
        <Link to="/my-variants" className="classic-screen-back">
          ← My variants
        </Link>
        <h1 className="classic-screen-title">{preset.name}</h1>
        <button type="button" className="classic-screen-new" onClick={resetSession}>
          Restart session
        </button>
      </header>

      <p className="custom-game-screen-meta">
        {meta && (
          <>
            Ladder: {meta.round}/{meta.total} · length {currentLength}
          </>
        )}
        {!meta && (
          <>
            {currentLength} letters · round {roundIndex + 1}/{preset.maxSessionRounds}
          </>
        )}
        {timerLabel && ` · ${timerLabel}`}
      </p>

      {sessionLost && (
        <p className="classic-screen-banner classic-screen-banner--lose">
          Session over — you ran out of guesses.
        </p>
      )}
      {sessionComplete && (
        <p className="classic-screen-banner classic-screen-banner--win">Session complete!</p>
      )}

      {!sessionLost && !sessionComplete && (
        <CustomRound
          key={`${roundKey}-${targetWord}-${currentLength}`}
          preset={preset}
          words={words}
          wordLength={currentLength}
          target={targetWord}
          roundKey={roundKey}
          onEnded={handleRoundEnd}
        />
      )}
    </div>
  )
}
