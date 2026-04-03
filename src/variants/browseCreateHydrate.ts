import type { MergedBrowseGame } from './browseGameMerge'

/** Serialize merged browse rules into Create URL (read once, then stripped to browseKind/browseId only). */
export function buildCreateSearchFromMerged(browseBase: URLSearchParams, merged: MergedBrowseGame): string {
  const p = new URLSearchParams(browseBase.toString())
  p.set('fromBrowse', '1')
  p.set('wl', String(merged.wordLength))
  p.set('ld', merged.ladderEnabled ? '1' : '0')
  p.set('lo', String(merged.ladderLo))
  p.set('hi', String(merged.ladderHi))
  p.set('ladv', merged.ladderAdvance)
  p.set('mg', String(merged.maxGuesses))
  p.set('msr', String(merged.maxSessionRounds))
  if (merged.timeLimitSeconds != null) p.set('tl', String(merged.timeLimitSeconds))
  else p.delete('tl')
  p.set('ws', merged.wordSource)
  p.set('co', merged.customWordOrder)
  p.set('nd', merged.allowNonDictionary ? '1' : '0')
  p.set('lock', merged.lockRevealedGreens ? '1' : '0')
  p.set('fab', merged.forbidAbsentLetters ? '1' : '0')
  return p.toString()
}
