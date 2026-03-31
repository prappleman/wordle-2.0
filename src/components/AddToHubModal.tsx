import { useEffect, useState } from 'react'
import {
  HubSettingsFields,
  defaultHubSettings,
  type HubSettingsState,
} from './HubSettingsFields'
import { isWordLengthAllowedForPrefix } from '../hub/wordLengthRules'
import './AddToHubModal.css'

type AddToHubModalProps = {
  open: boolean
  heading?: string
  confirmLabel?: string
  title: string
  description: string
  idPrefix: string
  kind: 'lengthGroup' | 'multiGrid'
  boardCount?: number
  initial?: HubSettingsState
  onClose: () => void
  onConfirm: (settings: HubSettingsState) => void
}

export function AddToHubModal({
  open,
  heading = 'Add to My hub',
  confirmLabel = 'Add shortcut',
  title,
  description,
  idPrefix,
  kind,
  boardCount = 4,
  initial,
  onClose,
  onConfirm,
}: AddToHubModalProps) {
  const [settings, setSettings] = useState<HubSettingsState>(initial ?? defaultHubSettings())

  useEffect(() => {
    if (open) setSettings(initial ?? defaultHubSettings())
  }, [open, initial])

  if (!open) return null

  const hideWordLength = kind === 'multiGrid' && settings.ladderMode
  const zenBlock = idPrefix === 'zen-infinite' && settings.ladderMode
  const lengthOk = isWordLengthAllowedForPrefix(idPrefix, settings.wordLength)

  const canConfirm = !zenBlock && lengthOk

  return (
    <div className="add-hub-modal-root" role="presentation">
      <button
        type="button"
        className="add-hub-modal-backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className="add-hub-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-hub-modal-title"
      >
        <h2 id="add-hub-modal-title" className="add-hub-modal-title">
          {heading}
        </h2>
        <p className="add-hub-modal-sub">{title}</p>
        <p className="add-hub-modal-desc">{description}</p>
        {kind === 'multiGrid' && (
          <p className="add-hub-modal-meta">
            Multi boards: <strong>{boardCount}</strong>
          </p>
        )}
        <HubSettingsFields
          value={settings}
          onChange={setSettings}
          hideWordLength={hideWordLength}
          idPrefix={idPrefix}
        />
        {!lengthOk && (
          <p className="add-hub-modal-err">Doubles requires at least 2 letters.</p>
        )}
        <div className="add-hub-modal-actions">
          <button type="button" className="add-hub-modal-btn add-hub-modal-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="add-hub-modal-btn add-hub-modal-btn--primary"
            disabled={!canConfirm}
            onClick={() => {
              if (!canConfirm) return
              onConfirm(settings)
              onClose()
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
