import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import Icon from '../components/Icon.jsx'
import BetCard from '../components/BetCard.jsx'
import { ROICurve } from '../components/Charts.jsx'
import { useApp } from '../contexts/AppContext.jsx'
import {
  computeROI, computeWinRate, totalProfit, averageStake, filterBets,
  cumulativePnL, findWeakestArea, findStrongestArea,
  formatPercent, formatCurrency, formatCurrencyPrecise,
} from '../utils/stats.js'

const TIMEFRAMES = [
  { id: 'month', label: 'Ce mois-ci' },
  { id: '7d', label: '7 jours' },
  { id: '90d', label: '90 jours' },
  { id: '365d', label: '1 an' },
]

export default function Home() {
  const navigate = useNavigate()
  const { user, seedDemoData, ignoreAlert, settleBet, deleteBet } = useApp()
  const [view, setView] = useState('overview')
  const [timeframe, setTimeframe] = useState('month')

  const allBets = user?.bets || []
  const filtered = useMemo(() => filterBets(allBets, { timeframe }), [allBets, timeframe])

  const stats = useMemo(() => ({
    roi: computeROI(filtered),
    profit: totalProfit(filtered),
    winRate: computeWinRate(filtered),
    count: filtered.filter(b => b.status !== 'pending').length,
    avg: averageStake(filtered),
  }), [filtered])

  const pnlCurve = useMemo(() => cumulativePnL(filtered).map(p => p.pnl), [filtered])
  const weakest = useMemo(() => findWeakestArea(filtered).slice(0, 2), [filtered])
  const strongest = useMemo(() => findStrongestArea(filtered).slice(0, 1), [filtered])

  const alertId = 'alert_live_sunday'
  const liveStats = useMemo(() => {
    const live = filtered.filter(b => b.betType === 'live')
    return { count: live.length, roi: computeROI(live) }
  }, [filtered])
  const showAlert = liveStats.count >= 3 && liveStats.roi < -10 && !user?.alertsIgnored?.includes(alertId)

  const bankrollNow = (user?.bankrollStart || 0) + totalProfit(allBets)

  if (allBets.length === 0) {
    return (
      <>
        <TopBar />
        <div className="px-5 pt-4 pb-28">
          <h1 className="h1 mb-6">
            Salut, <span className="accent-word">{user.pseudo}</span> !
          </h1>
          <div className="card p-8 text-center">
            <Icon name="sparkle" size={48} color="blue" className="mx-auto mb-4" />
            <h2 className="h3 mb-1">Ta bankroll est prête</h2>
            <p className="body mb-5">
              Ajoute ton premier pari pour voir apparaître tes stats, tes insights et tes alertes personnalisées.
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={() => navigate('/add-bet')} className="btn-primary">Ajouter mon premier pari</button>
              <button onClick={seedDemoData} className="btn-ghost">Charger des données de démo</button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <TopBar />
      <div className="px-5 pt-2 pb-28">
        <div className="flex items-center justify-between mb-4">
          <h1 className="h1">
            Salut, <span className="accent-word">{user.pseudo}</span> !
          </h1>
          <button onClick={() => navigate('/add-bet')} className="btn-add">
            <Icon name="add" size={14} color="white" />
            Ajouter
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="chip"
            style={{ width: 'auto', paddingRight: 30, fontSize: 13 }}
          >
            {TIMEFRAMES.map(t => <option key={t.id} value={t.id} style={{ background: 'var(--ink-800)' }}>{t.label}</option>)}
          </select>
          <button className="chip">
            <Icon name="share" size={12} color="white" />
            Partager
          </button>
        </div>

        <div className="segmented mb-5">
          <button
            onClick={() => setView('overview')}
            className={`seg-btn ${view === 'overview' ? 'active' : ''}`}
          >
            Vue d'ensemble
          </button>
          <button
            onClick={() => setView('performance')}
            className={`seg-btn ${view === 'performance' ? 'active' : ''}`}
          >
            Performance
          </button>
        </div>

        {view === 'overview' ? (
          <OverviewSection stats={stats} bankrollNow={bankrollNow} user={user} pnlCurve={pnlCurve} />
        ) : (
          <PerformanceSection stats={stats} weakest={weakest} strongest={strongest} filtered={filtered} user={user} />
        )}

        {/* Alerte insight gold */}
        {showAlert && (
          <div className="card-gold p-4 mt-5 animate-fade-in" style={{ color: '#1a0f00' }}>
            <div className="flex items-start gap-3 mb-3">
              <Icon name="sparkle" size={22} color="white" style={{ filter: 'none', flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <div className="micro" style={{ color: '#3d2a00', fontWeight: 700, marginBottom: 4 }}>INSIGHT PERSONNALISÉ</div>
                <p className="body" style={{ color: '#1a0f00' }}>
                  <b>{user.pseudo}</b>, tu perds <b>{Math.abs(liveStats.roi).toFixed(1)}%</b> de ROI quand tu paries en <b>live</b>. Limite ce type de pari pour protéger ta bankroll.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-primary" style={{ background: '#1a0f00', color: '#f0c85a', boxShadow: 'none', padding: '10px', fontSize: 13 }}>
                Activer l'alerte
              </button>
              <button onClick={() => ignoreAlert(alertId)} className="btn-ghost" style={{ background: 'rgba(26,15,0,0.1)', border: '1px solid rgba(26,15,0,0.3)', color: '#1a0f00', padding: '10px', fontSize: 13 }}>
                Ignorer
              </button>
            </div>
          </div>
        )}

        {/* Paris récents */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="h3">Paris récents</h2>
            <button onClick={() => navigate('/matchs')} className="micro" style={{ color: 'var(--blue-500)', background: 'none', border: 'none', fontWeight: 700 }}>
              Voir tout →
            </button>
          </div>
          <div className="space-y-2">
            {[...allBets].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3).map(b => (
              <BetCard key={b.id} bet={b} onSettle={settleBet} onDelete={deleteBet} showDate />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

function OverviewSection({ stats, bankrollNow, user, pnlCurve }) {
  return (
    <div className="animate-fade-in">
      <div
        className="card p-5 mb-3"
        style={{
          background: 'linear-gradient(135deg, rgba(41,98,255,0.15), rgba(41,98,255,0.02))',
          borderColor: 'rgba(41,98,255,0.4)',
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="field-label" style={{ marginBottom: 0 }}>Bankroll actuelle</span>
          <Icon name="coins" size={18} color="gold" />
        </div>
        <div className="stat-value mb-1" style={{ fontSize: 40 }}>
          {bankrollNow.toFixed(0)} <span style={{ fontSize: 22 }}>{user.currency}</span>
        </div>
        <div className="caption">
          Capital initial : <b style={{ color: 'white' }}>{user.bankrollStart} {user.currency}</b>
        </div>
        {pnlCurve.length >= 2 && (
          <div style={{ margin: '16px -8px 0', height: 80 }}>
            <ROICurve data={pnlCurve} color={stats.profit >= 0 ? '#22c55e' : '#ef4444'} height={80} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <KPI label="ROI global" value={formatPercent(stats.roi)} positive={stats.roi >= 0} />
        <KPI label="Profit total" value={formatCurrency(stats.profit, user.currency)} positive={stats.profit >= 0} />
        <KPI label="Taux de victoire" value={`${stats.winRate.toFixed(1)}%`} positive={stats.winRate >= 50} />
        <KPI label="Total paris" value={stats.count.toString()} neutral />
      </div>
      <div className="card p-3 mt-2 flex items-center justify-between">
        <span className="field-label" style={{ marginBottom: 0 }}>Mise moyenne</span>
        <span className="stat-value" style={{ fontSize: 22 }}>{stats.avg.toFixed(1)} {user.currency}</span>
      </div>
    </div>
  )
}

function KPI({ label, value, positive, neutral }) {
  const color = neutral ? 'var(--fg-1)' : positive ? 'var(--win-500)' : 'var(--loss-500)'
  return (
    <div className="card p-3">
      <div className="field-label" style={{ marginBottom: 6 }}>{label}</div>
      <div className="stat-value" style={{ color, fontSize: 24 }}>{value}</div>
    </div>
  )
}

function PerformanceSection({ stats, weakest, strongest, filtered, user }) {
  const [tab, setTab] = useState('weakness')
  return (
    <div className="animate-fade-in">
      <div
        className="card p-4 mb-4"
        style={{
          background: stats.profit < 0
            ? 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.02))'
            : 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.02))',
          borderColor: stats.profit < 0 ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="field-label" style={{ marginBottom: 2 }}>Résultat filtré</div>
            <div className="stat-value" style={{ color: stats.profit < 0 ? 'var(--loss-500)' : 'var(--win-500)' }}>
              {formatCurrencyPrecise(stats.profit)}
            </div>
          </div>
          <div className="text-right">
            <div className="field-label" style={{ marginBottom: 2 }}>{filtered.length} paris</div>
            <div className="h3" style={{ color: stats.roi < 0 ? 'var(--loss-500)' : 'var(--win-500)' }}>
              ROI {formatPercent(stats.roi)}
            </div>
          </div>
        </div>
        <div className="caption">
          Taux de victoire : <b style={{ color: 'white' }}>{stats.winRate.toFixed(1)}%</b>
        </div>
      </div>

      <div className="segmented mb-4">
        <button
          onClick={() => setTab('strengths')}
          className={`seg-btn ${tab === 'strengths' ? 'active' : ''}`}
          style={tab === 'strengths' ? { background: 'var(--win-500)' } : {}}
        >
          <Icon name="trending_up" size={14} color="white" />
          Forces
        </button>
        <button
          onClick={() => setTab('weakness')}
          className={`seg-btn ${tab === 'weakness' ? 'active' : ''}`}
          style={tab === 'weakness' ? { background: 'var(--loss-500)' } : {}}
        >
          <Icon name="trending_down" size={14} color="white" />
          Faiblesses
        </button>
      </div>

      {tab === 'weakness' ? (
        weakest.length > 0 ? (
          <div className="space-y-2">{weakest.map((w, i) => <StrengthWeaknessCard key={i} item={w} negative />)}</div>
        ) : (
          <div className="card p-5 text-center caption">Pas encore de faiblesse claire. Continue à tracker !</div>
        )
      ) : (
        strongest.length > 0 ? (
          <div className="space-y-2">{strongest.map((s, i) => <StrengthWeaknessCard key={i} item={s} />)}</div>
        ) : (
          <div className="card p-5 text-center caption">Pas encore assez de données pour identifier tes forces.</div>
        )
      )}
    </div>
  )
}

function StrengthWeaknessCard({ item, negative }) {
  const kindLabel = { tour: 'circuit', surface: 'surface', betType: 'type' }[item.kind]
  const color = negative ? 'var(--loss-500)' : 'var(--win-500)'
  return (
    <div className="card p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: `${color}22` }}>
            <Icon name={negative ? 'trending_down' : 'trending_up'} size={16} style={{ stroke: color, color }} />
          </div>
          <div>
            <div className="micro text-fg-3">{negative ? 'Pire' : 'Meilleur'} {kindLabel}</div>
            <div className="h3" style={{ fontSize: 15 }}>{item.label}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="stat-value" style={{ color, fontSize: 22 }}>{formatCurrencyPrecise(item.profit)}</div>
          <div className="micro text-fg-3">{item.count} paris</div>
        </div>
      </div>
      <div className="caption">
        ROI = <b style={{ color }}>{formatPercent(item.roi)}</b> · {negative ? 'Taux de perte' : 'Taux de victoire'} : <b>{negative ? (100 - item.winRate).toFixed(0) : item.winRate.toFixed(0)}%</b>
      </div>
    </div>
  )
}
