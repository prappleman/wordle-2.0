import type { LadderAdvanceMode } from './ladderRange'
import { clampLadderLength } from './ladderRange'
import { wordsForLength } from './variantWordLength'

export const CUSTOM_PRESET_STORAGE_KEY = 'wordle-custom-presets'
export const MAX_CUSTOM_WORDS = 500
export const MAX_CUSTOM_WORD_LIST_CHARS = 50_000

export type CustomWordSource = 'dictionary' | 'custom'
export type CustomWordOrder = 'sequential' | 'random'

export interface CustomGamePreset {
  id: string
  name: string
  /** ISO date for display / sort */
  updatedAt: string
  wordLength: number
  maxGuesses: number
  wordSource: CustomWordSource
  /** Normalized uppercase words, each 2–12 letters (may mix lengths; pools are filtered by round length). */
  customWords: string[]
  allowNonDictionary: boolean
  customWordOrder: CustomWordOrder
  ladderEnabled: boolean
  ladderLo: number
  ladderHi: number
  ladderMode: LadderAdvanceMode
  /**
   * How many words to play in one session when ladder is off (same length each time).
   * When ladder is on, each rung is one round until ladder ends or this cap is hit (whichever first).
   */
  maxSessionRounds: number
  timeLimitSeconds: number | null
  lockRevealedGreens: boolean
  forbidAbsentLetters: boolean
}

export function defaultCustomPreset(): CustomGamePreset {
  const now = new Date().toISOString()
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `preset-${now}-${Math.random().toString(36).slice(2, 9)}`,
    name: 'My custom game',
    updatedAt: now,
    wordLength: 5,
    maxGuesses: 6,
    wordSource: 'dictionary',
    customWords: [],
    allowNonDictionary: false,
    customWordOrder: 'random',
    ladderEnabled: false,
    ladderLo: 3,
    ladderHi: 7,
    ladderMode: 'stop',
    maxSessionRounds: 1,
    timeLimitSeconds: null,
    lockRevealedGreens: false,
    forbidAbsentLetters: false,
  }
}

export type PresetValidation = { ok: true } | { ok: false; message: string }

/** Allowed length for each custom word (after stripping non-letters). */
export function isCustomWordLengthOk(len: number): boolean {
  const n = clampLadderLength(len)
  return n === len && len >= 2 && len <= 12
}

/**
 * Normalize textarea lines into uppercase words; keep unique words with length 2–12.
 */
export function parseCustomWordLines(text: string): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const line of text.split(/\r?\n/)) {
    const w = line.trim().toUpperCase().replace(/[^A-Z]/g, '')
    if (!isCustomWordLengthOk(w.length)) continue
    if (seen.has(w)) continue
    seen.add(w)
    out.push(w)
    if (out.length >= MAX_CUSTOM_WORDS) break
  }
  return out
}

function ladderSpanLengths(lo: number, hi: number): number[] {
  const a = Math.min(lo, hi)
  const b = Math.max(lo, hi)
  const out: number[] = []
  for (let i = a; i <= b; i++) out.push(i)
  return out
}

export function validateCustomPreset(p: CustomGamePreset): PresetValidation {
  if (!p.name.trim()) return { ok: false, message: 'Name is required.' }
  const wl = clampLadderLength(p.wordLength)
  if (wl !== p.wordLength) return { ok: false, message: 'Word length must be 2–12.' }
  if (p.maxGuesses < 1 || p.maxGuesses > 99) return { ok: false, message: 'Guesses must be between 1 and 99.' }
  if (p.maxSessionRounds < 1 || p.maxSessionRounds > 999) return { ok: false, message: 'Session rounds must be 1–999.' }

  const lo = clampLadderLength(p.ladderLo)
  const hi = clampLadderLength(p.ladderHi)
  if (p.ladderEnabled && lo === hi && p.ladderMode === 'stop') {
    /* single rung ok */
  }

  if (p.wordSource === 'custom') {
    if (p.customWords.length === 0) return { ok: false, message: 'Add at least one custom word (2–12 letters each).' }
    for (const w of p.customWords) {
      if (!isCustomWordLengthOk(w.length)) {
        return { ok: false, message: 'Each custom word must be 2–12 letters.' }
      }
    }
    if (!p.ladderEnabled) {
      if (!p.customWords.some((w) => w.length === p.wordLength)) {
        return {
          ok: false,
          message: `Include at least one word of length ${p.wordLength} (your current word length), or change word length.`,
        }
      }
    } else {
      const lo = Math.min(p.ladderLo, p.ladderHi)
      const hi = Math.max(p.ladderLo, p.ladderHi)
      for (const L of ladderSpanLengths(lo, hi)) {
        if (!p.customWords.some((w) => w.length === L)) {
          return {
            ok: false,
            message: `Add at least one word of length ${L} for the ladder (lengths ${lo}–${hi}).`,
          }
        }
      }
    }
  }

  if (p.timeLimitSeconds != null && (p.timeLimitSeconds < 5 || p.timeLimitSeconds > 3600)) {
    return { ok: false, message: 'Time limit must be 5–3600 seconds, or off.' }
  }

  return { ok: true }
}

export function wordsForPresetLength(preset: CustomGamePreset, length: number): readonly string[] {
  if (preset.wordSource === 'dictionary') return wordsForLength(length)
  return preset.customWords.filter((w) => w.length === length).map((w) => w.toUpperCase())
}

/** Next target for a session round; sequential order uses `roundIndex` into the filtered pool. */
export function pickTargetWord(
  preset: CustomGamePreset,
  pool: readonly string[],
  roundIndex: number,
): string {
  if (pool.length === 0) throw new Error('No words available for this length.')
  if (preset.wordSource === 'dictionary' || preset.customWordOrder === 'random') {
    return pool[Math.floor(Math.random() * pool.length)]!
  }
  return pool[roundIndex % pool.length]!
}

export function normalizePreset(p: CustomGamePreset): CustomGamePreset {
  return {
    ...p,
    name: p.name.trim(),
    wordLength: clampLadderLength(p.wordLength),
    ladderLo: clampLadderLength(p.ladderLo),
    ladderHi: clampLadderLength(p.ladderHi),
    customWords: p.customWords
      .map((w) => w.toUpperCase().replace(/[^A-Z]/g, ''))
      .filter((w) => isCustomWordLengthOk(w.length)),
  }
}
