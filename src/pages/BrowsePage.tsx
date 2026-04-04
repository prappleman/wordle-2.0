import { useNavigate } from 'react-router-dom'
import { BrowseCard } from '../components/BrowseCard'
import { useFeedback } from '../components/FeedbackProvider'
import { useHubPins } from '../hub/useHubPins'
import type { HubPin, HubPinGameExtras, HubPinLengthGroup, HubPinMultiGrid } from '../hub/types'
import { getHubModeTheme, hubAccentForBrowseCategory } from '../components/hubModeThemes'
import {
  BROWSE_PAGE_SECTIONS,
  mergedBrowseGameForEntry,
  type BrowsePageEntry,
} from '../data/browseGames'
import type { HubSettingsState } from '../components/HubSettingsFields'
import { playHrefFromMergedBrowse, type BrowseCatalogEntry } from '../variants/browseCatalog'
import {
  browseGameNeedsCustomSessionPlay,
  mergedBrowseGameToCustomPreset,
  mergedBrowseGameToHubSettings,
  mergedBrowseGameToPinExtras,
} from '../variants/browseGameMerge'
import { buildCreateSearchFromMerged } from '../variants/browseCreateHydrate'
import { validateCustomPreset } from '../variants/customPreset'
import {
  appendPlayBackBrowseToPlayHref,
  browseSessionPlaySearch,
} from '../play/playBackNavigation'
import { BROWSE_SESSION_PRESET_KEY, CREATE_BROWSE_WORDS_KEY } from '../play/browseSessionStorage'
import './BrowsePage.css'

type ModalOpen =
  | {
      kind: 'lengthGroup'
      idPrefix: string
      title: string
      description: string
      tags?: string[]
    }
  | {
      kind: 'multiGrid'
      boardCount: number
      title: string
      description: string
    }

function sectionHeadingId(category: string): string {
  return `browse-${category.replace(/\s+/g, '-').toLowerCase()}`
}

function toCatalogEntry(entry: BrowsePageEntry): BrowseCatalogEntry {
  if (entry.kind === 'multiGrid') {
    return {
      kind: 'multiGrid',
      boardCount: entry.boardCount,
      title: entry.title,
      description: entry.description,
    }
  }
  return {
    kind: 'lengthGroup',
    idPrefix: entry.idPrefix,
    title: entry.title,
    description: entry.description,
    tags: entry.tags,
  }
}

function pinFromSettings(
  modal: ModalOpen,
  settings: HubSettingsState,
  gameExtras?: HubPinGameExtras,
): Omit<HubPin, 'id'> {
  if (modal.kind === 'lengthGroup') {
    const pin: Omit<HubPinLengthGroup, 'id'> = {
      kind: 'lengthGroup',
      idPrefix: modal.idPrefix,
      title: modal.title,
      description: modal.description,
      wordLength: settings.wordLength,
      ladderMode: settings.ladderMode,
      ladderStart: settings.ladderStart,
      ladderEnd: settings.ladderEnd,
      gameExtras,
    }
    return pin
  }
  const pin: Omit<HubPinMultiGrid, 'id'> = {
    kind: 'multiGrid',
    title: modal.title,
    description: modal.description,
    boardCount: modal.boardCount,
    wordLength: settings.wordLength,
    ladderMode: settings.ladderMode,
    ladderStart: settings.ladderStart,
    ladderEnd: settings.ladderEnd,
    gameExtras,
  }
  return pin
}

