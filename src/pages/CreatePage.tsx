import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  defaultCustomPreset,
  MAX_CUSTOM_WORD_LIST_CHARS,
  parseCustomWordLines,
  validateCustomPreset,
  normalizePreset,
  type CustomGamePreset,
} from '../variants/customPreset'
import { CustomPresetPlayView } from '../components/CustomPresetPlayView'
import { VariantPlayView } from '../components/VariantPlayView'
import { useFeedback } from '../components/FeedbackProvider'
import { getPresetById, readCustomPresets, upsertPreset } from '../lib/customPresets'
import {
  browseOptionKey,
  DEFAULT_CREATE_BROWSE_ID_PREFIX,
  findBrowseEntryByOptionKey,
  getBrowseCatalog,
  playHrefFromBrowseEntry,
} from '../variants/browseCatalog'
import './MyVariantsPage.css'

function browseSearchForVariantId(variantId: string): string | null {
  // ladder-<prefix>-<len>
  if (variantId.startsWith('ladder-')) {
    const rest = variantId.slice('ladder-'.length)
    const i = rest.lastIndexOf('-')
    if (i <= 0) return null
    const prefix = rest.slice(0, i)
    return new URLSearchParams({ browseKind: 'lengthGroup', browseId: prefix }).toString()
  }
  // multi-<len>-<boards>
  if (variantId.startsWith('multi-')) {
    const parts = variantId.split('-')
    const boards = parts.at(-1)
    if (!boards) return null
    return new URLSearchParams({ browseKind: 'multiGrid', browseBoards: boards }).toString()
  }
  // <prefix>-<len>
  const j = variantId.lastIndexOf('-')
  if (j <= 0) return null
  const prefix = variantId.slice(0, j)
  return new URLSearchParams({ browseKind: 'lengthGroup', browseId: prefix }).toString()
}

