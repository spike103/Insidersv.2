import React from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon.jsx'

export default function TopBar({ title, showBack = false, coins = 42 }) {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-40 bg-ink-900/95 backdrop-blur-xl safe-top">
      <div className="flex items-center justify-between px-5 h-16">
        <div className="flex items-center gap-2" style={{ minWidth: 60 }}>
          {showBack ? (
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-elev flex items-center justify-center" style={{ background: 'var(--ink-800)' }}>
              <Icon name="chevron_left" size={18} />
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <Icon name="crown" size={22} color="gold" />
              <span style={{ fontWeight: 700, fontSize: 16 }}>{coins}</span>
            </div>
          )}
        </div>

        <button className="community-pill">INSIDERS</button>

        <div className="flex items-center gap-3" style={{ minWidth: 60, justifyContent: 'flex-end' }}>
          <button onClick={() => navigate('/settings?tab=alerts')} className="w-9 h-9 flex items-center justify-center relative">
            <Icon name="bell-notification" size={22} />
          </button>
          <button onClick={() => navigate('/settings')} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2962ff, #5b83ff)', fontSize: 12, fontWeight: 700 }}>
            <Icon name="user" size={16} />
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
