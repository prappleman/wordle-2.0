import { Link } from 'react-router-dom'
import type { HubPin } from '../hub/types'
import { playHrefFromPin } from '../hub/resolvePlayTarget'
import { getHubModeTheme } from './hubModeThemes'
import { HubModeTiles } from './HubModeTiles'
import './hubModeCardThemes.css'
import './PinCard.css'

function pinChips(pin: HubPin): string[] {
  if (pin.kind === 'multiGrid') {
    const chips: string[] = [`${pin.boardCount} boards`]
    if (pin.ladderMode) chips.push(`Ladder ${pin.ladderStart}–${pin.ladderEnd}`)
    else chips.push(`${pin.wordLength} letters`)
    return chips
  }
  if (pin.ladderMode) return [`Ladder ${pin.ladderStart}–${pin.ladderEnd}`]
  return [`${pin.wordLength} letters`]
}

type PinCardProps = {
  pin: HubPin
  onEdit: () => void
  onRemove: () => void
}

export function PinCard({ pin, onEdit, onRemove }: PinCardProps) {
  const to = playHrefFromPin(pin)
  const chips = pinChips(pin)
  const modeKey = pin.kind === 'lengthGroup' ? pin.idPrefix : 'multi'
  const theme = getHubModeTheme(modeKey)

  return (
    <article className={`pin-card hub-mode-card hub-mode-card--accent-${theme.accent}`}>
      <div className="hub-mode-card__shine" aria-hidden />
      <div className="hub-mode-card__inner pin-card__inner">
        <HubModeTiles preset={theme.tilePreset} compact />
        <div className="pin-card-main">
          <h3 className="pin-card-title">{pin.title}</h3>
          <p className="pin-card-desc">{pin.description}</p>
          <ul className="pin-card-chips">
            {chips.map((c) => (
              <li key={c} className="pin-card-chip">
                {c}
              </li>
            ))}
          </ul>
          <div className="pin-card-actions">
            <Link to={to} className="pin-card-play">
              Play
            </Link>
            <button type="button" className="pin-card-secondary" onClick={onEdit}>
              Edit
            </button>
            <button type="button" className="pin-card-secondary pin-card-remove" onClick={onRemove}>
              Remove
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
