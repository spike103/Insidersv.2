import React from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon.jsx'
import { useApp } from '../contexts/AppContext.jsx'

export default function TopBar({ title, showBack = false }) {
  const navigate = useNavigate()
  const { coins, notifications, user } = useApp()
  const hasNotif = notifications && notifications.length > 0
  const initial = (user?.pseudo || '?').slice(0, 1).toUpperCase()

  return (
    <header className="sticky top-0 z-40 bg-ink-900/95 backdrop-blur-xl safe-top">
      <div className="flex items-center justify-between px-5 h-16">
        <div className="flex items-center gap-2" style={{ minWidth: 60 }}>
          {showBack ? (
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--ink-800)' }}>
              <Icon name="chevron_left" size={18} />
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <Icon name="crown" size={22} color="gold" />
              <span style={{ fontWeight: 800, fontSize: 17 }}>{coins || 0}</span>
            </div>
          )}
        </div>

        <button
          className="community-pill"
          style={{ fontSize: 14, fontWeight: 800, letterSpacing: '0.1em', padding: '10px 22px' }}
          onClick={() => navigate('/settings')}
        >
          INSIDERS
        </button>

        <div className="flex items-center gap-3" style={{ minWidth: 60, justifyContent: 'flex-end' }}>
          <button onClick={() => navigate('/notifications')} className="w-9 h-9 flex items-center justify-center relative" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <Icon name={hasNotif ? 'bell-notification' : 'bell'} size={22} />
          </button>
          <button onClick={() => navigate('/settings')} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2962ff, #5b83ff)', fontSize: 13, fontWeight: 700, color: 'white', border: 'none', cursor: 'pointer' }}>
            {initial}
          </button>
        </div>
      </div>
      {title && (
        <div className="px-5 pb-3">
          <h1 className="h1">{title}</h1>
        </div>
      )}
    </header>
  )
}
