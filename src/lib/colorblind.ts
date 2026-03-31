export const COLORBLIND_STORAGE_KEY = 'wordle-colorblind'

/** `red-green`: protanopia / deuteranopia — correct (green) → blue for clearer distinction */
export type ColorblindMode = 'default' | 'red-green'

/** Matches `index.css` — used for Settings previews only */
export const COLORBLIND_FEEDBACK_HEX: Record<
  ColorblindMode,
  { correct: string; present: string; absent: string; red: string }
> = {
  default: {
    correct: '#6aaa64',
    present: '#d9a527',
    absent: '#4a4a4e',
    red: '#e05555',
  },
  'red-green': {
    correct: '#3b82f6',
    present: '#d9a527',
    absent: '#6b7280',
    red: '#ef4444',
  },
}

/** Matches `index.css` light theme — Settings swatches only */
export const COLORBLIND_FEEDBACK_HEX_LIGHT: Record<
  ColorblindMode,
  { correct: string; present: string; absent: string; red: string }
> = {
  default: {
    correct: '#5a9f5a',
    present: '#d9a527',
    absent: '#787c7e',
    red: '#dc2626',
  },
  'red-green': {
    correct: '#2563eb',
    present: '#b45309',
    absent: '#64748b',
    red: '#ef4444',
  },
}

export function palettePreviewHex(
  mode: ColorblindMode,
  theme: 'dark' | 'light',
): { correct: string; present: string; absent: string; red: string } {
  return theme === 'light' ? COLORBLIND_FEEDBACK_HEX_LIGHT[mode] : COLORBLIND_FEEDBACK_HEX[mode]
}

const LEGACY_TO_RED_GREEN = new Set(['protanopia', 'deuteranopia', 'tritanopia'])

export function readStoredColorblind(): ColorblindMode {
  try {
    const v = localStorage.getItem(COLORBLIND_STORAGE_KEY)
    if (v === 'red-green') return 'red-green'
    if (v && LEGACY_TO_RED_GREEN.has(v)) return 'red-green'
  } catch {
    /* ignore */
  }
  return 'default'
}

export function applyColorblind(mode: ColorblindMode): void {
  if (mode === 'default') {
    document.documentElement.removeAttribute('data-colorblind')
  } else {
    document.documentElement.dataset.colorblind = mode
  }
}
