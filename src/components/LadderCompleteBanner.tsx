import './LadderCompleteBanner.css'

export function LadderCompleteBanner({
  lo,
  hi,
  onPlayAgain,
}: {
  lo: number
  hi: number
  onPlayAgain: () => void
}) {
  return (
    <div className="ladder-complete-banner" role="status">
      <p className="ladder-complete-banner-text">
        Ladder complete — you solved every length from <strong>{lo}</strong> to <strong>{hi}</strong>.
      </p>
      <button type="button" className="ladder-complete-banner-btn" onClick={onPlayAgain}>
        Play again
      </button>
    </div>
  )
}
