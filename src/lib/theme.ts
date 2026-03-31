export const THEME_STORAGE_KEY = 'wordle-theme'

export type ThemeMode = 'dark' | 'light'

export function readStoredTheme(): ThemeMode {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY)
    if (v === 'light' || v === 'dark') return v
  } catch {
    /* ignore */
  }
  return 'dark'
}

export function applyTheme(mode: ThemeMode): void {
  document.documentElement.dataset.theme = mode
}
