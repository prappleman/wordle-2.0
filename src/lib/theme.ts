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

export const THEME_CHANGE_EVENT = 'wordle-theme-change'

export function applyTheme(mode: ThemeMode): void {
  document.documentElement.dataset.theme = mode
  window.dispatchEvent(new CustomEvent<ThemeMode>(THEME_CHANGE_EVENT, { detail: mode }))
}
