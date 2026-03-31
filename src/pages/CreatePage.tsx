import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { playHrefFromPin } from '../hub/resolvePlayTarget'
import { readHubPins } from '../hub/readHubPins'
import {
  defaultCustomPreset,
  MAX_CUSTOM_WORD_LIST_CHARS,
  parseCustomWordLines,
  validateCustomPreset,
  normalizePreset,
  type CustomGamePreset,
} from '../variants/customPreset'
import { getPresetById, readCustomPresets, upsertPreset } from '../lib/customPresets'
import {
  browseOptionKey,
  DEFAULT_CREATE_BROWSE_ID_PREFIX,
  findBrowseEntryByOptionKey,
  getBrowseCatalog,
  playHrefFromBrowseEntry,
} from '../variants/browseCatalog'
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

export default function CreatePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { presetId } = useParams<{ presetId: string }>()
  const isEditMode = presetId != null

  const [draft, setDraft] = useState<CustomGamePreset>(() => defaultCustomPreset())
  const [customWordsText, setCustomWordsText] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [savedListTick, setSavedListTick] = useState(0)

  const sortedSaved = useMemo(
    () => [...readCustomPresets()].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
    [savedListTick, location.key, location.pathname],
  )

  const sortedHubPins = useMemo(
    () => [...readHubPins()].sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })),
    [savedListTick, location.key, location.pathname],
  )

  const browseCatalog = useMemo(() => getBrowseCatalog(), [])

  const browseKeyFromUrl = useMemo(() => {
    const k = searchParams.get('browseKind')
    if (k === 'lengthGroup') {
      const id = searchParams.get('browseId')
      if (id) return `browse:lg:${id}`
    }
    if (k === 'multiGrid') {
      const b = searchParams.get('browseBoards')
      if (b != null && b !== '') return `browse:multi:${b}`
    }
    return null
  }, [searchParams])

  const hubKeyFromUrl = useMemo(() => {
    const id = searchParams.get('hubPin')
    return id ? `hub:${id}` : null
  }, [searchParams])

  const selectedPlayHref = useMemo(() => {
    if (browseKeyFromUrl) {
      const e = findBrowseEntryByOptionKey(browseKeyFromUrl)
      return e ? playHrefFromBrowseEntry(e) : null
    }
    if (hubKeyFromUrl) {
      const pin = readHubPins().find((p) => p.id === hubKeyFromUrl.slice(4))
      return pin ? playHrefFromPin(pin) : null
    }
    return null
  }, [browseKeyFromUrl, hubKeyFromUrl, savedListTick, location.key, location.pathname])

  const defaultBrowseSearch = useMemo(
    () =>
      new URLSearchParams({
        browseKind: 'lengthGroup',
        browseId: DEFAULT_CREATE_BROWSE_ID_PREFIX,
      }).toString(),
    [],
  )

  /** Create always starts from Classic (Browse) unless a hub pin or saved preset is in the URL. */
  useEffect(() => {
    if (isEditMode) return
    if (searchParams.toString() !== '') return
    navigate({ pathname: '/create', search: defaultBrowseSearch }, { replace: true })
  }, [isEditMode, searchParams, navigate, defaultBrowseSearch])

  useEffect(() => {
    if (!isEditMode) {
      const n = defaultCustomPreset()
      setDraft(n)
      setCustomWordsText('')
      setFormError(null)
      return
    }
    const p = getPresetById(presetId!)
    if (!p) return
    setDraft({ ...p })
    setCustomWordsText(p.customWords.join('\n'))
    setFormError(null)
  }, [isEditMode, presetId])

  if (isEditMode && presetId && !getPresetById(presetId)) {
    return <Navigate to="/my-variants" replace />
  }

  const onSave = useCallback(() => {
    const words = parseCustomWordLines(customWordsText)
    const next = normalizePreset({ ...draft, customWords: words })
    const v = validateCustomPreset(next)
    if (!v.ok) {
      setFormError(v.message)
      return
    }
    upsertPreset(next)
    setFormError(null)
    setSavedListTick((t) => t + 1)
    if (!isEditMode) {
      navigate({ pathname: `/create/edit/${next.id}`, search: '' }, { replace: true })
    }
  }, [customWordsText, draft, isEditMode, navigate])

  const pageTitle = isEditMode ? 'Edit custom game' : 'Create custom game'

  const defaultBrowseKey = `browse:lg:${DEFAULT_CREATE_BROWSE_ID_PREFIX}`

  const workingAsValue = useMemo(() => {
    if (isEditMode && presetId) return `custom:${presetId}`
    if (hubKeyFromUrl) return hubKeyFromUrl
    if (browseKeyFromUrl) return browseKeyFromUrl
    return defaultBrowseKey
  }, [isEditMode, presetId, hubKeyFromUrl, browseKeyFromUrl, defaultBrowseKey])

  const onWorkingPresetChange = useCallback(
    (value: string) => {
      if (value.startsWith('hub:')) {
        const id = value.slice(4)
        navigate(
          {
            pathname: '/create',
            search: new URLSearchParams({ hubPin: id }).toString(),
          },
          { replace: true },
        )
        return
      }
      if (value.startsWith('browse:lg:')) {
        const idPrefix = value.slice('browse:lg:'.length)
        navigate(
          {
            pathname: '/create',
            search: new URLSearchParams({ browseKind: 'lengthGroup', browseId: idPrefix }).toString(),
          },
          { replace: true },
        )
        return
      }
      if (value.startsWith('browse:multi:')) {
        const n = value.slice('browse:multi:'.length)
        navigate(
          {
            pathname: '/create',
            search: new URLSearchParams({ browseKind: 'multiGrid', browseBoards: n }).toString(),
          },
          { replace: true },
        )
        return
      }
      if (value.startsWith('custom:')) {
        navigate({ pathname: `/create/edit/${value.slice(7)}`, search: '' }, { replace: true })
      }
    },
    [isEditMode, navigate],
  )

  return (
    <div className="my-variants-page create-page">
      <header className="create-page-header">
        <h1 className="my-variants-page-title">{pageTitle}</h1>
        <p className="my-variants-page-lead">
          Tune rules and word lists, then save. Your games are stored under{' '}
          <Link to="/my-variants">My variants</Link>.
        </p>
      </header>

      <section className="my-variants-page-section" aria-labelledby="create-working-preset">
        <h2 id="create-working-preset" className="my-variants-page-h2">
          Preset
        </h2>
        <p className="create-page-template-hint">
          Defaults to <strong>Classic</strong> (standard Wordle). Pick any <strong>Browse</strong> mode, a saved{' '}
          <strong>custom game</strong>, or a <strong>hub shortcut</strong>. Use the link below to play the selected browse
          or hub entry (default 5 letters, ladder off).
        </p>
        <label className="my-variants-field create-page-template-select">
          <span>Which variant</span>
          <select value={workingAsValue} onChange={(e) => onWorkingPresetChange(e.target.value)}>
            <optgroup label="Browse (all hub modes)">
              {browseCatalog.map((entry) => (
                <option key={browseOptionKey(entry)} value={browseOptionKey(entry)}>
                  {entry.title}
                </option>
              ))}
            </optgroup>
            {sortedSaved.length > 0 && (
              <optgroup label="My custom games (saved)">
                {sortedSaved.map((p) => (
                  <option key={p.id} value={`custom:${p.id}`}>
                    {p.name} — {presetSummary(p)}
                  </option>
                ))}
              </optgroup>
            )}
            {sortedHubPins.length > 0 && (
              <optgroup label="Hub shortcuts (from My hub)">
                {sortedHubPins.map((pin) => (
                  <option key={pin.id} value={`hub:${pin.id}`}>
                    {pin.title}
                    {pin.kind === 'lengthGroup' ? ` · ${pin.wordLength} letters` : ` · ${pin.boardCount} boards`}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </label>
        {selectedPlayHref && (
          <p className="create-page-play-hint">
            <Link className="my-variants-page-link" to={selectedPlayHref}>
              Play this variant
            </Link>{' '}
            — same default as Browse quick add (5 letters, ladder off). Change length and ladder from My hub after
            adding a pin.
          </p>
        )}
        {sortedSaved.length === 0 && (
          <p className="my-variants-page-empty create-page-empty-saved">
            No custom presets saved yet — fill in the form below and save to My variants when ready.
          </p>
        )}
      </section>

      <section className="my-variants-page-section my-variants-page-form-section" aria-labelledby="create-editor">
        <h2 id="create-editor" className="my-variants-page-h2">
          Rules &amp; words
        </h2>

        {formError && <p className="my-variants-page-error">{formError}</p>}

        <div className="create-form-layout">
          <label className="my-variants-field create-form-field-name">
            <span>Name</span>
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              autoComplete="off"
            />
          </label>

          <fieldset className="my-variants-fieldset create-form-fieldset create-form-fieldset--words">
            <legend>Words &amp; source</legend>
            <div className="create-form-words-top">
              <div className="create-form-word-source" role="group" aria-label="Word source">
                <span className="create-form-inline-label">Source</span>
                <label className="my-variants-radio">
                  <input
                    type="radio"
                    name="wordSource"
                    checked={draft.wordSource === 'dictionary'}
                    onChange={() => setDraft((d) => ({ ...d, wordSource: 'dictionary' }))}
                  />
                  Dictionary (by length)
                </label>
                <label className="my-variants-radio">
                  <input
                    type="radio"
                    name="wordSource"
                    checked={draft.wordSource === 'custom'}
                    onChange={() => setDraft((d) => ({ ...d, wordSource: 'custom' }))}
                  />
                  Custom list
                </label>
              </div>
              <label className="my-variants-field">
                <span>Word length</span>
                <input
                  type="number"
                  min={2}
                  max={12}
                  value={draft.wordLength}
                  disabled={draft.wordSource === 'custom'}
                  onChange={(e) => setDraft((d) => ({ ...d, wordLength: Number(e.target.value) }))}
                />
                {draft.wordSource === 'custom' ? (
                  <span className="my-variants-field-hint">
                    Locked while using a custom list — lengths come from your words (include each length you need).
                  </span>
                ) : (
                  <span className="my-variants-field-hint">Answer length for each round when not using a ladder.</span>
                )}
              </label>
            </div>

            <div className="create-form-ladder-block">
              <label className="my-variants-check create-form-ladder-toggle">
                <input
                  type="checkbox"
                  checked={draft.ladderEnabled}
                  onChange={(e) => setDraft((d) => ({ ...d, ladderEnabled: e.target.checked }))}
                />
                Ladder — increase word length each round (within range)
              </label>
              {draft.ladderEnabled && (
                <div className="my-variants-ladder-row">
                  <label className="my-variants-field">
                    <span>From length</span>
                    <input
                      type="number"
                      min={2}
                      max={12}
                      value={draft.ladderLo}
                      onChange={(e) => setDraft((d) => ({ ...d, ladderLo: Number(e.target.value) }))}
                    />
                  </label>
                  <label className="my-variants-field">
                    <span>To length</span>
                    <input
                      type="number"
                      min={2}
                      max={12}
                      value={draft.ladderHi}
                      onChange={(e) => setDraft((d) => ({ ...d, ladderHi: Number(e.target.value) }))}
                    />
                  </label>
                  <label className="my-variants-field">
                    <span>After last rung</span>
                    <select
                      value={draft.ladderMode}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, ladderMode: e.target.value as CustomGamePreset['ladderMode'] }))
                      }
                    >
                      <option value="stop">Stop (session ends)</option>
                      <option value="wrap">Wrap to first length</option>
                    </select>
                  </label>
                </div>
              )}
            </div>
          </fieldset>

          {draft.wordSource === 'custom' && (
            <fieldset className="my-variants-fieldset create-form-fieldset create-form-fieldset--custom">
              <legend>Custom word list</legend>
              <fieldset className="my-variants-fieldset create-form-fieldset-inner">
                <legend>Order</legend>
                <label className="my-variants-radio">
                  <input
                    type="radio"
                    name="customWordOrder"
                    checked={draft.customWordOrder === 'random'}
                    onChange={() => setDraft((d) => ({ ...d, customWordOrder: 'random' }))}
                  />
                  Random each round
                </label>
                <label className="my-variants-radio">
                  <input
                    type="radio"
                    name="customWordOrder"
                    checked={draft.customWordOrder === 'sequential'}
                    onChange={() => setDraft((d) => ({ ...d, customWordOrder: 'sequential' }))}
                  />
                  Sequential (quiz order)
                </label>
              </fieldset>
              <label className="my-variants-field my-variants-field--full">
                <span>Words (one per line, 2–12 letters each)</span>
                <textarea
                  value={customWordsText}
                  onChange={(e) => setCustomWordsText(e.target.value.slice(0, MAX_CUSTOM_WORD_LIST_CHARS))}
                  rows={8}
                  spellCheck={false}
                  className="my-variants-textarea"
                />
              </label>
            </fieldset>
          )}

          <fieldset className="my-variants-fieldset create-form-fieldset create-form-fieldset--session">
            <legend>Session</legend>
            <div className="create-form-pair">
              <label className="my-variants-field">
                <span>Max guesses</span>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={draft.maxGuesses}
                  onChange={(e) => setDraft((d) => ({ ...d, maxGuesses: Number(e.target.value) }))}
                />
              </label>
              <label className="my-variants-field">
                <span>Session rounds</span>
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={draft.maxSessionRounds}
                  onChange={(e) => setDraft((d) => ({ ...d, maxSessionRounds: Number(e.target.value) }))}
                />
                <span className="my-variants-field-hint">Per session without ladder, or cap with ladder.</span>
              </label>
            </div>
          </fieldset>

          <fieldset className="my-variants-fieldset create-form-fieldset create-form-fieldset--time">
            <legend>Time</legend>
            <label className="my-variants-field create-form-time-field">
              <span>Time limit (seconds)</span>
              <input
                type="number"
                min={5}
                max={3600}
                placeholder="Off"
                value={draft.timeLimitSeconds ?? ''}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === '') setDraft((d) => ({ ...d, timeLimitSeconds: null }))
                  else setDraft((d) => ({ ...d, timeLimitSeconds: Number(v) }))
                }}
              />
              <span className="my-variants-field-hint">Empty = no timer. Applies per round.</span>
            </label>
          </fieldset>

          <fieldset className="my-variants-fieldset create-form-fieldset create-form-fieldset--restrictions">
            <legend>Restrictions</legend>
            <div className="create-form-restrictions">
              <label className="my-variants-check">
                <input
                  type="checkbox"
                  checked={!draft.allowNonDictionary}
                  onChange={(e) => setDraft((d) => ({ ...d, allowNonDictionary: !e.target.checked }))}
                />
                Use real words only (dictionary guesses)
              </label>
              <label className="my-variants-check">
                <input
                  type="checkbox"
                  checked={draft.lockRevealedGreens}
                  onChange={(e) => setDraft((d) => ({ ...d, lockRevealedGreens: e.target.checked }))}
                />
                Hard mode (keep revealed greens in place)
              </label>
              <label className="my-variants-check">
                <input
                  type="checkbox"
                  checked={draft.forbidAbsentLetters}
                  onChange={(e) => setDraft((d) => ({ ...d, forbidAbsentLetters: e.target.checked }))}
                />
                Forbid reusing absent (grey) letters
              </label>
            </div>
          </fieldset>
        </div>

        <div className="my-variants-form-actions">
          <button type="button" className="my-variants-page-btn my-variants-page-btn--primary" onClick={onSave}>
            Save to My variants
          </button>
          <Link className="my-variants-page-btn my-variants-page-btn--secondary" to={`/play/my/${draft.id}`}>
            Play this preset
          </Link>
          <Link className="my-variants-page-btn my-variants-page-btn--ghost" to="/my-variants">
            Back to saved list
          </Link>
        </div>
      </section>
    </div>
  )
}
