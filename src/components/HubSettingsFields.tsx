import { HUB_PLAY_LENGTHS } from '../variants/hubConfig'
import { LADDER_PICK_LENGTHS } from '../variants/ladderLength'
import { DEFAULT_LADDER_END, DEFAULT_LADDER_START } from '../hub/types'
import './HubSettingsFields.css'

export type HubSettingsState = {
  wordLength: number
  ladderMode: boolean
  ladderStart: number
  ladderEnd: number
}

type HubSettingsFieldsProps = {
  value: HubSettingsState
  onChange: (next: HubSettingsState) => void
  /** When true, hide letter length row (e.g. multi ladder). */
  hideWordLength?: boolean
  idPrefix?: string
}

export function defaultHubSettings(): HubSettingsState {
  return {
    wordLength: 5,
    ladderMode: false,
    ladderStart: DEFAULT_LADDER_START,
    ladderEnd: DEFAULT_LADDER_END,
  }
}

export function HubSettingsFields({
  value,
  onChange,
  hideWordLength,
  idPrefix,
}: HubSettingsFieldsProps) {
  const set = (patch: Partial<HubSettingsState>) => onChange({ ...value, ...patch })

  const zenInfiniteLadderBlocked = idPrefix === 'zen-infinite' && value.ladderMode

  return (
    <div className="hub-settings-fields" role="group" aria-label="Shortcut settings">
      <div className="hub-settings-row hub-settings-row--toggle">
        <span className="hub-settings-label" id="hub-set-ladder">
          Ladder mode
        </span>
        <button
          type="button"
          className="hub-settings-switch"
          role="switch"
          aria-checked={value.ladderMode}
          aria-labelledby="hub-set-ladder"
          onClick={() => set({ ladderMode: !value.ladderMode })}
        >
          <span className="hub-settings-switch-track" aria-hidden>
            <span className="hub-settings-switch-thumb" />
          </span>
          <span className="hub-settings-switch-text">{value.ladderMode ? 'On' : 'Off'}</span>
        </button>
      </div>

      {!hideWordLength && !value.ladderMode && (
        <div className="hub-settings-row">
          <span className="hub-settings-label">Letters</span>
          <div className="hub-settings-picker" aria-label="Word length">
            {HUB_PLAY_LENGTHS.map((n) => (
              <button
                key={n}
                type="button"
                className={`hub-settings-btn ${value.wordLength === n ? 'hub-settings-btn--selected' : ''}`}
                aria-pressed={value.wordLength === n}
                onClick={() => set({ wordLength: n })}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {value.ladderMode && (
        <>
          <div className="hub-settings-row">
            <span className="hub-settings-label">Start</span>
            <div className="hub-settings-picker" aria-label="Ladder start">
              {LADDER_PICK_LENGTHS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`hub-settings-btn ${value.ladderStart === n ? 'hub-settings-btn--selected' : ''}`}
                  aria-pressed={value.ladderStart === n}
                  onClick={() => set({ ladderStart: n })}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className="hub-settings-row">
            <span className="hub-settings-label">End</span>
            <div className="hub-settings-picker" aria-label="Ladder end">
              {LADDER_PICK_LENGTHS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`hub-settings-btn ${value.ladderEnd === n ? 'hub-settings-btn--selected' : ''}`}
                  aria-pressed={value.ladderEnd === n}
                  onClick={() => set({ ladderEnd: n })}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {zenInfiniteLadderBlocked && (
        <p className="hub-settings-warning">
          Zen Infinite does not support ladder mode. Turn ladder off or pick another variant.
        </p>
      )}
    </div>
  )
}
