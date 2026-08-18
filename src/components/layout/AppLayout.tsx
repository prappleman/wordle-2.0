import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
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
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement>(null)
  const accountMenuId = useId()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { isLoggedIn, user, promptAuth, logout } = useAuth()
  const createNavActive = pathname === '/create' || pathname.startsWith('/create/')
  const browseNavActive = pathname === '/browse' || (!isLoggedIn && pathname === '/')
  const initial = user?.email?.charAt(0).toUpperCase() ?? '?'

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

  useEffect(() => {
    setAccountMenuOpen(false)
  }, [pathname, isLoggedIn])

  useEffect(() => {
    if (!accountMenuOpen) return
    function onPointerDown(e: PointerEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setAccountMenuOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [accountMenuOpen])

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

  function closeSidebar() {
    setSidebarOpen(false)
  }

  function onCreateClick() {
    closeSidebar()
    if (isLoggedIn) return
    promptAuth({ mode: 'signup', intent: 'create', redirectTo: '/create' })
  }

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
          <Link to="/" className="app-layout-brand" aria-label="Wordle hub — home">
            Wordle hub
          </Link>
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
            {isLoggedIn ? (
              <div className="app-layout-account" ref={accountMenuRef}>
                <button
                  type="button"
                  className="app-layout-profile-btn"
                  aria-label="Account menu"
                  aria-expanded={accountMenuOpen}
                  aria-haspopup="menu"
                  aria-controls={accountMenuOpen ? accountMenuId : undefined}
                  title={user?.email}
                  onClick={() => setAccountMenuOpen((o) => !o)}
                >
                  <span className="app-layout-profile-initial" aria-hidden>
                    {initial}
                  </span>
                </button>
                {accountMenuOpen && (
                  <div id={accountMenuId} className="app-layout-account-menu" role="menu">
                    <p className="app-layout-account-email">{user?.email}</p>
                    <button
                      type="button"
                      role="menuitem"
                      className="app-layout-account-item"
                      onClick={() => {
                        setAccountMenuOpen(false)
                        navigate('/settings')
                      }}
                    >
                      Settings
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="app-layout-account-item"
                      onClick={() => {
                        setAccountMenuOpen(false)
                        logout()
                      }}
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                className="app-layout-login-btn"
                onClick={() => promptAuth({ mode: 'login' })}
              >
                Log in
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="app-layout-body">
        <aside
          className={`app-layout-sidebar ${sidebarOpen ? 'app-layout-sidebar--open' : ''}`}
          aria-label="Sidebar"
        >
          <nav className="app-layout-sidebar-nav">
            {isLoggedIn && (
              <NavLink
                to="/"
                end
                className={({ isActive }) => (isActive ? 'active' : '')}
                onClick={closeSidebar}
              >
                My hub
              </NavLink>
            )}
            <NavLink
              to="/browse"
              className={() => (browseNavActive ? 'active' : '')}
              onClick={closeSidebar}
            >
              Browse variants
            </NavLink>
            {isLoggedIn ? (
              <NavLink
                to="/create"
                className={() => (createNavActive ? 'active' : '')}
                onClick={closeSidebar}
              >
                Create
              </NavLink>
            ) : (
              <button type="button" className="app-layout-nav-action" onClick={onCreateClick}>
                Create
              </button>
            )}
            {isLoggedIn && (
              <NavLink
                to="/settings"
                className={({ isActive }) => (isActive ? 'active' : '')}
                onClick={closeSidebar}
              >
                Settings
              </NavLink>
            )}
            <div className="app-layout-sidebar-divider" role="presentation" />
            <NavLink
              to="/community"
              className={({ isActive }) => (isActive ? 'active' : '')}
              onClick={closeSidebar}
            >
              Community
            </NavLink>
            {isLoggedIn && (
              <NavLink
                to="/my-variants"
                className={({ isActive }) => (isActive ? 'active' : '')}
                onClick={closeSidebar}
              >
                My variants
              </NavLink>
            )}
          </nav>
        </aside>
        {sidebarOpen && (
          <button
            type="button"
            className="app-layout-backdrop"
            aria-label="Close menu"
            onClick={closeSidebar}
          />
        )}
        <main className="app-layout-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
