import { Link, Navigate, useParams } from 'react-router-dom'
import { CustomPresetPlayView } from '../components/CustomPresetPlayView'
import { getPresetById } from '../lib/customPresets'
import './ClassicWordleScreen.css'
import './CustomGameScreen.css'

export default function CustomGameScreen() {
  const { presetId = '' } = useParams<{ presetId: string }>()
  const preset = presetId ? getPresetById(presetId) : undefined

  if (!presetId) {
    return <Navigate to="/my-variants" replace />
  }
  if (!preset) {
    return (
      <div className="classic-screen">
        <p className="custom-game-screen-missing">Preset not found.</p>
        <Link to="/my-variants">← My variants</Link>
      </div>
    )
  }

  if (preset.playVariantId) {
    return <Navigate to={`/play/${preset.playVariantId}`} replace />
  }

  return <CustomPresetPlayView preset={preset} variant="page" />
}
