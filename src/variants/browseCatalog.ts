import { playHrefFromPin } from '../hub/resolvePlayTarget'
import type { HubPin } from '../hub/types'
import {
  mergeBrowseGameSettings,
  mergedBrowseGameToHubSettings,
  mergedBrowseGameToPinExtras,
  type MergedBrowseGame,
} from './browseGameMerge'
import { HUB_SECTIONS } from './hubConfig'
import { MULTI_BOARD_COUNTS, multiMaxGuesses } from './multiVariant'

/** Default hub mode when opening Create with no query (same as Browse “Classic”). */
export const DEFAULT_CREATE_BROWSE_ID_PREFIX = 'classic'

export type BrowseCatalogEntry =
  | { kind: 'lengthGroup'; idPrefix: string; title: string; description: string; tags?: string[] }
  | { kind: 'multiGrid'; boardCount: number; title: string; description: string }

/** Same cards as Browse / hub config (length-group modes + multi-board counts). */
export function getBrowseCatalog(): BrowseCatalogEntry[] {
  const out: BrowseCatalogEntry[] = []
  for (const section of HUB_SECTIONS) {
    for (const item of section.items) {
      if (item.kind === 'multiGrid') {
        for (const boardCount of MULTI_BOARD_COUNTS) {
          const maxG = multiMaxGuesses(boardCount)
          out.push({
            kind: 'multiGrid',
            boardCount,
            title: `Multi (${boardCount})`,
            description: `Several hidden words at once. Each guess fills every unsolved grid. Solve up to ${maxG} times before losing.`,
          })
        }
      } else if (item.kind === 'lengthGroup') {
        out.push({
          kind: 'lengthGroup',
          idPrefix: item.idPrefix,
          title: item.title,
          description: item.description,
          tags: item.tags,
        })
      }
    }
  }
  return out
}

export function browseOptionKey(entry: BrowseCatalogEntry): string {
  if (entry.kind === 'lengthGroup') return `browse:lg:${entry.idPrefix}`
  return `browse:multi:${entry.boardCount}`
}

export function playHrefFromMergedBrowse(entry: BrowseCatalogEntry, merged: MergedBrowseGame): string {
  const hub = mergedBrowseGameToHubSettings(merged)
  const extras = mergedBrowseGameToPinExtras(merged)
  if (entry.kind === 'lengthGroup') {
    const pin: HubPin = {
      id: 'temp',
      kind: 'lengthGroup',
      idPrefix: entry.idPrefix,
      title: entry.title,
      description: entry.description,
      wordLength: hub.wordLength,
      ladderMode: hub.ladderMode,
      ladderStart: hub.ladderStart,
      ladderEnd: hub.ladderEnd,
      gameExtras: extras,
    }
    return playHrefFromPin(pin)
  }
  const pin: HubPin = {
    id: 'temp',
    kind: 'multiGrid',
    title: entry.title,
    description: entry.description,
    boardCount: entry.boardCount,
    wordLength: hub.wordLength,
    ladderMode: hub.ladderMode,
    ladderStart: hub.ladderStart,
    ladderEnd: hub.ladderEnd,
    gameExtras: extras,
  }
  return playHrefFromPin(pin)
}

export function playHrefFromBrowseEntry(entry: BrowseCatalogEntry): string {
  return playHrefFromMergedBrowse(entry, mergeBrowseGameSettings(undefined, undefined, undefined))
}

export function findBrowseEntryByOptionKey(key: string): BrowseCatalogEntry | undefined {
  if (key.startsWith('browse:lg:')) {
    const idPrefix = key.slice('browse:lg:'.length)
    return getBrowseCatalog().find((e) => e.kind === 'lengthGroup' && e.idPrefix === idPrefix)
  }
  if (key.startsWith('browse:multi:')) {
    const n = Number(key.slice('browse:multi:'.length))
    if (!Number.isFinite(n)) return undefined
    return getBrowseCatalog().find((e) => e.kind === 'multiGrid' && e.boardCount === n)
  }
  return undefined
}
