import { Suspense } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { ClassicWordleScreen } from './ClassicWordleScreen'
import { getVariant } from '../variants/registry'
import './PlayPage.css'

export function PlayPage() {
  const { variantId } = useParams<{ variantId: string }>()
  if (!variantId) {
    return <Navigate to="/" replace />
  }

  const variant = getVariant(variantId)
  if (!variant) {
    return <Navigate to="/" replace />
  }

  if (variant.kind === 'custom') {
    const Screen = variant.screen
    return (
      <div className="play-page">
        <Suspense fallback={<p className="play-page-loading">Loading…</p>}>
          <Screen />
        </Suspense>
      </div>
    )
  }

  return (
    <ClassicWordleScreen title={variant.title} config={variant.config} />
  )
}
