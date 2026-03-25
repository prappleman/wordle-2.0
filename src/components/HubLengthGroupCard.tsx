import { Link } from 'react-router-dom'
import { HUB_WORD_LENGTHS } from '../variants/hubConfig'
import './HubLengthGroupCard.css'

interface HubLengthGroupCardProps {
  idPrefix: string
  title: string
  description: string
  tags?: string[]
}

export function HubLengthGroupCard({
  idPrefix,
  title,
  description,
  tags,
}: HubLengthGroupCardProps) {
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
        <span className="hub-length-card-label" id={`len-label-${idPrefix}`}>
          Letters
        </span>
        <div
          className="hub-length-picker"
          role="group"
          aria-labelledby={`len-label-${idPrefix}`}
        >
          {HUB_WORD_LENGTHS.map((n) => (
            <Link
              key={n}
              to={`/play/${idPrefix}-${n}`}
              className="hub-length-btn"
            >
              {n}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
