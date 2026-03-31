import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { deletePreset, readCustomPresets, upsertPreset } from '../lib/customPresets'
import { normalizePreset, type CustomGamePreset } from '../variants/customPreset'
import './MyVariantsPage.css'

function presetSummary(p: CustomGamePreset): string {
  const bits: string[] = []
  bits.push(`${p.wordLength} letters`)
  bits.push(`${p.maxGuesses} guesses`)
  if (p.ladderEnabled) bits.push('ladder')
  if (p.timeLimitSeconds != null) bits.push(`${p.timeLimitSeconds}s`)
  if (p.lockRevealedGreens) bits.push('hard')
  if (p.forbidAbsentLetters) bits.push('no grey reuse')
  if (p.allowNonDictionary) bits.push('any letters')
  return bits.join(' · ')
}

export default function MyVariantsPage() {
  const navigate = useNavigate()
  const [presets, setPresets] = useState(() => readCustomPresets())

  const refresh = useCallback(() => {
    setPresets(readCustomPresets())
  }, [])

  const onDelete = useCallback(
    (id: string) => {
      if (!window.confirm('Delete this preset?')) return
      deletePreset(id)
      refresh()
    },
    [refresh],
  )

  const onDuplicate = useCallback(
    (p: CustomGamePreset) => {
      const copy = normalizePreset({
        ...p,
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `preset-${Date.now()}`,
        name: `${p.name} (copy)`,
      })
      upsertPreset(copy)
      refresh()
      navigate(`/create/edit/${copy.id}`)
    },
    [navigate, refresh],
  )

  const sorted = useMemo(
    () => [...presets].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)),
    [presets],
  )

  return (
    <div className="my-variants-page">
      <h1 className="my-variants-page-title">My variants</h1>
      <p className="my-variants-page-lead">
        Saved custom games on this device. <Link to="/create">Create</Link> a new preset or open one below to play or
        edit.
      </p>

      <section className="my-variants-page-section" aria-labelledby="my-variants-saved">
        <div className="my-variants-page-section-head">
          <h2 id="my-variants-saved" className="my-variants-page-h2">
            Saved presets
          </h2>
          <Link to="/create" className="my-variants-page-btn my-variants-page-btn--primary my-variants-page-btn--link">
            Create new
          </Link>
        </div>
        {sorted.length === 0 ? (
          <p className="my-variants-page-empty">
            Nothing saved yet.{' '}
            <Link to="/create" className="my-variants-page-link">
              Create a custom game
            </Link>
            .
          </p>
        ) : (
          <ul className="my-variants-preset-list">
            {sorted.map((p) => (
              <li key={p.id} className="my-variants-preset-card">
                <div className="my-variants-preset-card-main">
                  <span className="my-variants-preset-name">{p.name}</span>
                  <span className="my-variants-preset-meta">{presetSummary(p)}</span>
                </div>
                <div className="my-variants-preset-actions">
                  <Link className="my-variants-page-link" to={`/play/my/${p.id}`}>
                    Play
                  </Link>
                  <Link className="my-variants-page-btn my-variants-page-btn--ghost" to={`/create/edit/${p.id}`}>
                    Edit
                  </Link>
                  <button type="button" className="my-variants-page-btn my-variants-page-btn--ghost" onClick={() => onDuplicate(p)}>
                    Duplicate
                  </button>
                  <button type="button" className="my-variants-page-btn my-variants-page-btn--danger" onClick={() => onDelete(p.id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
