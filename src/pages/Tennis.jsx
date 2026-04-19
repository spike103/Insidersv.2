import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import Icon from '../components/Icon.jsx'
import { useApp } from '../contexts/AppContext.jsx'
import { TOURNAMENTS, tournamentsByMonth } from '../data/tournaments.js'
import { totalProfit, computeROI, formatCurrencyPrecise, formatPercent } from '../utils/stats.js'

export default function Tennis() {
  const [tab, setTab] = useState('players')
  return (
    <>
      <TopBar />
      <div className="px-5 pt-2 pb-28">
        <div className="segmented mb-5">
          <button onClick={() => setTab('players')} className={`seg-btn ${tab === 'players' ? 'active' : ''}`}>
            <Icon name="incognito" size={16} color={tab === 'players' ? 'white' : 'white'} />
            Joueurs
          </button>
          <button onClick={() => setTab('tournaments')} className={`seg-btn ${tab === 'tournaments' ? 'active' : ''}`}>
            <Icon name="crown" size={16} color={tab === 'tournaments' ? 'white' : 'white'} />
            Tournois
          </button>
        </div>
        {tab === 'players' ? <PlayersTab /> : <TournamentsTab />}
      </div>
    </>
  )
}

function PlayersTab() {
  const navigate = useNavigate()
  const { user, allPlayers } = useApp()
  const [search, setSearch] = useState('')
  const [tour, setTour] = useState('all')
  const bets = user?.bets || []

  const statsByPlayer = useMemo(() => {
    const map = {}
    bets.forEach(b => (b.players || []).forEach(p => {
      if (!map[p]) map[p] = []
      map[p].push(b)
    }))
    return map
  }, [bets])

  const list = useMemo(() => {
    let l = [...allPlayers]
    if (tour !== 'all') l = l.filter(p => p.tour === tour)
    if (search.trim()) {
      const q = search.toLowerCase()
      l = l.filter(p => p.name.toLowerCase().includes(q))
    }
    return l.sort((a, b) => {
      const aBets = (statsByPlayer[a.name] || []).length
      const bBets = (statsByPlayer[b.name] || []).length
      if (aBets !== bBets) return bBets - aBets
      return (a.rank || 999) - (b.rank || 999)
    })
  }, [allPlayers, tour, search, statsByPlayer])

  return (
    <>
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Rechercher un joueur"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingRight: 44 }}
        />
        <Icon name="incognito" size={20} className="absolute right-4 top-1/2 -translate-y-1/2" color="muted" />
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
        {[{ id: 'all', label: 'Tous' }, { id: 'ATP', label: 'ATP' }, { id: 'WTA', label: 'WTA' }].map(t => (
          <button key={t.id} onClick={() => setTour(t.id)} className={`chip ${tour === t.id ? 'active' : ''}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {list.map(p => {
          const pBets = statsByPlayer[p.name] || []
          const profit = totalProfit(pBets)
          const roi = computeROI(pBets)
          const initials = p.name.split(' ').map((s, i) => i === 0 ? s[0] + '.' : s).join('')
          return (
            <button
              key={p.id}
              onClick={() => navigate(`/players/${encodeURIComponent(p.name)}`)}
              className="card w-full p-3 flex items-center gap-3 text-left"
            >
              <div className="w-10 h-10 rounded-full bg-ink-700 flex items-center justify-center text-xl flex-shrink-0">
                {p.flag || '🌍'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="pill-label text-blue" style={{ fontSize: 14 }}>{initials}</span>
                  {p.favorite && <Icon name="sparkle" size={12} color="gold" />}
                  {p.custom && <span className="micro text-fg-3" style={{ fontStyle: 'italic' }}>perso</span>}
                </div>
                <div className="micro text-fg-3 mt-0.5">
                  {p.tour}{p.rank ? ` · #${p.rank}` : ''} · {p.country}
                </div>
              </div>
              {pBets.length > 0 ? (
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold" style={{ color: profit >= 0 ? 'var(--win-500)' : 'var(--loss-500)' }}>
                    {formatCurrencyPrecise(profit)}
                  </div>
                  <div className="micro text-fg-3">
                    {pBets.length} pari{pBets.length > 1 ? 's' : ''} · {formatPercent(roi)}
                  </div>
                </div>
              ) : (
                <Icon name="chevron_right" size={16} color="muted" />
              )}
            </button>
          )
        })}
      </div>
    </>
  )
}

function TournamentsTab() {
  const [search, setSearch] = useState('')
  const grouped = useMemo(() => {
    const all = tournamentsByMonth()
    if (!search.trim()) return all
    const q = search.toLowerCase()
    return all
      .map(g => ({ ...g, items: g.items.filter(t => t.name.toLowerCase().includes(q) || t.city.toLowerCase().includes(q)) }))
      .filter(g => g.items.length > 0)
  }, [search])

  return (
    <>
      <div className="relative mb-5">
        <input
          type="text"
          placeholder="Rechercher un tournoi"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingRight: 44 }}
        />
        <Icon name="incognito" size={20} className="absolute right-4 top-1/2 -translate-y-1/2" color="muted" />
      </div>

      <div className="space-y-6">
        {grouped.map(g => (
          <div key={g.month}>
            <div className="flex items-baseline gap-2 mb-3">
              <h2 className="h2">{g.label}</h2>
              <span className="caption">({g.items.length} événement{g.items.length > 1 ? 's' : ''})</span>
            </div>
            <div className="space-y-2">
              {g.items.map((t, idx) => <TournamentRow key={t.id} tournament={t} index={idx + 1} />)}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function TournamentRow({ tournament: t, index }) {
  const prestige = t.isPrestige
  return (
    <div className={prestige ? 'card-gold' : 'card'} style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ fontWeight: 700, fontSize: 20, minWidth: 36, color: prestige ? '#1a0f00' : 'var(--fg-1)' }}>#{index}</div>
      <div
        className="rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          width: 40, height: 40,
          background: prestige ? 'rgba(255,255,255,0.35)' : 'var(--ink-700)',
          fontSize: 18,
        }}
      >
        {t.flag}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="pill-label truncate"
          style={{
            fontSize: 15,
            color: prestige ? '#1a0f00' : 'var(--blue-500)',
          }}
        >
          {t.name}
        </div>
        <div
          className="caption"
          style={{ color: prestige ? '#3d2a00' : 'var(--fg-3)' }}
        >
          {t.category} · {t.dates}
        </div>
      </div>
    </div>
  )
}
