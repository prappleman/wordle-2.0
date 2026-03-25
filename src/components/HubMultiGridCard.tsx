import { Link } from 'react-router-dom'
import { MULTI_BOARD_COUNTS, multiMaxGuesses } from '../variants/multiVariant'
import './HubLengthGroupCard.css'
import './HubMultiGridCard.css'

export function HubMultiGridCard({
  selectedLength,
  ladderMode,
}: {
  selectedLength: number
  ladderMode: boolean
}) {
  return (
    <div className="hub-multi-cards" role="group" aria-label="Multi word counts">
      {MULTI_BOARD_COUNTS.map((boardCount) => {
        const maxG = multiMaxGuesses(boardCount)
        const to = ladderMode ? `/play/ladder-multi-${boardCount}` : `/play/multi-${selectedLength}-${boardCount}`
        return (
          <Link key={boardCount} to={to} className="hub-multi-card hub-multi-card--link">
            <div className="hub-multi-card-main">
              <h2 className="hub-multi-card-title">Multi {boardCount}</h2>
              <p className="hub-multi-card-desc">
                Several hidden words at once. Each guess fills every unsolved grid. Solve up to{' '}
                <strong>{maxG}</strong> times before losing.
              </p>
              <ul className="hub-multi-card-tags">
                <li className="hub-multi-card-tag">{ladderMode ? 'ladder' : `${selectedLength}-letter`}</li>
                <li className="hub-multi-card-tag">{boardCount} words</li>
                <li className="hub-multi-card-tag">{maxG} guesses</li>
              </ul>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
