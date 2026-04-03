import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { FeedbackProvider } from './components/FeedbackProvider'
import { AppLayout } from './components/layout/AppLayout'
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

export default function App() {
  return (
    <BrowserRouter>
      <FeedbackProvider>
      <div className="app-shell">
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<MyHubPage />} />
            <Route path="/browse" element={<BrowsePage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/create" element={<CreatePage />} />
            <Route path="/create/edit/:presetId" element={<CreatePage />} />
            <Route path="/my-variants" element={<MyVariantsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="/play/my/:presetId" element={<CustomGameScreen />} />
          <Route path="/play/browse-session" element={<BrowseSessionPlayPage />} />
          <Route path="/play/:variantId" element={<PlayPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      </FeedbackProvider>
    </BrowserRouter>
  )
}
