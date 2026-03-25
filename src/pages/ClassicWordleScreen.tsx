import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { WordleGrid } from '../components/WordleGrid'
import { WordleKeyboard } from '../components/WordleKeyboard'
import { useWordleGame } from '../game/useWordleGame'
import type { ClassicGameConfig } from '../variants/types'
import './ClassicWordleScreen.css'

interface ClassicWordleScreenProps {
  title: string
  config: ClassicGameConfig
}

export function ClassicWordleScreen({ title, config }: ClassicWordleScreenProps) {
  const game = useWordleGame(config)
  const { onPhysicalKey } = game

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === 'Enter' || e.key === 'Backspace') {
        e.preventDefault()
      }
      onPhysicalKey(e.key)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onPhysicalKey])

  const keyboardDisabled = game.phase !== 'playing'

  const onScreenKey = (key: string) => {
    if (key === 'Enter') {
      game.submit()
      return
    }
    if (key === 'Backspace') {
      game.backspace()
      return
    }
    game.addLetter(key)
  }

  return (
    <div className="classic-screen">
      <header className="classic-screen-header">
        <Link to="/" className="classic-screen-back">
          ← Hub
        </Link>
        <h1 className="classic-screen-title">{title}</h1>
        <button type="button" className="classic-screen-new" onClick={game.newGame}>
          New word
        </button>
      </header>

      {game.phase === 'won' && (
        <p className="classic-screen-banner classic-screen-banner--win">You got it!</p>
      )}
      {game.phase === 'lost' && (
        <p className="classic-screen-banner classic-screen-banner--lose">
          The word was <strong>{game.target}</strong>
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

      <WordleKeyboard
        guesses={game.guesses}
        disabled={keyboardDisabled}
        onKey={onScreenKey}
      />
    </div>
  )
}
