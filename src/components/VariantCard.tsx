import { Link } from 'react-router-dom'
import type { VariantDefinition } from '../variants/types'
import './VariantCard.css'

interface VariantCardProps {
  variant: VariantDefinition
  /** Optional query string including `?`, e.g. ladder span. */
  search?: string
}

export function VariantCard({ variant, search }: VariantCardProps) {
  const to = search ? `/play/${variant.id}${search}` : `/play/${variant.id}`
  return (
    <Link to={to} className="variant-card">
      <h2 className="variant-card-title">{variant.title}</h2>
      <p className="variant-card-desc">{variant.description}</p>
      {variant.tags && variant.tags.length > 0 && (
        <ul className="variant-card-tags">
          {variant.tags.map((t) => (
            <li key={t} className="variant-card-tag">
              {t}
            </li>
          ))}
        </ul>
      )}
    </Link>
  )
}
