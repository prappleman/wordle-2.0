import { Link } from 'react-router-dom'
import type { HubAccent } from './hubModeThemes'
import './hubModeCardThemes.css'
import './BrowseCard.css'

function IconPlus() {
  return (
    <svg className="browse-card-icon" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6v-2z"
      />
    </svg>
  )
}

function IconPlay() {
  return (
    <svg className="browse-card-icon" viewBox="0 0 24 24" aria-hidden>
      <path fill="currentColor" d="M8 5v14l11-7L8 5z" />
    </svg>
  )
}

function IconGear() {
  return (
    <svg className="browse-card-icon" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.488.488 0 0 0-.6-.22l-2.39.96c-.52-.4-1.08-.73-1.69-.98l-.36-2.54a.484.484 0 0 0-.48-.42h-3.84c-.24 0-.43.17-.47.42l-.36 2.54c-.61.25-1.17.59-1.69.98l-2.39-.96c-.22-.08-.47 0-.6.22L2.74 8.87c-.12.21-.08.47.12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.52.4 1.08.73 1.69.98l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.42l.36-2.54c.61-.25 1.17-.59 1.69-.98l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"
      />
    </svg>
  )
}

type BrowseCardProps = {
  /** Section accent: Classic = green, Variants = yellow, Multi = red */
  accent: HubAccent
  title: string
  description: string
  tags?: string[]
  /** Built-in play URL (with query overlays when set in browse JSON). */
  playHref: string
  /** Custom session play (custom words, timer, multi-round, ladder wrap). Overrides `playHref`. */
  onPlay?: () => void
  /** Add with default letter count and ladder settings (no modal). */
  onAddQuick: () => void
  /** Open settings (word length, ladder) then add from modal. */
  onConfigure: () => void
}

export function BrowseCard({
  accent,
  title,
  description,
  tags,
  playHref,
  onPlay,
  onAddQuick,
  onConfigure,
}: BrowseCardProps) {
  return (
    <article className={`browse-card hub-mode-card hub-mode-card--accent-${accent}`}>
      <div className="hub-mode-card__shine" aria-hidden />
      <div className="hub-mode-card__inner browse-card__inner">
        <div className="browse-card-body">
          <h3 className="browse-card-title">{title}</h3>
          <p className="browse-card-desc">{description}</p>
          {tags && tags.length > 0 && (
            <ul className="browse-card-tags">
              {tags.map((t) => (
                <li key={t} className="browse-card-tag">
                  {t}
                </li>
              ))}
            </ul>
          )}
          <div className="browse-card-actions">
            {onPlay ? (
              <button
                type="button"
                className="browse-card-icon-btn browse-card-icon-btn--play"
                onClick={onPlay}
                aria-label={`Play ${title}`}
              >
                <IconPlay />
              </button>
            ) : (
              <Link
                to={playHref}
                className="browse-card-icon-btn browse-card-icon-btn--play"
                aria-label={`Play ${title}`}
              >
                <IconPlay />
              </Link>
            )}
            <button
              type="button"
              className="browse-card-icon-btn browse-card-icon-btn--add"
              onClick={onAddQuick}
              aria-label={`Add ${title} to My hub with default settings`}
            >
              <IconPlus />
            </button>
            <button
              type="button"
              className="browse-card-icon-btn browse-card-icon-btn--gear"
              onClick={onConfigure}
              aria-label={`Open Create with ${title} selected`}
            >
              <IconGear />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
