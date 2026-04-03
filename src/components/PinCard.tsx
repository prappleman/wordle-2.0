import { Link, useNavigate } from 'react-router-dom'
import { useFeedback } from './FeedbackProvider'
import type { HubPin } from '../hub/types'
import { playHrefFromPin } from '../hub/resolvePlayTarget'
import { hubPinNeedsBrowseSessionPlay, hubPinToBrowseSessionPreset } from '../variants/browseGameMerge'
import { validateCustomPreset } from '../variants/customPreset'
import { BROWSE_SESSION_PRESET_KEY } from '../play/browseSessionStorage'
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
  const navigate = useNavigate()
  const { notify } = useFeedback()
  const to = playHrefFromPin(pin)
  const sessionPlay = hubPinNeedsBrowseSessionPlay(pin)
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
            {sessionPlay ? (
              <button
                type="button"
                className="pin-card-play"
                onClick={() => {
                  const preset = hubPinToBrowseSessionPreset(pin)
                  if (!preset) return
                  const v = validateCustomPreset(preset)
                  if (!v.ok) {
                    notify(v.message)
                    return
                  }
                  try {
                    sessionStorage.setItem(BROWSE_SESSION_PRESET_KEY, JSON.stringify(preset))
                  } catch {
                    notify('Could not start session (storage blocked).')
                    return
                  }
                  navigate('/play/browse-session')
                }}
              >
                Play
              </button>
            ) : (
              <Link to={to} className="pin-card-play">
                Play
              </Link>
            )}
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
