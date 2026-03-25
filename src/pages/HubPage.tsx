import { useMemo, useState } from 'react'
import { HubMultiGridCard } from '../components/HubMultiGridCard'
import { VariantCard } from '../components/VariantCard'
import { HUB_PLAY_LENGTHS, HUB_SECTIONS } from '../variants/hubConfig'
import { LADDER_PICK_LENGTHS } from '../variants/ladderLength'
import { ladderRangeQuery } from '../variants/ladderRange'
import { getVariant } from '../variants/registry'
import './HubPage.css'

const DEFAULT_LADDER_START = 2
const DEFAULT_LADDER_END = 6

export function HubPage() {
  const sections = useMemo(() => HUB_SECTIONS, [])
  const [selectedLength, setSelectedLength] = useState(5)
  const [ladderMode, setLadderMode] = useState(false)
  const [ladderStart, setLadderStart] = useState(DEFAULT_LADDER_START)
  const [ladderEnd, setLadderEnd] = useState(DEFAULT_LADDER_END)

  const ladderSearch = ladderRangeQuery(ladderStart, ladderEnd)

  const computeVariantId = (idPrefix: string) => {
    if (!ladderMode) return `${idPrefix}-${selectedLength}`
    if (idPrefix === 'zen-infinite') return `zen-infinite-${selectedLength}`
    const startLen = ladderStart
    if (idPrefix === 'classic') return `growing-word-${startLen}`
    return `ladder-${idPrefix}-${startLen}`
  }

  return (
    <div className="hub">
      <header className="hub-header">
        <h1 className="hub-title">Wordle hub</h1>
        <p className="hub-subtitle">
          Choose a mode. Pick a letter count (2–12), or turn on ladder mode and set the first and last
          rung (default {DEFAULT_LADDER_START}–{DEFAULT_LADDER_END}).
        </p>

        <div className="hub-play-menu" role="group" aria-label="Play options">
          <div className="hub-play-menu-row hub-play-menu-row--toggle">
            <span className="hub-play-menu-label" id="hub-ladder-label">
              Ladder
            </span>
            <button
              type="button"
              id="hub-ladder-switch"
              className="hub-ladder-switch"
              role="switch"
              aria-checked={ladderMode}
              aria-labelledby="hub-ladder-label"
              onClick={() => setLadderMode((v) => !v)}
            >
              <span className="hub-ladder-switch-track" aria-hidden>
                <span className="hub-ladder-switch-thumb" />
              </span>
              <span className="hub-ladder-switch-text">{ladderMode ? 'On' : 'Off'}</span>
            </button>
          </div>

          {!ladderMode && (
            <div className="hub-play-menu-row">
              <span className="hub-play-menu-label">Letters</span>
              <div className="hub-play-menu-picker" aria-label="Word length">
                {HUB_PLAY_LENGTHS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`hub-menu-btn ${selectedLength === n ? 'hub-menu-btn--selected' : ''}`}
                    aria-pressed={selectedLength === n}
                    onClick={() => setSelectedLength(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {ladderMode && (
            <>
              <div className="hub-play-menu-row">
                <span className="hub-play-menu-label">Start</span>
                <div className="hub-play-menu-picker" aria-label="Ladder start rung">
                  {LADDER_PICK_LENGTHS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`hub-menu-btn ${ladderStart === n ? 'hub-menu-btn--selected' : ''}`}
                      aria-pressed={ladderStart === n}
                      onClick={() => setLadderStart(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div className="hub-play-menu-row">
                <span className="hub-play-menu-label">End</span>
                <div className="hub-play-menu-picker" aria-label="Ladder end rung">
                  {LADDER_PICK_LENGTHS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`hub-menu-btn ${ladderEnd === n ? 'hub-menu-btn--selected' : ''}`}
                      aria-pressed={ladderEnd === n}
                      onClick={() => setLadderEnd(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
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
                    <HubMultiGridCard
                      selectedLength={selectedLength}
                      ladderMode={ladderMode}
                      ladderSearch={ladderSearch}
                    />
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
                    <VariantCard variant={cardVariant} search={ladderMode ? ladderSearch : undefined} />
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
