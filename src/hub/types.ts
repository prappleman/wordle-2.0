import type { CustomWordOrder, CustomWordSource } from '../variants/customPreset'
import type { LadderAdvanceMode } from '../variants/ladderRange'

/** Extra rules saved from Browse JSON (mirrors Create / custom preset). */
export type HubPinGameExtras = {
  maxGuesses?: number
  maxSessionRounds?: number
  timeLimitSeconds?: number | null
  wordSource?: CustomWordSource
  customWordOrder?: CustomWordOrder
  customWords?: string[]
  allowNonDictionary?: boolean
  lockRevealedGreens?: boolean
  forbidAbsentLetters?: boolean
  /** Ladder wrap vs stop when pin ladder is on (not the same as `ladderMode` on/off). */
  ladderAdvance?: LadderAdvanceMode
}

/** Persisted hub shortcut (localStorage). */
export type HubPinSettingsBase = {
  ladderMode: boolean
  ladderStart: number
  ladderEnd: number
}

export type HubPinLengthGroup = {
  id: string
  kind: 'lengthGroup'
  idPrefix: string
  title: string
  description: string
  wordLength: number
  gameExtras?: HubPinGameExtras
} & HubPinSettingsBase

export type HubPinMultiGrid = {
  id: string
  kind: 'multiGrid'
  title: string
  description: string
  boardCount: number
  /** Word length when not in ladder mode (multi-${n}-${boards}). */
  wordLength: number
  gameExtras?: HubPinGameExtras
} & HubPinSettingsBase

export type HubPin = HubPinLengthGroup | HubPinMultiGrid

export const DEFAULT_LADDER_START = 2
export const DEFAULT_LADDER_END = 6

export const HUB_PINS_STORAGE_KEY = 'wordle-hub-pins-v1'
