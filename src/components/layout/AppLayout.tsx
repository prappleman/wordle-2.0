import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import './AppLayout.css'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname } = useLocation()
  const createNavActive = pathname === '/create' || pathname.startsWith('/create/')

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
          <Link to="/" className="app-layout-brand">
            Wordle hub
          </Link>
          <nav className="app-layout-nav" aria-label="Main">
            <NavLink to="/" className={({ isActive }) => (isActive ? 'active' : '')} end>
              My hub
            </NavLink>
            <NavLink to="/browse" className={({ isActive }) => (isActive ? 'active' : '')}>
              Browse
            </NavLink>
            <NavLink to="/create" className={() => (createNavActive ? 'active' : '')}>
              Create
            </NavLink>
            <NavLink to="/community" className={({ isActive }) => (isActive ? 'active' : '')}>
              Community
            </NavLink>
            <NavLink to="/my-variants" className={({ isActive }) => (isActive ? 'active' : '')}>
              My variants
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => (isActive ? 'active' : '')}>
              Settings
            </NavLink>
          </nav>
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
