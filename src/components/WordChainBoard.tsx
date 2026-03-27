import { scoreGuessGreenOnly } from '../game/engine'
import type { LetterFeedback } from '../variants/types'
import './WordleGrid.css'
import './WordChainBoard.css'

function tileEndpoint(filled: boolean): string {
  const base = 'wordle-tile'
  if (!filled) return base
  return `${base} word-chain-tile--endpoint`
}

function tileWinning(): string {
  return 'wordle-tile wordle-tile--correct'
}

function tileScoredGreenOnly(fb: LetterFeedback | undefined, filled: boolean): string {
  const base = 'wordle-tile'
  if (!filled) return base
  if (fb === undefined) return `${base} wordle-tile--typing`
  return `${base} wordle-tile--${fb}`
}

function partialBufferFeedback(buffer: string, end: string): (LetterFeedback | undefined)[] {
  return Array.from({ length: end.length }, (_, i) => {
    if (i >= buffer.length) return undefined
    return buffer[i] === end[i] ? 'correct' : 'absent'
  })
}

function PathRow({
  word,
  wordLength,
  endWord,
  phase,
  isStart,
}: {
  word: string
  wordLength: number
  endWord: string
  phase: 'playing' | 'won' | 'lost'
  isStart: boolean
}) {
  const isWinningEndRow = phase === 'won' && word === endWord
  const feedback = isStart || isWinningEndRow ? null : scoreGuessGreenOnly(endWord, word)
  return (
    <div className="word-chain-board-block">
      <div className="wordle-row" role="row">
        {Array.from({ length: wordLength }, (_, i) => {
          const ch = word[i] ?? ' '
          const filled = ch.trim().length > 0
          let cls: string
          if (isStart) {
            cls = tileEndpoint(filled)
          } else if (isWinningEndRow) {
            cls = filled ? tileWinning() : 'wordle-tile'
          } else {
            cls = tileScoredGreenOnly(feedback![i], filled)
          }
          return (
            <div key={i} className={cls} role="gridcell">
              {filled ? ch : ''}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export interface WordChainBoardProps {
  endWord: string
  pathWords: string[]
  buffer: string
  wordLength: number
  phase: 'playing' | 'won' | 'lost'
  shake: boolean
}

export function WordChainBoard({
  endWord,
  pathWords,
  buffer,
  wordLength,
  phase,
  shake,
}: WordChainBoardProps) {
  const startWord = pathWords[0] ?? ''
  const middlePath = pathWords.slice(1)
  const lastCommitted = pathWords[pathWords.length - 1] ?? ''
  const showGoalRow = lastCommitted !== endWord
  const bufferPartialFb = partialBufferFeedback(buffer, endWord)

  const hasTightBlock = middlePath.length > 0 || phase === 'playing'

  return (
    <div
      className={`word-chain-board ${shake ? 'word-chain-board--shake' : ''}`}
      data-cols={wordLength}
      role="grid"
      aria-label="Word chain"
    >
      {startWord && (
        <div className="word-chain-board-start">
          <PathRow
            word={startWord}
            wordLength={wordLength}
            endWord={endWord}
            phase={phase}
            isStart
          />
        </div>
      )}

      {hasTightBlock && (
        <div
          className={`word-chain-board-tight${showGoalRow ? ' word-chain-board-tight--above-goal' : ''}`}
        >
          {middlePath.map((word, idx) => (
            <PathRow
              key={`m-${idx}-${word}`}
              word={word}
              wordLength={wordLength}
              endWord={endWord}
              phase={phase}
              isStart={false}
            />
          ))}

          {phase === 'playing' && (
            <div className="word-chain-board-block">
              <div className="wordle-row" role="row">
                {Array.from({ length: wordLength }, (_, i) => {
                  const ch = buffer[i] ?? ' '
                  const filled = i < buffer.length
                  const fb = bufferPartialFb[i]
                  return (
                    <div key={i} className={tileScoredGreenOnly(fb, filled)} role="gridcell">
                      {filled ? ch : ''}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {showGoalRow && (
        <div className="word-chain-board-goal">
          <div className="word-chain-board-block word-chain-board-block--goal">
            <div className="wordle-row" role="row">
              {Array.from({ length: wordLength }, (_, i) => {
                const ch = endWord[i] ?? ' '
                return (
                  <div key={i} className={tileEndpoint(true)} role="gridcell">
                    {ch}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
