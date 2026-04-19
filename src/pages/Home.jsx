import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import Icon from '../components/Icon.jsx'
import BetCard from '../components/BetCard.jsx'
import { ROICurve } from '../components/Charts.jsx'
import { useApp } from '../contexts/AppContext.jsx'
import { TOURNAMENTS } from '../data/tournaments.js'
import { SURFACES } from '../data/players.js'
import {
  computeROI, computeWinRate, totalProfit, averageStake, filterBets,
  cumulativePnL, findWeakestArea, findStrongestArea,
  formatPercent, formatCurrency, formatCurrencyPrecise, betProfit,
} from '../utils/stats.js'

const TIMEFRAMES = [
  { id: 'month', label: 'Ce mois-ci' },
  { id: '7d', label: '7 jours' },
  { id: '90d', label: '90 jours' },
  { id: '365d', label: '1 an' },
]

const DAYS_OF_WEEK = [
  { id: 1, label: 'Lundi' }, { id: 2, label: 'Mardi' }, { id: 3, label: 'Mercredi' },
  { id: 4, label: 'Jeudi' }, { id: 5, label: 'Vendredi' }, { id: 6, label: 'Samedi' }, { id: 0, label: 'Dimanche' },
]

// Extended filter function
function filterBetsExtended(bets, filters) {
  return bets.filter(b => {
    if (filters.category) {
      const t = TOURNAMENTS.find(x => x.id === b.tournamentId)
      if (!t || !t.category.includes(filters.category)) return false
    }
    if (filters.surface && b.surface !== filters.surface) return false
    if (filters.tour && b.tour !== filters.tour) return false
    if (filters.betType && b.betType !== filters.betType) return false
    if (filters.dayOfWeek != null && new Date(b.date).getDay() !== filters.dayOfWeek) return false
    if (filters.minOdd != null && b.odd < filters.minOdd) return false
    if (filters.maxOdd != null && b.odd > filters.maxOdd) return false
    if (filters.minStake != null && b.stake < filters.minStake) return false
    if (filters.maxStake != null && b.stake > filters.maxStake) return false
    return true
  })
}

