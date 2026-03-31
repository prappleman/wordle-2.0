import { HUB_PINS_STORAGE_KEY, type HubPin } from './types'

export function readHubPins(): HubPin[] {
  try {
    const raw = localStorage.getItem(HUB_PINS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed as HubPin[]
  } catch {
    return []
  }
}