export default function CreatePage() {
  const { notify } = useFeedback()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { presetId } = useParams<{ presetId: string }>()
  const isEditMode = presetId != null

  const [draft, setDraft] = useState<CustomGamePreset>(() => defaultCustomPreset())
  const [customWordsText, setCustomWordsText] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [testPreset, setTestPreset] = useState<CustomGamePreset | null>(null)
  const [testVariantId, setTestVariantId] = useState<string | null>(null)
  const [testKey, setTestKey] = useState(0)
  const [testMinimized, setTestMinimized] = useState(false)
  const [savePrompt, setSavePrompt] = useState<{
    mode: 'edit' | 'create'
    next: CustomGamePreset
    duplicateId?: string
    rename: string
  } | null>(null)

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

  const selectedPlayHref = useMemo(() => {
    if (browseKeyFromUrl) {
      const e = findBrowseEntryByOptionKey(browseKeyFromUrl)
      return e ? playHrefFromBrowseEntry(e) : null
    }
    return null
  }, [browseKeyFromUrl])

  const selectedVariantId = useMemo(() => {
    if (!browseKeyFromUrl) return null
    const entry = findBrowseEntryByOptionKey(browseKeyFromUrl)
    if (!entry) return null
    if (entry.kind === 'multiGrid') {
      return `multi-${draft.wordLength}-${entry.boardCount}`
    }
    const base = entry.idPrefix
    if (base === 'classic') return null
    return draft.ladderEnabled ? `ladder-${base}-${draft.wordLength}` : `${base}-${draft.wordLength}`
  }, [browseKeyFromUrl, draft.ladderEnabled, draft.wordLength])

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

    // Keep the variant selector as a pure “variant picker”.
    // When editing a saved preset that maps to a built-in variant, sync the URL to that Browse entry
    // so the selector shows the correct variant title (and doesn't switch to "custom:*").
    const sp =
      p.playVariantId != null ? browseSearchForVariantId(p.playVariantId) : null
    if (sp) {
      navigate({ pathname: location.pathname, search: sp }, { replace: true })
    } else if (searchParams.toString() === '') {
      navigate({ pathname: location.pathname, search: defaultBrowseSearch }, { replace: true })
    }
  }, [isEditMode, presetId])

  if (isEditMode && presetId && !getPresetById(presetId)) {
    return <Navigate to="/my-variants" replace />
  }

  const onSave = useCallback(() => {
    const words = parseCustomWordLines(customWordsText)
    const next = normalizePreset({ ...draft, customWords: words, playVariantId: selectedVariantId ?? undefined })
    const v = validateCustomPreset(next)
    if (!v.ok) {
      setFormError(v.message)
      return
    }
    const nameKey = next.name.trim().toLowerCase()
    const dup = readCustomPresets().find((p) => p.id !== next.id && p.name.trim().toLowerCase() === nameKey)
    if (dup) {
      setSavePrompt({
        mode: isEditMode ? 'edit' : 'create',
        next,
        duplicateId: dup.id,
        rename: `${next.name} (copy)`,
      })
      return
    }

    upsertPreset(next)
    setFormError(null)
    notify(`Saved “${next.name}”.`)
    // Stay on current variant selection.
  }, [customWordsText, draft, isEditMode, notify, selectedVariantId])

  const onConfirmOverwrite = useCallback(() => {
    if (!savePrompt) return
    const { next, duplicateId } = savePrompt
    if (!duplicateId) return
    // Enforce unique names: overwrite the existing preset with this name.
    upsertPreset({ ...next, id: duplicateId })
    setSavePrompt(null)
    setFormError(null)
    notify(`Saved “${next.name}”.`)
  }, [notify, savePrompt])

  const onConfirmSaveNew = useCallback(() => {
    if (!savePrompt) return
    const renamed = normalizePreset({ ...savePrompt.next, name: savePrompt.rename })
    const nameKey = renamed.name.trim().toLowerCase()
    const stillDup = readCustomPresets().some((p) => p.name.trim().toLowerCase() === nameKey)
    if (stillDup) {
      setFormError('That name is already used. Please choose a different name.')
      return
    }
    const v = validateCustomPreset(renamed)
    if (!v.ok) {
      setFormError(v.message)
      return
    }
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `preset-${Date.now()}`
    upsertPreset({ ...renamed, id: newId })
    setSavePrompt(null)
    setFormError(null)
    notify(`Saved “${renamed.name}”.`)
    // When saving new from edit mode, switch to editing the new copy.
    if (isEditMode) {
      navigate({ pathname: `/create/edit/${newId}`, search: location.search }, { replace: true })
    }
  }, [isEditMode, location.search, navigate, notify, savePrompt])

  useEffect(() => {
    // Always-on preview: when the selected variant changes, remount the preview.
    if (selectedVariantId) {
      setTestPreset(null)
      setTestVariantId(selectedVariantId)
      setTestKey((k) => k + 1)
      return
    }
    // Classic/custom preview: validate + normalize, then update after short idle
    // so typing in the form doesn't restart the preview every keystroke.
    const t = window.setTimeout(() => {
      const words = parseCustomWordLines(customWordsText)
      const next = normalizePreset({ ...draft, customWords: words })
      const v = validateCustomPreset(next)
      if (!v.ok) return
      setTestVariantId(null)
      setTestPreset(next)
      setTestKey((k) => k + 1)
    }, 350)
    return () => window.clearTimeout(t)
  }, [customWordsText, draft, selectedVariantId])

  const pageTitle = isEditMode ? 'Edit custom game' : 'Create custom game'

  const defaultBrowseKey = `browse:lg:${DEFAULT_CREATE_BROWSE_ID_PREFIX}`

  const workingAsValue = useMemo(() => {
    if (browseKeyFromUrl) return browseKeyFromUrl
    return defaultBrowseKey
  }, [browseKeyFromUrl, defaultBrowseKey])

  const onWorkingPresetChange = useCallback(
    (value: string) => {
      if (value.startsWith('browse:lg:')) {
        const idPrefix = value.slice('browse:lg:'.length)
        navigate(
          {
            pathname: location.pathname,
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
            pathname: location.pathname,
            search: new URLSearchParams({ browseKind: 'multiGrid', browseBoards: n }).toString(),
          },
          { replace: true },
        )
        return
      }
    },
    [location.pathname, navigate],
  )

  return (
    <div className={`my-variants-page create-page${testMinimized ? ' create-page--no-preview' : ''}`}>
      <header className="create-page-header">
        <h1 className="my-variants-page-title">{pageTitle}</h1>
        <p className="my-variants-page-lead">
          Tune rules and word lists, then save. Your games are stored under{' '}
          <Link to="/my-variants">My variants</Link>.
        </p>
      </header>

      <section className="my-variants-page-section my-variants-page-form-section" aria-labelledby="create-editor">
        <h2 id="create-editor" className="my-variants-page-h2">
          Rules &amp; words
        </h2>

        <button
          type="button"
          className="create-page-test-toggle create-page-test-toggle--card"
          onClick={() => setTestMinimized((m) => !m)}
          aria-label={testMinimized ? 'Show preview' : 'Hide preview'}
          title={testMinimized ? 'Show preview' : 'Hide preview'}
        >
          {testMinimized ? '▣' : '—'}
        </button>

        {formError && <p className="my-variants-page-error">{formError}</p>}

        <div className="create-page-workspace">
          <div className="create-page-workspace__form">
        <div className="create-form-layout">
          <div className="create-page-preset-block" aria-labelledby="create-working-preset">
            <h3 id="create-working-preset" className="my-variants-page-h2">
              Preset
            </h3>
            <p className="create-page-template-hint">
              Pick a variant (game mode). The settings below adjust how that mode plays.
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
          </div>

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
          <Link className="my-variants-page-btn my-variants-page-btn--ghost" to="/my-variants">
            Back to saved list
          </Link>
        </div>
        {savePrompt && (
          <div className="create-save-prompt" role="group" aria-label="Save options">
            <p className="create-save-prompt-text">
              {savePrompt.mode === 'edit'
                ? 'Save options for this edited game:'
                : `A game named "${savePrompt.next.name}" already exists.`}
            </p>
            <label className="my-variants-field create-save-prompt-rename">
              <span>Name for new copy</span>
              <input
                type="text"
                value={savePrompt.rename}
                onChange={(e) => setSavePrompt((s) => (s ? { ...s, rename: e.target.value } : s))}
                autoComplete="off"
              />
            </label>
            <div className="my-variants-form-actions create-save-prompt-actions">
              <button type="button" className="my-variants-page-btn my-variants-page-btn--primary" onClick={onConfirmOverwrite}>
                Overwrite
              </button>
              <button type="button" className="my-variants-page-btn my-variants-page-btn--secondary" onClick={onConfirmSaveNew}>
                Save new
              </button>
              <button type="button" className="my-variants-page-btn my-variants-page-btn--ghost" onClick={() => setSavePrompt(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}
          </div>

          {!testMinimized && (
            <aside className="create-page-workspace__test" aria-label="Test play">
              {testVariantId ? (
              <VariantPlayView key={`create-test-${testKey}`} variantId={testVariantId} />
            ) : testPreset ? (
              <CustomPresetPlayView key={`create-test-${testKey}`} preset={testPreset} variant="embedded" />
            ) : (
              <div className="create-page-test-placeholder">
                <p className="create-page-test-placeholder-title">Preview</p>
                <p className="create-page-test-placeholder-text">Adjust settings to load the preview.</p>
              </div>
              )}
            </aside>
          )}
        </div>
      </section>
    </div>
  )
}
