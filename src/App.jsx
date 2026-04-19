import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useApp } from './contexts/AppContext.jsx'
import Login from './pages/Login.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Home from './pages/Home.jsx'
import Matchs from './pages/Matchs.jsx'
import Tennis from './pages/Tennis.jsx'
import PlayerDetail from './pages/PlayerDetail.jsx'
import Stats from './pages/Stats.jsx'
import AddBet from './pages/AddBet.jsx'
import Settings from './pages/Settings.jsx'
import BottomNav from './components/BottomNav.jsx'

export default function App() {
  const { isAuth, user } = useApp()
  const location = useLocation()

  if (!isAuth) return <Login />
  if (!user.onboardingDone) return <Onboarding />

  const hideNav = location.pathname === '/add-bet'

  return (
    <div className="min-h-screen bg-ink-900">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/matchs" element={<Matchs />} />
        <Route path="/tennis" element={<Tennis />} />
        <Route path="/players" element={<Tennis />} />
        <Route path="/tournaments" element={<Tennis />} />
        <Route path="/players/:name" element={<PlayerDetail />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/add-bet" element={<AddBet />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!hideNav && <BottomNav />}
    </div>
  )
}
