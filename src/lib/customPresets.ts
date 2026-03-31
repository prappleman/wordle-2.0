import type { CustomGamePreset } from '../variants/customPreset'
import { CUSTOM_PRESET_STORAGE_KEY } from '../variants/customPreset'

export function readCustomPresets(): CustomGamePreset[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PRESET_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed as CustomGamePreset[]
  } catch {
    return []
  }
}

export function writeCustomPresets(presets: CustomGamePreset[]): void {
  try {
    localStorage.setItem(CUSTOM_PRESET_STORAGE_KEY, JSON.stringify(presets))
  } catch {
    /* ignore quota */
  }
}

export function getPresetById(id: string): CustomGamePreset | undefined {
  return readCustomPresets().find((p) => p.id === id)
}

export function upsertPreset(preset: CustomGamePreset): void {
  const list = readCustomPresets()
  const i = list.findIndex((p) => p.id === preset.id)
  const next = { ...preset, updatedAt: new Date().toISOString() }
  if (i >= 0) list[i] = next
  else list.push(next)
  writeCustomPresets(list)
}

export function deletePreset(id: string): void {
  writeCustomPresets(readCustomPresets().filter((p) => p.id !== id))
}
