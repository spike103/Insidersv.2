import React, { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import Icon from '../components/Icon.jsx'
import BetCard from '../components/BetCard.jsx'
import { useApp } from '../contexts/AppContext.jsx'
import { TOURNAMENTS } from '../data/tournaments.js'
import {
  totalProfit, computeROI, computeWinRate,
  formatCurrencyPrecise, formatPercent,
} from '../utils/stats.js'

export default function PlayerDetail() {
  const { name } = useParams()
  const navigate = useNavigate()
  const { user, findPlayer, settleBet, deleteBet } = useApp()
  const decodedName = decodeURIComponent(name || '')
  const player = findPlayer(decodedName)
  const bets = useMemo(() => (user?.bets || []).filter(b => (b.players || []).includes(decodedName)),
    [user, decodedName])

  const stats = useMemo(() => ({
    profit: totalProfit(bets),
    roi: computeROI(bets),
    winRate: computeWinRate(bets),
    count: bets.length,
    settled: bets.filter(b => b.status !== 'pending').length,
    wins: bets.filter(b => b.status === 'won').length,
    losses: bets.filter(b => b.status === 'lost').length,
  }), [bets])

  // Stats par tournoi
  const byTournament = useMemo(() => {
    const map = {}
    bets.forEach(b => {
      const key = b.tournamentId || 'other'
      if (!map[key]) map[key] = []
      map[key].push(b)
    })
    return Object.entries(map).map(([tid, list]) => {
      const t = TOURNAMENTS.find(x => x.id === tid)
      return {
        tournament: t || { name: 'Autre', flag: '🎾', category: '—' },
        bets: list,
        profit: totalProfit(list),
        roi: computeROI(list),
        count: list.length,
      }
    }).sort((a, b) => b.profit - a.profit)
  }, [bets])

  if (!player) {
    return (
      <>
        <TopBar showBack />
        <div className="px-5 pt-4 pb-24 text-center">
          <div className="card p-6">
            <p className="body">Joueur introuvable.</p>
          </div>
        </div>
      </>
    )
  }

  const initials = player.name.split(' ').map((s, i) => i === 0 ? s[0] + '.' : s).join('')

  return (
    <>
      <TopBar showBack />
      <div className="px-5 pt-2 pb-28">
        {/* Hero profil */}
        <div className="card p-5 mb-4 animate-fade-in">
          <div className="flex items-center gap-4">
            <div
              className="rounded-full flex items-center justify-center flex-shrink-0"
              style={{ width: 64, height: 64, background: 'var(--ink-700)', fontSize: 32 }}
            >
              {player.flag || '🌍'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="pill-label text-blue" style={{ fontSize: 18 }}>{initials}</div>
              <div className="h3 mt-1 truncate">{player.name}</div>
              <div className="caption mt-1">
                {player.tour}{player.rank ? ` · #${player.rank} mondial` : ''} · {player.bestSurface}
                {player.custom && ' · Perso'}
              </div>
            </div>
          </div>
        </div>

        {bets.length === 0 ? (
          <div className="card p-8 text-center animate-fade-in">
            <Icon name="sparkle" size={32} color="muted" className="mx-auto mb-3" />
            <p className="body" style={{ color: 'var(--fg-1)' }}>Aucun pari enregistré sur ce joueur.</p>
            <p className="caption mt-1">Ajoute ton premier pari pour commencer à suivre tes stats.</p>
            <button onClick={() => navigate('/add-bet')} className="btn-primary mt-4" style={{ width: 'auto', padding: '10px 18px' }}>
              Ajouter un pari
            </button>
          </div>
        ) : (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 gap-2 mb-4 animate-fade-in">
              <StatCard label="Profit total" value={formatCurrencyPrecise(stats.profit)} positive={stats.profit >= 0} />
              <StatCard label="ROI" value={formatPercent(stats.roi)} positive={stats.roi >= 0} />
              <StatCard label="Paris" value={stats.count.toString()} neutral />
              <StatCard label="% réussis" value={`${stats.winRate.toFixed(0)}%`} positive={stats.winRate >= 50} />
            </div>

            <div className="card p-4 mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="field-label" style={{ marginBottom: 0 }}>Bilan</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 text-center">
                  <div className="stat-value" style={{ color: 'var(--win-500)', fontSize: 22 }}>{stats.wins}</div>
                  <div className="micro text-fg-3">gagnés</div>
                </div>
                <div className="flex-1 text-center">
                  <div className="stat-value" style={{ color: 'var(--loss-500)', fontSize: 22 }}>{stats.losses}</div>
                  <div className="micro text-fg-3">perdus</div>
                </div>
                <div className="flex-1 text-center">
                  <div className="stat-value" style={{ fontSize: 22 }}>{stats.count - stats.settled}</div>
                  <div className="micro text-fg-3">en cours</div>
                </div>
              </div>
            </div>

            {/* Tournois */}
            <h2 className="h3 mb-3">Tournois</h2>
            <div className="space-y-2 mb-6">
              {byTournament.map((t, i) => (
                <div key={i} className="card p-3 flex items-center gap-3">
                  <div
                    className="rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ width: 36, height: 36, background: 'var(--ink-700)', fontSize: 16 }}
                  >
                    {t.tournament.flag}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="h3 truncate" style={{ fontSize: 14 }}>{t.tournament.name}</div>
                    <div className="micro text-fg-3">{t.count} pari{t.count > 1 ? 's' : ''} · {t.tournament.category}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold" style={{ color: t.profit >= 0 ? 'var(--win-500)' : 'var(--loss-500)', fontSize: 14 }}>
                      {formatCurrencyPrecise(t.profit)}
                    </div>
                    <div className="micro text-fg-3">{formatPercent(t.roi)}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Paris détaillés */}
            <h2 className="h3 mb-3">Historique des paris</h2>
            <div className="space-y-2">
              {[...bets].sort((a, b) => new Date(b.date) - new Date(a.date)).map(b => (
                <BetCard key={b.id} bet={b} onSettle={settleBet} onDelete={deleteBet} showDate />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}

function StatCard({ label, value, positive, neutral }) {
  const color = neutral ? 'var(--fg-1)' : positive ? 'var(--win-500)' : 'var(--loss-500)'
  return (
    <div className="card p-3">
      <div className="field-label" style={{ marginBottom: 6 }}>{label}</div>
      <div className="stat-value" style={{ color, fontSize: 22 }}>{value}</div>
    </div>
  )
}
