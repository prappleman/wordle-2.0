import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { PlayScreenBackLink } from '../components/PlayScreenBackLink'
import { WordleGrid } from '../components/WordleGrid'
import { WordleKeyboard } from '../components/WordleKeyboard'
import { useSpacesWordleGame } from '../game/useSpacesWordleGame'
import { wordsForLength, wordLengthFromVariantId } from '../variants/variantWordLength'
import './ClassicWordleScreen.css'

export default function SpacesWordleScreen() {
  const { variantId = 'spaces-5' } = useParams<{ variantId: string }>()
  const wordLength = wordLengthFromVariantId(variantId)
  const words = wordsForLength(wordLength)
  const game = useSpacesWordleGame({ words, wordLength, maxGuesses: 6 })
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
        <PlayScreenBackLink className="classic-screen-back" />
        <h1 className="classic-screen-title">Spaces ({wordLength})</h1>
        <button type="button" className="classic-screen-new" onClick={game.newGame}>
          New word
        </button>
      </header>

      <p className="classic-screen-banner">
        Rows 1–5: type letters in fixed columns, then <strong>click a square</strong> to mark the
        wildcard (click again to clear). Choosing the wildcard clears that column only—other letters
        stay put. A wildcard guess is allowed if some valid word matches your typed letters. Each
        skip adds a <strong>bonus row</strong> (two fixed blocked squares you can’t move) before your
        final guess; type the other letters there. The last row is your {wordLength}-letter guess only
        (bonus rows are separate practice slots and are not appended to the final word).
      </p>
      <p className="classic-screen-banner">
        Bonus rows (2 tiles each): <strong>{game.bonusRowCount}</strong> · Bonus letters:{' '}
        <strong>{game.bonusSlots}</strong>
        {game.currentRow < 5 && (
          <>
            {' '}
            · Wildcard column:{' '}
            <strong>{game.skipIndex === null ? 'none' : game.skipIndex + 1}</strong>
          </>
        )}
      </p>

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
        blockedCellsByRow={game.blockedCellsByRow}
        rowWordLengths={game.rowWordLengths}
        typingRowCellsOverride={game.typingRowCells}
        pickSkipColumn={game.inputLocked ? null : game.setSkipSlot}
        pickSkipSelection={game.skipIndex}
        pickSkipMaxRowExclusive={5}
      />

      <WordleKeyboard guesses={game.guesses} disabled={game.inputLocked} onKey={onScreenKey} />
    </div>
  )
}
