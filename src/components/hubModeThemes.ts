/**
 * Tile preset for browse / pin mini-tiles + section accent (Classic / Variants / Multi).
 */
import {
  HUB_CATEGORY_CLASSIC,
  HUB_CATEGORY_MULTI,
  HUB_CATEGORY_VARIANTS,
} from '../variants/hubConfig'

export type HubTilePreset =
  | 'wordle'
  | 'colorless'
  | 'dim'
  | 'chain'
  | 'streak'
  | 'misleading'
  | 'zen'
  | 'infinite'
  | 'notes'
  | 'banned'
  | 'memoryFlash'
  | 'memoryHide'
  | 'locked'
  | 'reverse'
  | 'blocked'
  | 'spaces'
  | 'forced'
  | 'doubles'
  | 'dual'
  | 'multi'

/** Border / hover: green = Classic, yellow = Variants, red = Multi */
export type HubAccent = 'g' | 'y' | 'r' | 'w'

export type HubModeTheme = {
  accent: HubAccent
  tilePreset: HubTilePreset
}

const MAP: Record<string, HubTilePreset> = {
  classic: 'wordle',
  colorless: 'colorless',
  unscramble: 'dim',
  'word-chain': 'chain',
  streak: 'streak',
  misleading: 'misleading',
  zen: 'zen',
  'zen-infinite': 'infinite',
  infinite: 'infinite',
  'word-500': 'notes',
  banned: 'banned',
  'memory-colors': 'memoryFlash',
  'memory-letters': 'memoryHide',
  locked: 'locked',
  reverse: 'reverse',
  blocked: 'blocked',
  spaces: 'spaces',
  'forced-letter': 'forced',
  doubles: 'doubles',
  'alternating-duet': 'dual',
  multi: 'multi',
}

const CLASSIC_PREFIXES = new Set(['classic', 'streak', 'zen', 'zen-infinite'])

/** Pins / fallback: derive accent from variant id prefix when section is unknown */
export function hubAccentForIdPrefix(idPrefix: string): HubAccent {
  if (idPrefix === 'multi') return 'r'
  if (CLASSIC_PREFIXES.has(idPrefix)) return 'g'
  return 'y'
}

export function hubAccentForSectionCategory(category: string): HubAccent {
  if (category === HUB_CATEGORY_CLASSIC) return 'g'
  if (category === HUB_CATEGORY_MULTI) return 'r'
  if (category === HUB_CATEGORY_VARIANTS) return 'y'
  return 'y'
}

/** Browse page section headings → card border accent */
const BROWSE_PAGE_CATEGORY_ACCENT: Record<string, HubAccent> = {
  Classic: 'g',
  Visibility: 'y',
  Constraints: 'y',
  'Board Mods': 'y',
  Puzzle: 'y',
  Multi: 'r',
}

export function hubAccentForBrowseCategory(category: string): HubAccent {
  return BROWSE_PAGE_CATEGORY_ACCENT[category] ?? 'y'
}

export function getHubModeTheme(modeKey: string, accent?: HubAccent): HubModeTheme {
  const tilePreset = MAP[modeKey] ?? 'wordle'
  const acc = accent ?? hubAccentForIdPrefix(modeKey)
  return { accent: acc, tilePreset }
}
