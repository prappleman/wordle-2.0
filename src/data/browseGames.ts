/**
 * Browse layout + copy: edit `browseGames.json`.
 *
 * Optional tuning (same idea as Create):
 * - Top-level `defaults` and per-section `defaults` merge before each entry’s `game`.
 * - `game` on an entry (optional): wordLength, ladderEnabled, ladderLo, ladderHi, ladderAdvance ("stop"|"wrap"),
 *   maxGuesses, wordSource ("dictionary"|"custom"), customWords (string[]), customWordOrder ("random"|"sequential"),
 *   allowNonDictionary, maxSessionRounds, timeLimitSeconds (number or null), lockRevealedGreens, forbidAbsentLetters.
 *
 * Custom lists, timers, multi-round sessions, or ladder wrap use the custom session player (`/play/browse-session`).
 * Dictionary modes mostly use normal `/play/...` URLs with query overlays (max guesses, restrictions, etc.).
 */
import browseGamesFile from './browseGames.json'
import {
  mergeBrowseGameSettings,
  type BrowseGamePartial,
  type MergedBrowseGame,
} from '../variants/browseGameMerge'

export type BrowsePageLengthEntry = {
  kind: 'lengthGroup'
  idPrefix: string
  title: string
  description: string
  tags?: string[]
  game?: BrowseGamePartial
}

export type BrowsePageMultiEntry = {
  kind: 'multiGrid'
  boardCount: number
  title: string
  description: string
  tags?: string[]
  game?: BrowseGamePartial
}

export type BrowsePageEntry = BrowsePageLengthEntry | BrowsePageMultiEntry

export type BrowsePageSection = {
  category: string
  defaults?: BrowseGamePartial
  entries: BrowsePageEntry[]
}

type BrowseGamesJson = {
  defaults?: BrowseGamePartial
  sections: BrowsePageSection[]
}

const data = browseGamesFile as BrowseGamesJson

export const BROWSE_PAGE_DEFAULTS: BrowseGamePartial | undefined = data.defaults
export const BROWSE_PAGE_SECTIONS: BrowsePageSection[] = data.sections

export function mergedBrowseGameForEntry(section: BrowsePageSection, entry: BrowsePageEntry): MergedBrowseGame {
  return mergeBrowseGameSettings(BROWSE_PAGE_DEFAULTS, section.defaults, entry.game)
}
