import { useEffect } from 'react'
import './WordChainOptimalModal.css'

export function WordChainOptimalModal({
  open,
  onClose,
  path,
}: {
  open: boolean
  onClose: () => void
  path: readonly string[]
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="word-chain-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="word-chain-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="word-chain-optimal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="word-chain-optimal-title" className="word-chain-modal-title">
          One optimal path
        </h2>
        <p className="word-chain-modal-path" lang="en">
          {path.join(' → ')}
        </p>
        <p className="word-chain-modal-note">
          {path.length - 1} step{path.length - 1 === 1 ? '' : 's'} (shortest possible)
        </p>
        <button type="button" className="word-chain-modal-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}
