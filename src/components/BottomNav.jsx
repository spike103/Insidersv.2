import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Icon from './Icon.jsx'

const items = [
  { path: '/', icon: 'dashboard', label: 'Mes paris' },
  { path: '/matchs', icon: 'match', label: 'Matchs' },
  { path: '/tennis', icon: 'crown', label: 'Tennis' },
  { path: '/stats', icon: 'chart_bar', label: 'Stats' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const path = location.pathname

  const isActive = (p) => {
    if (p === '/') return path === '/'
    if (p === '/tennis') return path.startsWith('/tennis') || path.startsWith('/players') || path.startsWith('/tournaments')
    return path.startsWith(p)
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 safe-bottom"
      style={{
        background: 'linear-gradient(to top, var(--ink-900) 75%, rgba(2,11,32,0.9) 92%, transparent 100%)',
        borderTop: '1px solid rgba(28, 51, 112, 0.6)',
      }}
    >
      <div className="relative flex items-center justify-around h-16 px-4 pt-2">
        {items.slice(0, 2).map((item) => <NavItem key={item.path} item={item} active={isActive(item.path)} onClick={() => navigate(item.path)} />)}
        <div style={{ width: 56 }} aria-hidden />
        {items.slice(2).map((item) => <NavItem key={item.path} item={item} active={isActive(item.path)} onClick={() => navigate(item.path)} />)}
        <button
          onClick={() => navigate('/add-bet')}
          aria-label="Ajouter un pari"
          className="absolute left-1/2 -translate-x-1/2 -top-6 w-14 h-14 rounded-full flex items-center justify-center"
          style={{
            background: 'var(--blue-500)',
            boxShadow: '0 0 30px rgba(41,98,255,0.7), 0 0 12px rgba(91, 131, 255, 0.5)',
          }}
        >
          <Icon name="add" size={26} color="white" />
        </button>
      </div>
    </nav>
  )
}

function NavItem({ item, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center justify-center gap-1 h-full"
    >
      <Icon
        name={item.icon}
        size={24}
        color={active ? 'blue' : 'white'}
        style={{ opacity: active ? 1 : 0.85 }}
      />
      <span
        className="micro"
        style={{
          color: 'var(--blue-500)', fontWeight: 600, fontSize: 10,
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
