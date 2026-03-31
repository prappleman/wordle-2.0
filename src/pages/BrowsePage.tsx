import { Link, useNavigate } from 'react-router-dom'
import { BrowseCard } from '../components/BrowseCard'
import { useFeedback } from '../components/FeedbackProvider'
import { useHubPins } from '../hub/useHubPins'
import type { HubPin, HubPinLengthGroup, HubPinMultiGrid } from '../hub/types'
import { HUB_SECTIONS } from '../variants/hubConfig'
import { hubAccentForSectionCategory } from '../components/hubModeThemes'
import { MULTI_BOARD_COUNTS, multiMaxGuesses } from '../variants/multiVariant'
import { defaultHubSettings, type HubSettingsState } from '../components/HubSettingsFields'
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

export default function BrowsePage() {
  const navigate = useNavigate()
  const { notify } = useFeedback()
  const { addPin } = useHubPins()

  function pinFromSettings(modal: ModalOpen, settings: HubSettingsState): Omit<HubPin, 'id'> {
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
    }
    return pin
  }

  function quickAdd(nextModal: ModalOpen) {
    const s = defaultHubSettings()
    addPin(pinFromSettings(nextModal, s))
    notify(`Added “${nextModal.title}” to My hub.`)
  }

  function openInCreate(modal: ModalOpen) {
    if (modal.kind === 'lengthGroup') {
      const sp = new URLSearchParams({
        browseKind: 'lengthGroup',
        browseId: modal.idPrefix,
      })
      navigate({ pathname: '/create', search: sp.toString() })
      return
    }
    const sp = new URLSearchParams({
      browseKind: 'multiGrid',
      browseBoards: String(modal.boardCount),
    })
    navigate({ pathname: '/create', search: sp.toString() })
  }

  return (
    <div className="browse-page">
      <header className="browse-page-header">
        <h1 className="browse-page-title">Browse variants</h1>
        <p className="browse-page-lead">
          The plus button adds a shortcut with default letter count (5) and ladder off. The gear opens{' '}
          <strong>Create</strong> with that variant selected so you can tune settings or jump to play from there. Open{' '}
          <Link to="/">My hub</Link> to play your shortcuts.
        </p>
      </header>

      {HUB_SECTIONS.map((section) => {
        const sectionAccent = hubAccentForSectionCategory(section.category)
        return (
          <section key={section.category} className="browse-page-section" aria-labelledby={`browse-${section.category}`}>
            <h2 id={`browse-${section.category}`} className="browse-page-section-title">
              {section.category}
            </h2>
            <div className="browse-page-grid">
              {section.items.flatMap((item) => {
                if (item.kind === 'multiGrid') {
                  return MULTI_BOARD_COUNTS.map((boardCount) => {
                    const maxG = multiMaxGuesses(boardCount)
                    const title = `Multi (${boardCount})`
                    const description = `Several hidden words at once. Each guess fills every unsolved grid. Solve up to ${maxG} times before losing.`
                    const multiModal: ModalOpen = {
                      kind: 'multiGrid',
                      boardCount,
                      title,
                      description,
                    }
                    return (
                      <BrowseCard
                        key={`multi-${boardCount}`}
                        modeKey="multi"
                        accent={sectionAccent}
                        title={title}
                        description={description}
                        tags={[`${boardCount} boards`, '5 letters', `${maxG} guesses`]}
                        onAddQuick={() => quickAdd(multiModal)}
                        onConfigure={() => openInCreate(multiModal)}
                      />
                    )
                  })
                }
                if (item.kind === 'lengthGroup') {
                  const lengthModal: ModalOpen = {
                    kind: 'lengthGroup',
                    idPrefix: item.idPrefix,
                    title: item.title,
                    description: item.description,
                    tags: item.tags,
                  }
                  return [
                    <BrowseCard
                      key={item.idPrefix}
                      modeKey={item.idPrefix}
                      accent={sectionAccent}
                      title={item.title}
                      description={item.description}
                      tags={item.tags}
                      onAddQuick={() => quickAdd(lengthModal)}
                      onConfigure={() => openInCreate(lengthModal)}
                    />,
                  ]
                }
                return []
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
