import React, { useMemo, useState } from 'react'
import TopBar from '../components/TopBar.jsx'
import BetCard from '../components/BetCard.jsx'
import Icon from '../components/Icon.jsx'
import { useApp } from '../contexts/AppContext.jsx'

const FILTERS = [
  { id: 'all', label: 'Tous' },
  { id: 'pending', label: 'En cours' },
  { id: 'won', label: 'Gagnés' },
  { id: 'lost', label: 'Perdus' },
  { id: 'live', label: 'Live' },
]

export default function Matchs() {
  const { user, settleBet, deleteBet } = useApp()
  const [filter, setFilter] = useState('all')

  const bets = useMemo(() => {
    let list = [...(user?.bets || [])].sort((a, b) => new Date(b.date) - new Date(a.date))
    if (filter === 'pending') list = list.filter(b => b.status === 'pending')
    else if (filter === 'won') list = list.filter(b => b.status === 'won')
    else if (filter === 'lost') list = list.filter(b => b.status === 'lost')
    else if (filter === 'live') list = list.filter(b => b.betType === 'live' || b.mode === 'live')
    return list
  }, [user, filter])

  const groups = useMemo(() => {
    const map = {}
    bets.forEach(b => {
      const d = new Date(b.date)
      const key = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
      if (!map[key]) map[key] = { label: key, date: d, items: [] }
      map[key].items.push(b)
    })
    return Object.values(map).sort((a, b) => b.date - a.date)
  }, [bets])

  return (
    <>
      <TopBar title="Mes matchs" />
      <div className="px-5 pt-2 pb-28">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-5 -mx-1 px-1">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`chip flex-shrink-0 ${filter === f.id ? 'active' : ''}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {groups.length === 0 ? (
          <div className="card p-8 text-center">
            <Icon name="match" size={40} color="muted" className="mx-auto mb-3" />
            <h3 className="h3 mb-1">Aucun pari</h3>
            <p className="body">Pas de pari dans cette catégorie.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map(g => (
              <div key={g.label}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="calendar-clock" size={14} color="muted" />
                  <h3 className="micro text-fg-3" style={{ fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {g.label}
                  </h3>
                  <div className="flex-1 h-px" style={{ background: 'var(--ink-600)' }} />
                  <span className="micro text-fg-3">{g.items.length}</span>
                </div>
                <div className="space-y-2">
                  {g.items.map(bet => (
                    <BetCard key={bet.id} bet={bet} onSettle={settleBet} onDelete={deleteBet} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
