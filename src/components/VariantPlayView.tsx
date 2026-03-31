import { Suspense } from 'react'
import { ClassicWordleScreen } from '../pages/ClassicWordleScreen'
import { getVariant } from '../variants/registry'
import '../pages/PlayPage.css'

export function VariantPlayView({ variantId }: { variantId: string }) {
  const variant = getVariant(variantId)
  if (!variant) {
    return <p className="play-page-loading">Variant not found.</p>
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

  return <ClassicWordleScreen title={variant.title} config={variant.config} />
}

