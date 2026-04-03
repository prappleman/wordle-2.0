import type { HubPinGameExtras } from '../hub/types'

const DEF_MG = 6
const DEF_MSR = 1

/** Append non-default play overlays (same keys parsed by `useBrowsePlayConfig`). */
export function appendGameExtrasToPlayHref(href: string, extras?: HubPinGameExtras): string {
  if (!extras) return href
  const [path, qs] = href.split('?')
  const p = new URLSearchParams(qs ?? '')
  if (extras.maxGuesses != null && extras.maxGuesses !== DEF_MG) {
    p.set('mg', String(extras.maxGuesses))
  }
  if (extras.maxSessionRounds != null && extras.maxSessionRounds !== DEF_MSR) {
    p.set('msr', String(extras.maxSessionRounds))
  }
  if (extras.timeLimitSeconds != null) {
    p.set('tl', String(extras.timeLimitSeconds))
  }
  if (extras.allowNonDictionary) p.set('nd', '1')
  if (extras.lockRevealedGreens) p.set('lock', '1')
  if (extras.forbidAbsentLetters) p.set('fab', '1')
  if (extras.customWordOrder === 'sequential') p.set('cord', 'seq')
  if (extras.ladderAdvance === 'wrap') p.set('law', '1')
  const out = p.toString()
  return out ? `${path}?${out}` : path
}

export type BrowsePlayUrlConfig = {
  maxGuesses?: number
  maxSessionRounds?: number
  /** Parsed from `tl` when present. */
  timeLimitSeconds?: number
  allowNonDictionary?: boolean
  lockRevealedGreens?: boolean
  forbidAbsentLetters?: boolean
}

export function parseBrowsePlayConfig(search: string): BrowsePlayUrlConfig {
  const p = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const out: BrowsePlayUrlConfig = {}
  const mg = p.get('mg')
  if (mg != null && mg !== '') {
    const n = Number(mg)
    if (Number.isFinite(n) && n >= 1 && n <= 99) out.maxGuesses = n
  }
  const msr = p.get('msr')
  if (msr != null && msr !== '') {
    const n = Number(msr)
    if (Number.isFinite(n) && n >= 1 && n <= 999) out.maxSessionRounds = n
  }
  const tl = p.get('tl')
  if (tl != null && tl !== '') {
    const n = Number(tl)
    if (Number.isFinite(n) && n >= 5 && n <= 3600) out.timeLimitSeconds = n
  }
  if (p.get('nd') === '1') out.allowNonDictionary = true
  if (p.get('lock') === '1') out.lockRevealedGreens = true
  if (p.get('fab') === '1') out.forbidAbsentLetters = true
  return out
}
