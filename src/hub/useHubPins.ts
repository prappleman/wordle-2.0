import { useCallback, useEffect, useState } from 'react'
import {
  DEFAULT_LADDER_END,
  DEFAULT_LADDER_START,
  HUB_PINS_STORAGE_KEY,
  type HubPin,
} from './types'
import { readHubPins } from './readHubPins'

function newPinId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `pin-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

function loadPins(): HubPin[] {
  return readHubPins()
}

function savePins(pins: HubPin[]) {
  try {
    localStorage.setItem(HUB_PINS_STORAGE_KEY, JSON.stringify(pins))
  } catch {
    /* ignore */
  }
}

export function useHubPins() {
  const [pins, setPins] = useState<HubPin[]>(loadPins)

  useEffect(() => {
    savePins(pins)
  }, [pins])

  const addPin = useCallback((pin: Omit<HubPin, 'id'> & { id?: string }) => {
    const id = pin.id ?? newPinId()
    setPins((prev) => [...prev, { ...pin, id } as HubPin])
  }, [])

  const updatePin = useCallback((id: string, next: HubPin) => {
    setPins((prev) => prev.map((p) => (p.id === id ? next : p)))
  }, [])

  const removePin = useCallback((id: string) => {
    setPins((prev) => prev.filter((p) => p.id !== id))
  }, [])

  return {
    pins,
    addPin,
    updatePin,
    removePin,
    defaultLadder: { start: DEFAULT_LADDER_START, end: DEFAULT_LADDER_END },
  }
}