export default function BrowsePage() {
  const navigate = useNavigate()
  const { notify } = useFeedback()
  const { addPin } = useHubPins()

  function quickAdd(modal: ModalOpen, merged: ReturnType<typeof mergedBrowseGameForEntry>) {
    const hub = mergedBrowseGameToHubSettings(merged)
    const extras = mergedBrowseGameToPinExtras(merged)
    addPin(pinFromSettings(modal, hub, extras))
    notify(`Added “${modal.title}” to My hub.`)
  }

  function openInCreate(modal: ModalOpen, merged: ReturnType<typeof mergedBrowseGameForEntry>) {
    const base = new URLSearchParams()
    if (modal.kind === 'lengthGroup') {
      base.set('browseKind', 'lengthGroup')
      base.set('browseId', modal.idPrefix)
    } else {
      base.set('browseKind', 'multiGrid')
      base.set('browseBoards', String(modal.boardCount))
    }
    if (merged.wordSource === 'custom') {
      try {
        sessionStorage.setItem(CREATE_BROWSE_WORDS_KEY, JSON.stringify(merged.customWords))
      } catch {
        /* ignore */
      }
    }
    navigate({ pathname: '/create', search: buildCreateSearchFromMerged(base, merged) })
  }

  function playBrowseSession(merged: ReturnType<typeof mergedBrowseGameForEntry>, title: string) {
    const preset = mergedBrowseGameToCustomPreset({ merged, title })
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
    navigate({ pathname: '/play/browse-session', search: browseSessionPlaySearch() })
  }

  return (
    <div className="browse-page">
      <header className="browse-page-header">
        <h1 className="browse-page-title">Browse variants</h1>
        <p className="browse-page-lead">
          Optional <strong>defaults</strong> / per-card <strong>game</strong> in <code>browseGames.json</code> mirror
          Create (letters, ladder, guesses, timer, custom lists, restrictions). <strong>Play</strong> uses those rules;
          custom lists and timers use the session player. The plus saves a hub pin with the same settings; the gear opens{' '}
          <strong>Create</strong> with everything filled in.
        </p>
      </header>

      {BROWSE_PAGE_SECTIONS.map((section) => {
        const sectionAccent = hubAccentForBrowseCategory(section.category)
        const headingId = sectionHeadingId(section.category)
        return (
          <section key={section.category} className="browse-page-section" aria-labelledby={headingId}>
            <h2 id={headingId} className="browse-page-section-title">
              {section.category}
            </h2>
            <div className="browse-page-row">
              {section.entries.map((entry) => {
                const merged = mergedBrowseGameForEntry(section, entry)
                const catalogEntry = toCatalogEntry(entry)
                const playHref = appendPlayBackBrowseToPlayHref(
                  playHrefFromMergedBrowse(catalogEntry, merged),
                )
                const needSession =
                  entry.kind === 'lengthGroup' && browseGameNeedsCustomSessionPlay(merged)

                if (entry.kind === 'multiGrid') {
                  const { boardCount, title, description, tags } = entry
                  const { tilePreset } = getHubModeTheme('multi', sectionAccent)
                  const multiModal: ModalOpen = {
                    kind: 'multiGrid',
                    boardCount,
                    title,
                    description,
                  }
                  return (
                    <BrowseCard
                      key={`multi-${boardCount}`}
                      accent={sectionAccent}
                      tilePreset={tilePreset}
                      boardCount={boardCount}
                      title={title}
                      description={description}
                      tags={tags}
                      playHref={playHref}
                      onPlay={needSession ? () => playBrowseSession(merged, title) : undefined}
                      onAddQuick={() => quickAdd(multiModal, merged)}
                      onConfigure={() => openInCreate(multiModal, merged)}
                    />
                  )
                }

                const { idPrefix, title, description, tags } = entry
                const { tilePreset } = getHubModeTheme(idPrefix, sectionAccent)
                const lengthModal: ModalOpen = {
                  kind: 'lengthGroup',
                  idPrefix,
                  title,
                  description,
                  tags,
                }
                const showTimer = idPrefix === 'repeat' || idPrefix === 'reverse'
                return (
                  <BrowseCard
                    key={idPrefix}
                    accent={sectionAccent}
                    tilePreset={tilePreset}
                    title={title}
                    description={description}
                    tags={tags}
                    showTimer={showTimer}
                    playHref={playHref}
                    onPlay={needSession ? () => playBrowseSession(merged, title) : undefined}
                    onAddQuick={() => quickAdd(lengthModal, merged)}
                    onConfigure={() => openInCreate(lengthModal, merged)}
                  />
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
