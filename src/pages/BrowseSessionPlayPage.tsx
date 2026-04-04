import { useEffect, useState } from 'react'
import { PlayScreenBackLink } from '../components/PlayScreenBackLink'
import { CustomPresetPlayView } from '../components/CustomPresetPlayView'
import type { CustomGamePreset } from '../variants/customPreset'
import { BROWSE_SESSION_PRESET_KEY } from '../play/browseSessionStorage'
import './ClassicWordleScreen.css'
import './CustomGameScreen.css'

export default function BrowseSessionPlayPage() {
  const [preset, setPreset] = useState<CustomGamePreset | null>(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(BROWSE_SESSION_PRESET_KEY)
      if (!raw) {
        setMissing(true)
        return
      }
      const p = JSON.parse(raw) as CustomGamePreset
      sessionStorage.removeItem(BROWSE_SESSION_PRESET_KEY)
      setPreset(p)
    } catch {
      setMissing(true)
    }
  }, [])

  if (missing) {
    return (
      <div className="classic-screen">
        <p className="custom-game-screen-missing">Session expired or missing. Open a game from Browse again.</p>
        <PlayScreenBackLink className="classic-screen-back" />
      </div>
    )
  }

  if (!preset) {
    return <p className="play-page-loading">Loading…</p>
  }

  return <CustomPresetPlayView key={preset.id} preset={preset} variant="page" />
}
