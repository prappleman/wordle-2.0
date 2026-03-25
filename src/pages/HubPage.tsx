import { useMemo, useState } from 'react'
import { HubMultiGridCard } from '../components/HubMultiGridCard'
import { VariantCard } from '../components/VariantCard'
import { HUB_SECTIONS } from '../variants/hubConfig'
import { getVariant } from '../variants/registry'
import './HubPage.css'

export function HubPage() {
  const sections = useMemo(() => HUB_SECTIONS, [])
  const [selectedLength, setSelectedLength] = useState(5)
  const [ladderMode, setLadderMode] = useState(false)

  const computeVariantId = (idPrefix: string) => {
    if (!ladderMode) return `${idPrefix}-${selectedLength}`
    // Zen Infinite doesn't support ladder mode.
    if (idPrefix === 'zen-infinite') return `zen-infinite-${selectedLength}`
    const startLen = 3
    if (idPrefix === 'classic') return `growing-word-${startLen}`
    return `ladder-${idPrefix}-${startLen}`
  }

  return (
    <div className="hub">
      <header className="hub-header">
        <h1 className="hub-title">Wordle hub</h1>
        <p className="hub-subtitle">
          Choose a mode. Pick either a letter count (3–7) or switch to Ladder (always starts at 3).
        </p>

        <div className="hub-play-menu" role="group" aria-label="Play options">
          <div className="hub-play-menu-row">
            <span className="hub-play-menu-label">Letters or Ladder</span>
            <div className="hub-play-menu-picker" aria-label="Pick letter length or ladder">
              {[3, 4, 5, 6, 7].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`hub-menu-btn ${!ladderMode && selectedLength === n ? 'hub-menu-btn--selected' : ''}`}
                  aria-pressed={!ladderMode && selectedLength === n}
                  onClick={() => {
                    setLadderMode(false)
                    setSelectedLength(n)
                  }}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                className={`hub-menu-btn ${ladderMode ? 'hub-menu-btn--selected' : ''}`}
                aria-pressed={ladderMode}
                onClick={() => {
                  setLadderMode(true)
                  setSelectedLength(3)
                }}
              >
                Ladder
              </button>
            </div>
          </div>
        </div>
      </header>
      {sections.map((section, si) => (
        <section
          key={section.category}
          className="hub-section"
          aria-labelledby={`hub-section-${si}`}
        >
          <h2 id={`hub-section-${si}`} className="hub-section-title">
            {section.category}
          </h2>
          <ul className="hub-list">
            {section.items.map((item) => {
              if (item.kind === 'multiGrid') {
                return (
                  <li key="multi-grid">
                    <HubMultiGridCard selectedLength={selectedLength} ladderMode={ladderMode} />
                  </li>
                )
              }

              if (item.kind === 'lengthGroup') {
                if (ladderMode && item.idPrefix === 'zen-infinite') return null
                const variantId = computeVariantId(item.idPrefix)
                const v = getVariant(variantId)
                if (!v) return null
                const cardVariant =
                  ladderMode && v.tags
                    ? { ...v, tags: v.tags.filter((t) => !t.endsWith('-letter')) }
                    : v
                return (
                  <li key={variantId}>
                    <VariantCard variant={cardVariant} />
                  </li>
                )
              }
              return null
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
