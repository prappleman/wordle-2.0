import { Suspense } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import { ClassicWordleScreen } from './ClassicWordleScreen'
import { getVariant } from '../variants/registry'
import './PlayPage.css'

export function PlayPage() {
  const { variantId } = useParams<{ variantId: string }>()
  const { search } = useLocation()
  if (!variantId) {
    return <Navigate to="/" replace />
  }

  if (variantId === 'quad-5') {
    return <Navigate to={`/play/multi-5-4${search}`} replace />
  }

  if (/^frame-drag-\d+$/.test(variantId)) {
    return <Navigate to={`/play/square-5${search}`} replace />
  }

  if (/^cross6-drag-\d+$/.test(variantId)) {
    return <Navigate to={`/play/waffle-5${search}`} replace />
  }

  if (/^square-\d+$/.test(variantId) && variantId !== 'square-5') {
    return <Navigate to={`/play/square-5${search}`} replace />
  }

  if (/^waffle-\d+$/.test(variantId) && variantId !== 'waffle-5') {
    return <Navigate to={`/play/waffle-5${search}`} replace />
  }

  if (/^plus-\d+$/.test(variantId) && variantId !== 'plus-5') {
    return <Navigate to={`/play/plus-5${search}`} replace />
  }

  if (/^cross-\d+$/.test(variantId) && variantId !== 'cross-5') {
    return <Navigate to={`/play/cross-5${search}`} replace />
  }

  const variant = getVariant(variantId)
  if (!variant) {
    return <Navigate to="/" replace />
  }

  if (variant.kind === 'custom') {
    const Screen = variant.screen
    return (
      <div className="play-page">
        <Suspense key={variantId} fallback={<p className="play-page-loading">Loading…</p>}>
          <Screen />
        </Suspense>
      </div>
    )
  }

  return (
    <ClassicWordleScreen title={variant.title} config={variant.config} />
  )
}
