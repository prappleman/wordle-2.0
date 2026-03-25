import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { HUB_WORD_LENGTHS } from '../variants/hubConfig'
import './HubLengthGroupCard.css'
import './HubMultiGridCard.css'

interface HubLengthGroupPlayCardProps {
  idPrefix: string
  title: string
  description: string
  tags?: string[]
  defaultLength?: number
}

export function HubLengthGroupPlayCard({
  idPrefix,
  title,
  description,
  tags,
  defaultLength = 5,
}: HubLengthGroupPlayCardProps) {
  const [len, setLen] = useState(defaultLength)

  const playPath = useMemo(() => `/play/${idPrefix}-${len}`, [idPrefix, len])

  return (
    <div className="hub-length-card">
      <div className="hub-length-card-main">
        <h2 className="hub-length-card-title">{title}</h2>
        <p className="hub-length-card-desc">{description}</p>
        {tags && tags.length > 0 && (
          <ul className="hub-length-card-tags">
            {tags.map((t) => (
              <li key={t} className="hub-length-card-tag">
                {t}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="hub-length-card-footer">
        <span className="hub-length-card-label" aria-hidden="true">
          Letters
        </span>
        <div className="hub-length-picker" role="group" aria-label={`Select ${title} length`}>
          {HUB_WORD_LENGTHS.map((n) => (
            <button
              key={n}
              type="button"
              className={`hub-length-btn ${len === n ? 'hub-length-btn--selected' : ''}`}
              onClick={() => setLen(n)}
              aria-pressed={len === n}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="hub-multi-card-play">
        <Link to={playPath} className="hub-multi-card-play-link">
          Play ({len})
        </Link>
      </div>
    </div>
  )
}

