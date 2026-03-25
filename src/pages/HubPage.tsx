import { VariantCard } from '../components/VariantCard'
import { VARIANTS } from '../variants/registry'
import './HubPage.css'

export function HubPage() {
  return (
    <div className="hub">
      <header className="hub-header">
        <h1 className="hub-title">Wordle hub</h1>
        <p className="hub-subtitle">Pick a variant. More modes can be added to the registry anytime.</p>
      </header>
      <ul className="hub-list">
        {VARIANTS.map((v) => (
          <li key={v.id}>
            <VariantCard variant={v} />
          </li>
        ))}
      </ul>
    </div>
  )
}