export default function Home() {
  const navigate = useNavigate()
  const { user, seedDemoData, ignoreAlert, updateUser, settleBet, deleteBet, notifications } = useApp()
  const [view, setView] = useState('overview')
  const [timeframe, setTimeframe] = useState('month')
  const [filters, setFilters] = useState({})
  const [showShare, setShowShare] = useState(false)

  const allBets = user?.bets || []
  const timed = useMemo(() => filterBets(allBets, { timeframe }), [allBets, timeframe])
  const filtered = useMemo(() => filterBetsExtended(timed, filters), [timed, filters])

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

  const bankrollNow = (user?.bankrollStart || 0) + totalProfit(allBets)
  const hasFilters = Object.keys(filters).length > 0

  // Le premier insight affiché vient des notifications
  const insight = notifications?.[0]
  const showAlert = !!insight

  const handleShare = async () => {
    const text = `💰 Mes stats Insiders — ce mois-ci
ROI: ${formatPercent(stats.roi)}
Profit: ${formatCurrency(stats.profit, user.currency)}
Win rate: ${stats.winRate.toFixed(1)}%
${stats.count} paris`
    if (navigator.share) {
      try { await navigator.share({ title: 'Mes stats Insiders', text }); return } catch {}
    }
    try { await navigator.clipboard.writeText(text); alert('Stats copiées dans le presse-papier !'); return } catch {}
    setShowShare(true)
  }

  const activateAlert = (alertId) => {
    // Marque comme "activée" dans les réglages utilisateur
    const activated = user.alertsActivated || []
    updateUser({ alertsActivated: [...activated.filter(a => a !== alertId), alertId] })
    // Affiche un toast via alert simple
    alert('✓ Alerte activée. Tu recevras une notification la prochaine fois que ce schéma se reproduit.')
  }

  if (allBets.length === 0) {
    return (
      <>
        <TopBar />
        <div className="px-5 pt-4 pb-28">
          <h1 className="h1 mb-6">Salut, <span className="accent-word">{user.pseudo}</span> !</h1>
          <div className="card p-8 text-center">
            <Icon name="sparkle" size={48} color="blue" className="mx-auto mb-4" />
            <h2 className="h3 mb-1">Ta bankroll est prête</h2>
            <p className="body mb-5">Ajoute ton premier pari pour voir apparaître tes stats et insights.</p>
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
          <h1 className="h1">Salut, <span className="accent-word">{user.pseudo}</span> !</h1>
          <button onClick={() => navigate('/add-bet')} className="btn-add">
            <Icon name="add" size={14} color="white" /> Ajouter
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className="chip" style={{ width: 'auto', paddingRight: 30 }}>
            {TIMEFRAMES.map(t => <option key={t.id} value={t.id} style={{ background: 'var(--ink-800)' }}>{t.label}</option>)}
          </select>
          <button onClick={handleShare} className="chip">
            <Icon name="share" size={12} color="white" />
            Partager
          </button>
        </div>

        <div className="segmented mb-4">
          <button onClick={() => setView('overview')} className={`seg-btn ${view === 'overview' ? 'active' : ''}`}>Vue d'ensemble</button>
          <button onClick={() => setView('performance')} className={`seg-btn ${view === 'performance' ? 'active' : ''}`}>Performance</button>
        </div>

        {/* FILTERS — visibles surtout en Performance mais utiles partout */}
        {view === 'performance' && (
          <FilterPanel filters={filters} setFilters={setFilters} user={user} />
        )}

        {view === 'overview' ? (
          <OverviewSection stats={stats} bankrollNow={bankrollNow} user={user} pnlCurve={pnlCurve} />
        ) : (
          <PerformanceSection stats={stats} weakest={weakest} strongest={strongest} filtered={filtered} user={user} hasFilters={hasFilters} />
        )}

        {/* Alerte insight gold */}
        {showAlert && (
          <div className="card-gold p-4 mt-5 animate-fade-in" style={{ color: '#1a0f00' }}>
            <div className="flex items-start gap-3 mb-3">
              <Icon name="sparkle" size={22} color="white" style={{ filter: 'none', flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <div className="micro" style={{ color: '#3d2a00', fontWeight: 700, marginBottom: 4 }}>INSIGHT PERSONNALISÉ</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1a0f00', marginBottom: 4 }}>{insight.title}</div>
                <p className="body" style={{ color: '#1a0f00' }}>{insight.body}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => activateAlert(insight.id)}
                className="btn-primary"
                style={{ background: '#1a0f00', color: '#f0c85a', boxShadow: 'none', padding: '10px', fontSize: 13 }}
              >
                Activer l'alerte
              </button>
              <button
                onClick={() => ignoreAlert(insight.id)}
                className="btn-ghost"
                style={{ background: 'rgba(26,15,0,0.1)', border: '1px solid rgba(26,15,0,0.3)', color: '#1a0f00', padding: '10px', fontSize: 13 }}
              >
                Ignorer
              </button>
            </div>
          </div>
        )}

        {/* Paris récents */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="h3">Paris récents</h2>
            <button onClick={() => navigate('/matchs')} className="micro" style={{ color: 'var(--blue-500)', background: 'none', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
              Voir tout →
            </button>
          </div>
          <div className="space-y-2">
            {[...allBets].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3).map(b => (
              <BetCard key={b.id} bet={b} onSettle={settleBet} onDelete={deleteBet} showDate onClick={() => navigate(`/matchs/${b.id}`)} />
            ))}
          </div>
        </div>
      </div>

      {showShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowShare(false)}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)' }} />
          <div className="card-gold p-6 max-w-sm w-full text-center relative animate-slide-up" style={{ color: '#1a0f00' }} onClick={(e) => e.stopPropagation()}>
            <div className="font-bold text-2xl italic uppercase mb-1">{user.pseudo}</div>
            <div className="micro mb-4" style={{ color: '#3d2a00' }}>Insiders · ce mois</div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <div className="micro" style={{ color: '#3d2a00' }}>ROI</div>
                <div className="stat-value" style={{ fontSize: 28 }}>{formatPercent(stats.roi)}</div>
              </div>
              <div>
                <div className="micro" style={{ color: '#3d2a00' }}>Profit</div>
                <div className="stat-value" style={{ fontSize: 28 }}>{formatCurrency(stats.profit, user.currency)}</div>
              </div>
            </div>
            <button onClick={() => setShowShare(false)} className="btn-primary" style={{ background: '#1a0f00', color: '#f0c85a', boxShadow: 'none' }}>Fermer</button>
          </div>
        </div>
      )}
    </>
  )
}

function FilterPanel({ filters, setFilters, user }) {
  const [open, setOpen] = useState(false)
  const count = Object.keys(filters).length

  const setF = (k, v) => {
    const next = { ...filters }
    if (v === null || v === undefined || v === '') delete next[k]
    else next[k] = v
    setFilters(next)
  }
  const clear = () => setFilters({})

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => setOpen(!open)} className="chip">
          <Icon name="filter" size={12} color="white" />
          Filtres{count > 0 ? ` · ${count}` : ''}
          <Icon name="chevron_down" size={10} />
        </button>
        {count > 0 && (
          <button onClick={clear} className="micro" style={{ color: 'var(--loss-500)', background: 'none', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Tout effacer</button>
        )}
      </div>

      {open && (
        <div className="card p-4 space-y-3 animate-slide-up">
          <Row label="Catégorie tournoi">
            <select value={filters.category || ''} onChange={(e) => setF('category', e.target.value)}>
              <option value="">Toutes</option>
              <option value="Grand Chelem">Grand Chelem</option>
              <option value="Masters 1000">Masters 1000</option>
              <option value="WTA 1000">WTA 1000</option>
              <option value="ATP 500">ATP 500</option>
              <option value="WTA 500">WTA 500</option>
              <option value="ATP 250">ATP 250</option>
              <option value="WTA 250">WTA 250</option>
              <option value="Finales">Finales</option>
            </select>
          </Row>
          <Row label="Surface">
            <select value={filters.surface || ''} onChange={(e) => setF('surface', e.target.value)}>
              <option value="">Toutes</option>
              {SURFACES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </Row>
          <Row label="Circuit">
            <select value={filters.tour || ''} onChange={(e) => setF('tour', e.target.value)}>
              <option value="">Tous</option>
              <option value="ATP">ATP</option>
              <option value="WTA">WTA</option>
            </select>
          </Row>
          <Row label="Type de pari">
            <select value={filters.betType || ''} onChange={(e) => setF('betType', e.target.value)}>
              <option value="">Tous</option>
              <option value="vainqueur">Vainqueur</option>
              <option value="set_gagnant">Set gagnant</option>
              <option value="total_jeux">Total jeux</option>
              <option value="live">Live</option>
              <option value="combine">Combiné</option>
            </select>
          </Row>
          <Row label="Jour de semaine">
            <select value={filters.dayOfWeek ?? ''} onChange={(e) => setF('dayOfWeek', e.target.value === '' ? null : Number(e.target.value))}>
              <option value="">Tous</option>
              {DAYS_OF_WEEK.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </Row>
          <div className="grid grid-cols-2 gap-2">
            <Row label="Cote min">
              <input type="number" step="0.1" placeholder="1.0" value={filters.minOdd ?? ''} onChange={(e) => setF('minOdd', e.target.value ? Number(e.target.value) : null)} />
            </Row>
            <Row label="Cote max">
              <input type="number" step="0.1" placeholder="5.0" value={filters.maxOdd ?? ''} onChange={(e) => setF('maxOdd', e.target.value ? Number(e.target.value) : null)} />
            </Row>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Row label={`Mise min (${user.currency})`}>
              <input type="number" placeholder="0" value={filters.minStake ?? ''} onChange={(e) => setF('minStake', e.target.value ? Number(e.target.value) : null)} />
            </Row>
            <Row label={`Mise max (${user.currency})`}>
              <input type="number" placeholder="100" value={filters.maxStake ?? ''} onChange={(e) => setF('maxStake', e.target.value ? Number(e.target.value) : null)} />
            </Row>
          </div>
        </div>
      )}

      {count > 0 && !open && (
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.entries(filters).map(([k, v]) => (
            <button key={k} onClick={() => setF(k, null)} className="chip active" style={{ fontSize: 11 }}>
              {k}: {String(v)} <Icon name="close" size={10} color="white" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div>
      <div className="field-label" style={{ marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  )
}

function OverviewSection({ stats, bankrollNow, user, pnlCurve }) {
  return (
    <div className="animate-fade-in">
      <div className="card p-5 mb-3" style={{ background: 'linear-gradient(135deg, rgba(41,98,255,0.15), rgba(41,98,255,0.02))', borderColor: 'rgba(41,98,255,0.4)' }}>
        <div className="flex items-center justify-between mb-1">
          <span className="field-label" style={{ marginBottom: 0 }}>Bankroll actuelle</span>
          <Icon name="coins" size={18} color="gold" />
        </div>
        <div className="stat-value mb-1" style={{ fontSize: 40 }}>
          {bankrollNow.toFixed(0)} <span style={{ fontSize: 22 }}>{user.currency}</span>
        </div>
        <div className="caption">Capital initial : <b style={{ color: 'white' }}>{user.bankrollStart} {user.currency}</b></div>
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

function PerformanceSection({ stats, weakest, strongest, filtered, user, hasFilters }) {
  const [tab, setTab] = useState('weakness')
  return (
    <div className="animate-fade-in">
      <div className="card p-4 mb-4" style={{
        background: stats.profit < 0 ? 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.02))' : 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.02))',
        borderColor: stats.profit < 0 ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)',
      }}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="field-label" style={{ marginBottom: 2 }}>{hasFilters ? 'Résultat filtré' : 'Période'}</div>
            <div className="stat-value" style={{ color: stats.profit < 0 ? 'var(--loss-500)' : 'var(--win-500)' }}>{formatCurrencyPrecise(stats.profit)}</div>
          </div>
          <div className="text-right">
            <div className="field-label" style={{ marginBottom: 2 }}>{filtered.length} paris</div>
            <div className="h3" style={{ color: stats.roi < 0 ? 'var(--loss-500)' : 'var(--win-500)' }}>ROI {formatPercent(stats.roi)}</div>
          </div>
        </div>
        <div className="caption">Taux de victoire : <b style={{ color: 'white' }}>{stats.winRate.toFixed(1)}%</b></div>
      </div>

      <div className="segmented mb-4">
        <button onClick={() => setTab('strengths')} className={`seg-btn ${tab === 'strengths' ? 'active' : ''}`} style={tab === 'strengths' ? { background: 'var(--win-500)' } : {}}>
          <Icon name="trending_up" size={14} color="white" /> Forces
        </button>
        <button onClick={() => setTab('weakness')} className={`seg-btn ${tab === 'weakness' ? 'active' : ''}`} style={tab === 'weakness' ? { background: 'var(--loss-500)' } : {}}>
          <Icon name="trending_down" size={14} color="white" /> Faiblesses
        </button>
      </div>

      {tab === 'weakness' ? (
        weakest.length > 0 ? <div className="space-y-2">{weakest.map((w, i) => <SWCard key={i} item={w} negative />)}</div>
        : <div className="card p-5 text-center caption">Pas encore de faiblesse claire.</div>
      ) : (
        strongest.length > 0 ? <div className="space-y-2">{strongest.map((s, i) => <SWCard key={i} item={s} />)}</div>
        : <div className="card p-5 text-center caption">Pas encore assez de données pour identifier tes forces.</div>
      )}
    </div>
  )
}

function SWCard({ item, negative }) {
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
