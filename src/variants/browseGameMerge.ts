import type { LadderAdvanceMode } from './ladderRange'
import {
  defaultCustomPreset,
  normalizePreset,
  parseCustomWordLines,
  type CustomGamePreset,
  type CustomWordOrder,
  type CustomWordSource,
} from './customPreset'
import type { HubSettingsState } from '../components/HubSettingsFields'
import type { HubPin, HubPinGameExtras } from '../hub/types'

/** Optional game tuning in `browseGames.json` (same knobs as Create / custom preset). */
export type BrowseGamePartial = Partial<{
  wordLength: number
  ladderEnabled: boolean
  ladderLo: number
  ladderHi: number
  /** After last ladder rung: stop vs wrap (Create “After last rung”). */
  ladderAdvance: LadderAdvanceMode
  maxGuesses: number
  wordSource: CustomWordSource
  /** One word per string; joined lines also accepted at JSON import boundary. */
  customWords: string[]
  customWordOrder: CustomWordOrder
  allowNonDictionary: boolean
  maxSessionRounds: number
  timeLimitSeconds: number | null
  lockRevealedGreens: boolean
  forbidAbsentLetters: boolean
}>

const DEF = defaultCustomPreset()

function shallowMerge(
  root: BrowseGamePartial | undefined,
  section: BrowseGamePartial | undefined,
  entry: BrowseGamePartial | undefined,
): BrowseGamePartial {
  return { ...root, ...section, ...entry }
}

/** Effective values after merging root → section → entry over Create defaults. */
export type MergedBrowseGame = {
  wordLength: number
  ladderEnabled: boolean
  ladderLo: number
  ladderHi: number
  ladderAdvance: LadderAdvanceMode
  maxGuesses: number
  wordSource: CustomWordSource
  customWords: string[]
  customWordOrder: CustomWordOrder
  allowNonDictionary: boolean
  maxSessionRounds: number
  timeLimitSeconds: number | null
  lockRevealedGreens: boolean
  forbidAbsentLetters: boolean
}

export function mergeBrowseGameSettings(
  root: BrowseGamePartial | undefined,
  section: BrowseGamePartial | undefined,
  entry: BrowseGamePartial | undefined,
): MergedBrowseGame {
  const m = shallowMerge(root, section, entry)
  return {
    wordLength: m.wordLength ?? DEF.wordLength,
    ladderEnabled: m.ladderEnabled ?? DEF.ladderEnabled,
    ladderLo: m.ladderLo ?? DEF.ladderLo,
    ladderHi: m.ladderHi ?? DEF.ladderHi,
    ladderAdvance: m.ladderAdvance ?? DEF.ladderMode,
    maxGuesses: m.maxGuesses ?? DEF.maxGuesses,
    wordSource: m.wordSource ?? DEF.wordSource,
    customWords: m.customWords ?? DEF.customWords,
    customWordOrder: m.customWordOrder ?? DEF.customWordOrder,
    allowNonDictionary: m.allowNonDictionary ?? DEF.allowNonDictionary,
    maxSessionRounds: m.maxSessionRounds ?? DEF.maxSessionRounds,
    timeLimitSeconds: m.timeLimitSeconds !== undefined ? m.timeLimitSeconds : DEF.timeLimitSeconds,
    lockRevealedGreens: m.lockRevealedGreens ?? DEF.lockRevealedGreens,
    forbidAbsentLetters: m.forbidAbsentLetters ?? DEF.forbidAbsentLetters,
  }
}

export function mergedBrowseGameToHubSettings(m: MergedBrowseGame): HubSettingsState {
  return {
    wordLength: m.wordLength,
    ladderMode: m.ladderEnabled,
    ladderStart: m.ladderLo,
    ladderEnd: m.ladderHi,
  }
}

export function mergedBrowseGameToPinExtras(m: MergedBrowseGame): HubPinGameExtras | undefined {
  const extras: HubPinGameExtras = {}
  if (m.maxGuesses !== DEF.maxGuesses) extras.maxGuesses = m.maxGuesses
  if (m.maxSessionRounds !== DEF.maxSessionRounds) extras.maxSessionRounds = m.maxSessionRounds
  if (m.timeLimitSeconds !== DEF.timeLimitSeconds) extras.timeLimitSeconds = m.timeLimitSeconds
  if (m.wordSource !== DEF.wordSource) extras.wordSource = m.wordSource
  if (m.customWordOrder !== DEF.customWordOrder) extras.customWordOrder = m.customWordOrder
  if (m.customWords.length > 0) extras.customWords = [...m.customWords]
  if (m.allowNonDictionary !== DEF.allowNonDictionary) extras.allowNonDictionary = m.allowNonDictionary
  if (m.lockRevealedGreens !== DEF.lockRevealedGreens) extras.lockRevealedGreens = m.lockRevealedGreens
  if (m.forbidAbsentLetters !== DEF.forbidAbsentLetters) extras.forbidAbsentLetters = m.forbidAbsentLetters
  if (m.ladderAdvance !== DEF.ladderMode) extras.ladderAdvance = m.ladderAdvance
  return Object.keys(extras).length > 0 ? extras : undefined
}

