import { useEffect, useId, useState } from 'react'
import {
  COLORBLIND_STORAGE_KEY,
  applyColorblind,
  palettePreviewHex,
  readStoredColorblind,
  type ColorblindMode,
} from '../lib/colorblind'
import { THEME_STORAGE_KEY, applyTheme, readStoredTheme, type ThemeMode } from '../lib/theme'
import './SettingsPage.css'

const THEME_OPTIONS: { value: ThemeMode; label: string; hint: string }[] = [
  { value: 'dark', label: 'Dark', hint: 'Default charcoal shell and high-contrast tiles.' },
  { value: 'light', label: 'Light', hint: 'Bright chrome UI; tile feedback stays saturated.' },
]

const PALETTE_OPTIONS: { value: ColorblindMode; label: string; hint: string }[] = [
  { value: 'default', label: 'Default', hint: 'Classic Wordle greens, yellows, and grays.' },
  {
    value: 'red-green',
    label: 'Red–green colorblind',
    hint:
      'Correct tiles use blue instead of green (helps protanopia and deuteranopia). Yellow present and gray absent stay familiar.',
  },
]

export default function SettingsPage() {
  const themeGroupId = useId()
  const paletteGroupId = useId()
  const [theme, setTheme] = useState<ThemeMode>(() => readStoredTheme())
  const [colorblind, setColorblind] = useState<ColorblindMode>(() => readStoredColorblind())
  const preview = palettePreviewHex(colorblind, theme)

  useEffect(() => {
    applyTheme(theme)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  useEffect(() => {
    applyColorblind(colorblind)
    try {
      localStorage.setItem(COLORBLIND_STORAGE_KEY, colorblind)
    } catch {
      /* ignore */
    }
  }, [colorblind])

  return (
    <div className="settings-page">
      <h1 className="settings-page-title">Settings</h1>
      <p className="settings-page-lead">
        Global preferences will live here. Shortcuts and play options are still stored per item in{' '}
        <strong>My hub</strong> (browser local storage).
      </p>

      <section className="settings-page-section" aria-labelledby={themeGroupId}>
        <h2 id={themeGroupId} className="settings-page-h2">
          Appearance
        </h2>
        <p className="settings-page-p settings-page-p--tight">Shell, navigation, and page background.</p>
        <fieldset className="settings-colorblind-fieldset">
          <legend className="settings-colorblind-legend">Theme</legend>
          <div className="settings-colorblind-options">
            {THEME_OPTIONS.map((opt) => (
              <label key={opt.value} className="settings-colorblind-option">
                <input
                  type="radio"
                  name="theme"
                  value={opt.value}
                  checked={theme === opt.value}
                  onChange={() => setTheme(opt.value)}
                />
                <span className="settings-colorblind-option-text">
                  <span className="settings-colorblind-option-label">{opt.label}</span>
                  <span className="settings-colorblind-option-hint">{opt.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="settings-page-section" aria-labelledby={paletteGroupId}>
        <h2 id={paletteGroupId} className="settings-page-h2">
          Color vision
        </h2>
        <p className="settings-page-p settings-page-p--tight">
          Tile and keyboard <strong>correct</strong>, <strong>present</strong>, and <strong>absent</strong>{' '}
          colors (plus Word 500 “wrong letter” red) update across the site.
        </p>
        <p className="settings-preview-caption">Correct · Present · Absent · Wrong (Word 500)</p>
        <div className="settings-feedback-preview" aria-hidden>
          <span className="settings-swatch settings-swatch--correct" style={{ background: preview.correct }} />
          <span className="settings-swatch settings-swatch--present" style={{ background: preview.present }} />
          <span className="settings-swatch settings-swatch--absent" style={{ background: preview.absent }} />
          <span className="settings-swatch settings-swatch--red" style={{ background: preview.red }} />
        </div>
        <fieldset className="settings-colorblind-fieldset">
          <legend className="settings-colorblind-legend">Palette</legend>
          <div className="settings-colorblind-options">
            {PALETTE_OPTIONS.map((opt) => (
              <label key={opt.value} className="settings-colorblind-option">
                <input
                  type="radio"
                  name="colorblind"
                  value={opt.value}
                  checked={colorblind === opt.value}
                  onChange={() => setColorblind(opt.value)}
                />
                <span className="settings-colorblind-option-text">
                  <span className="settings-colorblind-option-label">{opt.label}</span>
                  <span className="settings-colorblind-option-hint">{opt.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="settings-page-section" aria-labelledby="settings-about">
        <h2 id="settings-about" className="settings-page-h2">
          About
        </h2>
        <p className="settings-page-p">
          Wordle hub — pick a variant, tune letter count and ladder mode when you add a shortcut, then
          play from My hub.
        </p>
      </section>
    </div>
  )
}
