/** Registry omits doubles-1; keep add UI aligned. */
export function isWordLengthAllowedForPrefix(idPrefix: string, wordLength: number): boolean {
  if (idPrefix === 'doubles' && wordLength < 2) return false
  return true
}
