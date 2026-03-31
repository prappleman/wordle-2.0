import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import './MyHubPage.css'
import { AddToHubModal } from '../components/AddToHubModal'
import { PinCard } from '../components/PinCard'
import type { HubSettingsState } from '../components/HubSettingsFields'
import type { HubPin } from '../hub/types'
import { useHubPins } from '../hub/useHubPins'

function pinToSettings(pin: HubPin): HubSettingsState {
  return {
    wordLength: pin.wordLength,
    ladderMode: pin.ladderMode,
    ladderStart: pin.ladderStart,
    ladderEnd: pin.ladderEnd,
  }
}

function applySettings(pin: HubPin, s: HubSettingsState): HubPin {
  const base = {
    wordLength: s.wordLength,
    ladderMode: s.ladderMode,
    ladderStart: s.ladderStart,
    ladderEnd: s.ladderEnd,
  }
  if (pin.kind === 'lengthGroup') {
    return { ...pin, ...base }
  }
  return { ...pin, ...base }
}

export default function MyHubPage() {
  const { pins, updatePin, removePin } = useHubPins()
  const [editPin, setEditPin] = useState<HubPin | null>(null)

  const editModalOpen = editPin !== null

  const editModalProps = useMemo(() => {
    if (!editPin) return null
    if (editPin.kind === 'lengthGroup') {
      return {
        title: editPin.title,
        description: editPin.description,
        idPrefix: editPin.idPrefix,
        kind: 'lengthGroup' as const,
        boardCount: undefined,
      }
    }
    return {
      title: editPin.title,
      description: editPin.description,
      idPrefix: 'multi',
      kind: 'multiGrid' as const,
      boardCount: editPin.boardCount,
    }
  }, [editPin])

  return (
    <div className="my-hub-page">
      <header className="my-hub-page-header">
        <h1 className="my-hub-page-title">My hub</h1>
        <p className="my-hub-page-lead">
          Your shortcuts with saved letter counts and ladder options.{' '}
          <Link to="/browse">Browse variants</Link> to add more.
        </p>
      </header>

      {pins.length === 0 ? (
        <div className="my-hub-page-empty">
          <p className="my-hub-page-empty-text">No shortcuts yet.</p>
          <Link to="/browse" className="my-hub-page-empty-cta">
            Browse variants
          </Link>
        </div>
      ) : (
        <ul className="my-hub-page-list">
          {pins.map((pin) => (
            <li key={pin.id}>
              <PinCard
                pin={pin}
                onEdit={() => setEditPin(pin)}
                onRemove={() => removePin(pin.id)}
              />
            </li>
          ))}
        </ul>
      )}

      {editModalOpen && editModalProps && editPin && (
        <AddToHubModal
          open
          title={editModalProps.title}
          description={editModalProps.description}
          idPrefix={editModalProps.idPrefix}
          kind={editModalProps.kind}
          boardCount={editModalProps.boardCount}
          initial={pinToSettings(editPin)}
          onClose={() => setEditPin(null)}
          heading="Edit shortcut"
          confirmLabel="Save changes"
          onConfirm={(settings) => {
            updatePin(editPin.id, applySettings(editPin, settings))
          }}
        />
      )}
    </div>
  )
}
