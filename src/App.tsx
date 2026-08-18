import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { FeedbackProvider } from './components/FeedbackProvider'
import { AppLayout } from './components/layout/AppLayout'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import { RequireAuth } from './auth/RequireAuth'
import BrowsePage from './pages/BrowsePage'
import CommunityPage from './pages/CommunityPage'
import MyVariantsPage from './pages/MyVariantsPage'
import CreatePage from './pages/CreatePage'
import MyHubPage from './pages/MyHubPage'
import SettingsPage from './pages/SettingsPage'
import { PlayPage } from './pages/PlayPage'
import BrowseSessionPlayPage from './pages/BrowseSessionPlayPage'
import CustomGameScreen from './pages/CustomGameScreen'
import './App.css'

function HomeRoute() {
  const { isLoggedIn } = useAuth()
  return isLoggedIn ? <MyHubPage /> : <Navigate to="/browse" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <FeedbackProvider>
      <AuthProvider>
      <div className="app-shell">
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomeRoute />} />
            <Route path="/browse" element={<BrowsePage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route
              path="/create"
              element={
                <RequireAuth mode="signup" intent="create">
                  <CreatePage />
                </RequireAuth>
              }
            />
            <Route
              path="/create/edit/:presetId"
              element={
                <RequireAuth mode="signup" intent="create">
                  <CreatePage />
                </RequireAuth>
              }
            />
            <Route
              path="/my-variants"
              element={
                <RequireAuth intent="create">
                  <MyVariantsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/settings"
              element={
                <RequireAuth intent="settings">
                  <SettingsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/play/my/:presetId"
              element={
                <RequireAuth intent="create">
                  <CustomGameScreen />
                </RequireAuth>
              }
            />
            <Route path="/play/browse-session" element={<BrowseSessionPlayPage />} />
            <Route path="/play/:variantId" element={<PlayPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </div>
      </AuthProvider>
      </FeedbackProvider>
    </BrowserRouter>
  )
}
