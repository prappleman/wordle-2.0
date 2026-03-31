import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applyColorblind, readStoredColorblind } from './lib/colorblind'
import { applyTheme, readStoredTheme } from './lib/theme'

applyTheme(readStoredTheme())
applyColorblind(readStoredColorblind())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
