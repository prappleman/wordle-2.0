import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { HubPage } from './pages/HubPage'
import { PlayPage } from './pages/PlayPage'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<HubPage />} />
          <Route path="/play/:variantId" element={<PlayPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