/** Uses generic custom session (timer, multi-round, custom list, ladder wrap) — not the built-in variant screen. */
export function browseGameNeedsCustomSessionPlay(m: MergedBrowseGame): boolean {
  if (m.wordSource === 'custom') return true
  if (m.maxSessionRounds !== 1) return true
  if (m.timeLimitSeconds != null) return true
  if (m.ladderEnabled && m.ladderAdvance === 'wrap') return true
  return false
}

export function mergedBrowseGameToCustomPreset(params: {
  merged: MergedBrowseGame
  title: string
}): CustomGamePreset {
  const { merged, title } = params
  const now = new Date().toISOString()
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `browse-${now}-${Math.random().toString(36).slice(2, 9)}`
  const words =
    merged.wordSource === 'custom' ? parseCustomWordLines(merged.customWords.join('\n')) : []

  const raw: CustomGamePreset = {
    ...DEF,
    id,
    name: title,
    updatedAt: now,
    wordLength: merged.wordLength,
    maxGuesses: merged.maxGuesses,
    wordSource: merged.wordSource,
    customWords: words,
    customWordOrder: merged.customWordOrder,
    allowNonDictionary: merged.allowNonDictionary,
    ladderEnabled: merged.ladderEnabled,
    ladderLo: merged.ladderLo,
    ladderHi: merged.ladderHi,
    ladderMode: merged.ladderAdvance,
    maxSessionRounds: merged.maxSessionRounds,
    timeLimitSeconds: merged.timeLimitSeconds,
    lockRevealedGreens: merged.lockRevealedGreens,
    forbidAbsentLetters: merged.forbidAbsentLetters,
  }
  return normalizePreset(raw)
}

export function mergedBrowseGameToCreateDraft(merged: MergedBrowseGame): Partial<CustomGamePreset> {
  const words =
    merged.wordSource === 'custom'
      ? parseCustomWordLines(merged.customWords.join('\n'))
      : []
  return {
    wordLength: merged.wordLength,
    maxGuesses: merged.maxGuesses,
    wordSource: merged.wordSource,
    customWords: words,
    customWordOrder: merged.customWordOrder,
    allowNonDictionary: merged.allowNonDictionary,
    ladderEnabled: merged.ladderEnabled,
    ladderLo: merged.ladderLo,
    ladderHi: merged.ladderHi,
    ladderMode: merged.ladderAdvance,
    maxSessionRounds: merged.maxSessionRounds,
    timeLimitSeconds: merged.timeLimitSeconds,
    lockRevealedGreens: merged.lockRevealedGreens,
    forbidAbsentLetters: merged.forbidAbsentLetters,
  }
}

export function hubPinNeedsBrowseSessionPlay(pin: HubPin): boolean {
  if (pin.kind === 'multiGrid') return false
  const g = pin.gameExtras
  if (!g) return false
  if (g.wordSource === 'custom' && (g.customWords?.length ?? 0) > 0) return true
  if ((g.maxSessionRounds ?? 1) !== 1) return true
  if (g.timeLimitSeconds != null) return true
  if (pin.ladderMode && g.ladderAdvance === 'wrap') return true
  return false
}

export function hubPinToBrowseSessionPreset(pin: HubPin): CustomGamePreset | null {
  if (pin.kind !== 'lengthGroup') return null
  const g = pin.gameExtras ?? {}
  const base = defaultCustomPreset()
  const merged = mergeBrowseGameSettings(undefined, undefined, {
    wordLength: pin.wordLength,
    ladderEnabled: pin.ladderMode,
    ladderLo: pin.ladderStart,
    ladderHi: pin.ladderEnd,
    ladderAdvance: g.ladderAdvance ?? base.ladderMode,
    maxGuesses: g.maxGuesses ?? base.maxGuesses,
    wordSource: g.wordSource ?? 'dictionary',
    customWords: g.customWords ?? [],
    customWordOrder: g.customWordOrder ?? 'random',
    allowNonDictionary: g.allowNonDictionary ?? false,
    maxSessionRounds: g.maxSessionRounds ?? 1,
    timeLimitSeconds: g.timeLimitSeconds !== undefined ? g.timeLimitSeconds : null,
    lockRevealedGreens: g.lockRevealedGreens ?? false,
    forbidAbsentLetters: g.forbidAbsentLetters ?? false,
  })
  return mergedBrowseGameToCustomPreset({ merged, title: pin.title })
}
