import { useCallback, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  applyTheme,
  readStoredTheme,
  THEME_CHANGE_EVENT,
  THEME_STORAGE_KEY,
  type ThemeMode,
} from '../../lib/theme'
import './AppLayout.css'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [theme, setTheme] = useState<ThemeMode>(() => readStoredTheme())
  const { pathname } = useLocation()
  const createNavActive = pathname === '/create' || pathname.startsWith('/create/')

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    const onThemeChange = (e: Event) => {
      const ce = e as CustomEvent<ThemeMode>
      const m = ce.detail
      if (m === 'light' || m === 'dark') setTheme(m)
    }
    window.addEventListener(THEME_CHANGE_EVENT, onThemeChange)
    return () => window.removeEventListener(THEME_CHANGE_EVENT, onThemeChange)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: ThemeMode = prev === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next)
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  return (
    <div className="app-layout">
      <header className="app-layout-header">
        <div className="app-layout-header-inner">
          <button
            type="button"
            className="app-layout-menu-btn"
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen((o) => !o)}
          >
            <span className="app-layout-menu-icon" aria-hidden>
              ☰
            </span>
          </button>
          <button
            type="button"
            className="app-layout-brand"
            onClick={() => window.location.reload()}
            title="Refresh this page"
            aria-label="Wordle hub — refresh page"
          >
            Wordle hub
          </button>
          <div className="app-layout-header-actions">
            <button
              type="button"
              className="app-layout-theme-btn"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
            >
              <span className="app-layout-theme-icon" aria-hidden>
                {theme === 'dark' ? '☀' : '☾'}
              </span>
            </button>
            <div
              className="app-layout-profile-placeholder"
              aria-label="Profile photo (coming soon)"
              title="Profile (coming soon)"
            />
          </div>
        </div>
      </header>

      <div className="app-layout-body">
        <aside
          className={`app-layout-sidebar ${sidebarOpen ? 'app-layout-sidebar--open' : ''}`}
          aria-label="Sidebar"
        >
          <nav className="app-layout-sidebar-nav">
            <NavLink
              to="/"
              end
              className={({ isActive }) => (isActive ? 'active' : '')}
              onClick={() => setSidebarOpen(false)}
            >
              My hub
            </NavLink>
            <NavLink
              to="/browse"
              className={({ isActive }) => (isActive ? 'active' : '')}
              onClick={() => setSidebarOpen(false)}
            >
              Browse variants
            </NavLink>
            <NavLink
              to="/create"
              className={() => (createNavActive ? 'active' : '')}
              onClick={() => setSidebarOpen(false)}
            >
              Create
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) => (isActive ? 'active' : '')}
              onClick={() => setSidebarOpen(false)}
            >
              Settings
            </NavLink>
            <div className="app-layout-sidebar-divider" role="presentation" />
            <NavLink
              to="/community"
              className={({ isActive }) => (isActive ? 'active' : '')}
              onClick={() => setSidebarOpen(false)}
            >
              Community
            </NavLink>
            <NavLink
              to="/my-variants"
              className={({ isActive }) => (isActive ? 'active' : '')}
              onClick={() => setSidebarOpen(false)}
            >
              My variants
            </NavLink>
          </nav>
        </aside>
        {sidebarOpen && (
          <button
            type="button"
            className="app-layout-backdrop"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <main className="app-layout-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
