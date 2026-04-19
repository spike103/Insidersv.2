import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Icon from './Icon.jsx'

// Icône balle de tennis custom
function TennisBall({ size = 24, color = 'white', active = false }) {
  const stroke = active ? '#2962ff' : color
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: active ? 1 : 0.85 }}>
      <circle cx="12" cy="12" r="10" />
      <path d="M5.2 5.2c2.3 1.5 4 4.1 4 7s-1.7 5.5-4 7" />
      <path d="M18.8 5.2c-2.3 1.5-4 4.1-4 7s1.7 5.5 4 7" />
    </svg>
  )
}

const items = [
  { path: '/', key: 'bets', icon: 'dashboard', label: 'Mes paris' },
  { path: '/matchs', key: 'matchs', icon: 'match', label: 'Matchs' },
  { path: '/tennis', key: 'tennis', icon: 'tennis-ball', label: 'Tennis' },
  { path: '/stats', key: 'stats', icon: 'chart_bar', label: 'Stats' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const path = location.pathname

  const isActive = (item) => {
    if (item.path === '/') return path === '/'
    if (item.path === '/tennis') return path.startsWith('/tennis') || path.startsWith('/players') || path.startsWith('/tournaments')
    return path.startsWith(item.path)
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 safe-bottom"
      style={{
        background: 'linear-gradient(to top, var(--ink-900) 75%, rgba(2,11,32,0.9) 92%, transparent 100%)',
        borderTop: '1px solid rgba(28, 51, 112, 0.6)',
      }}
    >
      <div className="relative flex items-center h-16 px-2 pt-2">
        {items.slice(0, 2).map((item) => <NavItem key={item.key} item={item} active={isActive(item)} onClick={() => navigate(item.path)} />)}
        <div style={{ flex: 1 }} aria-hidden />
        {items.slice(2).map((item) => <NavItem key={item.key} item={item} active={isActive(item)} onClick={() => navigate(item.path)} />)}

        <button
          onClick={() => navigate('/add-bet')}
          aria-label="Ajouter un pari"
          className="absolute left-1/2 -top-5 flex items-center justify-center"
          style={{
            width: 56, height: 56, borderRadius: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--blue-500)',
            boxShadow: '0 0 24px rgba(41,98,255,0.6), 0 6px 16px rgba(41,98,255,0.35)',
            border: 'none', cursor: 'pointer',
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    </nav>
  )
}

function NavItem({ item, active, onClick }) {
  const iconColor = active ? 'blue' : 'white'
  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center justify-center gap-1 h-full"
      style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
    >
      {item.icon === 'tennis-ball'
        ? <TennisBall size={24} active={active} />
        : <Icon name={item.icon} size={24} color={iconColor} style={{ opacity: active ? 1 : 0.85 }} />
      }
      <span
        style={{
          color: 'var(--blue-500)',
          fontWeight: 600, fontSize: 10,
          opacity: active ? 1 : 0,
          height: 12,
          transition: 'opacity 180ms',
        }}
      >
        {item.label}
      </span>
    </button>
  )
}
