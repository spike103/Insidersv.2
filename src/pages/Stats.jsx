import React, { useMemo, useState } from 'react'
import TopBar from '../components/TopBar.jsx'
import Icon from '../components/Icon.jsx'
import { ROICurve, Ring, Radar, Heatmap, SurfaceBar } from '../components/Charts.jsx'
import { useApp } from '../contexts/AppContext.jsx'
import { ANALYSES } from '../data/analyses.js'
import {
  computeROI, computeWinRate, totalProfit, profitBySurface, profitByOddRange,
  profitByBetType, profitByPlayer, profitByTour, profitByTournament,
  cumulativePnL, maxDrawdown, profitFactor, detectTilt, computeStreak,
  formatPercent, formatCurrencyPrecise, formatCurrency, averageStake,
} from '../utils/stats.js'
import { TOURNAMENTS } from '../data/tournaments.js'

export default function Stats() {
  const { user } = useApp()
  const bets = user?.bets || []
  const [view, setView] = useState('editorial') // 'editorial' | 'analyses'

  if (bets.length < 2) {
    return (
      <>
        <TopBar title="Mes stats" />
        <div className="px-5 pt-2 pb-28">
          <div className="card p-8 text-center">
            <Icon name="chart_bar" size={40} color="muted" className="mx-auto mb-3" />
            <h3 className="h3 mb-1">Pas assez de données</h3>
            <p className="body">Ajoute au moins 2 paris pour voir tes stats et tes analyses.</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <TopBar title="Mes stats" />
      <div className="px-5 pt-2 pb-28">
        <div className="segmented mb-5">
          <button onClick={() => setView('editorial')} className={`seg-btn ${view === 'editorial' ? 'active' : ''}`}>
            Récap
          </button>
          <button onClick={() => setView('analyses')} className={`seg-btn ${view === 'analyses' ? 'active' : ''}`}>
            Analyses
          </button>
        </div>

        {view === 'editorial' ? <Editorial bets={bets} user={user} /> : <AnalysesView bets={bets} user={user} />}
      </div>
    </>
  )
}

function Editorial({ bets, user }) {
  const roi = computeROI(bets)
  const profit = totalProfit(bets)
  const winRate = computeWinRate(bets)
  const pos = roi >= 0
  const col = pos ? 'var(--win-500)' : 'var(--loss-500)'
  const pnlCurve = useMemo(() => cumulativePnL(bets).map(p => p.pnl), [bets])
  const surfaces = useMemo(() => profitBySurface(bets).filter(s => s.count > 0), [bets])
  const topSurface = [...surfaces].sort((a, b) => b.roi - a.roi)[0]
  const worstSurface = [...surfaces].sort((a, b) => a.roi - b.roi)[0]

  const radarData = surfaces.map(s => ({
    label: s.surface,
    value: Math.max(5, Math.min(100, ((s.roi + 30) / 60) * 100)),
  }))

  const h2hTop = useMemo(() => profitByPlayer(bets).filter(p => p.count >= 2).slice(0, 3), [bets])
  const dd = maxDrawdown(bets)
  const pf = profitFactor(bets)

  return (
    <div className="animate-fade-in">
      {/* Hero ROI géant */}
      <div className="mb-4">
        <div
          style={{
            fontSize: 72, fontWeight: 700, fontStyle: 'italic', lineHeight: 0.95,
            letterSpacing: '-0.03em', color: col,
            textShadow: pos ? '0 0 60px rgba(34,197,94,0.35)' : '0 0 60px rgba(239,68,68,0.3)',
          }}
        >
          {pos ? '+' : ''}{roi.toFixed(1)}<span style={{ fontSize: 40, opacity: 0.8 }}>%</span>
        </div>
        <div className="body mt-2">
          {pos
            ? <>Tu es à <b style={{ color: col }}>{formatCurrency(profit, user.currency)}</b> sur {bets.length} paris. <b style={{ color: 'white' }}>{winRate.toFixed(0)}%</b> de réussites.</>
            : <>Tu es à <b style={{ color: col }}>{formatCurrency(profit, user.currency)}</b> sur {bets.length} paris. Taux de victoire : <b style={{ color: 'white' }}>{winRate.toFixed(0)}%</b>.</>
          }
        </div>
        <div style={{ margin: '20px -8px 0', height: 140 }}>
          <ROICurve data={pnlCurve} color={col} height={140} />
        </div>
      </div>

      {/* Chapitre 1 — surfaces */}
      <ChapterBreak num="01" title="Tes surfaces" />
      <div className="card mb-4">
        {surfaces.length > 1 && (
          <div className="flex justify-center p-3 pb-0">
            <Radar data={radarData} size={220} color={pos ? 'var(--win-500)' : 'var(--blue-500)'} />
          </div>
        )}
        <div className="p-3 grid grid-cols-2 gap-2">
          {topSurface && (
            <div style={{ padding: 10, borderRadius: 12, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)' }}>
              <div className="micro" style={{ color: 'var(--win-400)', fontWeight: 700, textTransform: 'uppercase' }}>Peak</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{topSurface.surface}</div>
              <div className="stat-value" style={{ color: 'var(--win-500)', fontSize: 14 }}>{formatPercent(topSurface.roi)}</div>
            </div>
          )}
          {worstSurface && worstSurface.surface !== topSurface?.surface && (
            <div style={{ padding: 10, borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <div className="micro" style={{ color: 'var(--loss-400)', fontWeight: 700, textTransform: 'uppercase' }}>Valley</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{worstSurface.surface}</div>
              <div className="stat-value" style={{ color: 'var(--loss-500)', fontSize: 14 }}>{formatPercent(worstSurface.roi)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Chapitre 2 — top joueurs */}
      {h2hTop.length > 0 && (
        <>
          <ChapterBreak num="02" title="Tes cibles" />
          <div className="space-y-2 mb-4">
            {h2hTop.map((h, i) => (
              <div key={i} className="card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h3">{h.player}</div>
                    <div className="micro text-fg-3">{h.count} paris · {h.winRate.toFixed(0)}% gagnés</div>
                  </div>
                  <div className="stat-value" style={{ fontSize: 20, color: h.profit >= 0 ? 'var(--win-500)' : 'var(--loss-500)' }}>
                    {formatCurrencyPrecise(h.profit)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Chapitre 3 — bankroll */}
      <ChapterBreak num="03" title="Ta bankroll" />
      <div className="card p-4 mb-4">
        <div className="field-label">Risque</div>
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="text-center">
            <div className="stat-value" style={{ fontSize: 18 }}>{formatCurrency(profit, user.currency)}</div>
            <div className="micro text-fg-3">Profit</div>
          </div>
          <div className="text-center">
            <div className="stat-value" style={{ fontSize: 18, color: 'var(--loss-500)' }}>-{dd.toFixed(0)}{user.currency}</div>
            <div className="micro text-fg-3">Drawdown max</div>
          </div>
          <div className="text-center">
            <div className="stat-value" style={{ fontSize: 18, color: pf >= 1 ? 'var(--win-500)' : 'var(--loss-500)' }}>
              {pf === 999 ? '∞' : pf.toFixed(2)}
            </div>
            <div className="micro text-fg-3">Profit factor</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ChapterBreak({ num, title }) {
  return (
    <div style={{ padding: '20px 0 12px' }}>
      <div className="micro" style={{ color: 'var(--blue-500)', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', fontStyle: 'italic' }}>
        Chapitre · {num}
      </div>
      <div className="h2" style={{ fontStyle: 'italic', textTransform: 'uppercase', marginTop: 2, fontSize: 24 }}>
        {title}
      </div>
      <div style={{ height: 2, width: 40, background: 'var(--blue-500)', marginTop: 8, boxShadow: '0 0 12px rgba(41,98,255,0.6)' }} />
    </div>
  )
}

function AnalysesView({ bets, user }) {
  const CAT_ORDER = ['comportement', 'performance', 'financier', 'tendance']
  const [activeCategory, setActiveCategory] = useState('performance')
  const [opened, setOpened] = useState(null)

  return (
    <>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 -mx-1 px-1">
        {CAT_ORDER.map(id => {
          const cat = ANALYSES[id]
          const active = activeCategory === id
          return (
            <button
              key={id}
              onClick={() => { setActiveCategory(id); setOpened(null) }}
              className={`chip flex-shrink-0 ${active ? 'active' : ''}`}
              style={active ? { background: cat.color, borderColor: cat.color } : {}}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          )
        })}
      </div>

      <div className="space-y-2">
        {ANALYSES[activeCategory].items.map(item => (
          <div key={item.id}>
            <button
              onClick={() => setOpened(opened === item.id ? null : item.id)}
              className="card w-full p-3 flex items-center gap-3 text-left"
            >
              <div
                className="rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ width: 36, height: 36, background: `${ANALYSES[activeCategory].color}22` }}
              >
                <Icon name="chart_line" size={16} style={{ stroke: ANALYSES[activeCategory].color, color: ANALYSES[activeCategory].color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="h3" style={{ fontSize: 14 }}>{item.title}</div>
                <div className="micro text-fg-3">{item.desc}</div>
              </div>
              <Icon name={opened === item.id ? 'chevron_up' : 'chevron_down'} size={16} color="muted" />
            </button>
            {opened === item.id && (
              <div className="mt-2 animate-slide-up">
                <AnalysisDetail id={item.id} bets={bets} user={user} />
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}

function AnalysisDetail({ id, bets, user }) {
  switch (id) {
    case 'roi_global': {
      const r = computeROI(bets), wr = computeWinRate(bets), p = totalProfit(bets)
      return (
        <div className="card p-4">
          <div className="grid grid-cols-3 gap-2">
            <Metric label="ROI" value={formatPercent(r)} color={r >= 0 ? 'var(--win-500)' : 'var(--loss-500)'} />
            <Metric label="Profit" value={formatCurrency(p, user.currency)} color={p >= 0 ? 'var(--win-500)' : 'var(--loss-500)'} />
            <Metric label="Win rate" value={`${wr.toFixed(1)}%`} />
          </div>
        </div>
      )
    }
    case 'winrate_surface': {
      const data = profitBySurface(bets).filter(s => s.count > 0)
      return <div className="card p-4">{data.map(d => <SurfaceBar key={d.surface} label={d.surface} roi={d.roi} bets={d.count} win={d.winRate.toFixed(0)} />)}</div>
    }
    case 'winrate_bet_type': {
      const data = profitByBetType(bets).slice(0, 5)
      return (
        <div className="card p-4 space-y-2">
          {data.map((d, i) => (
            <div key={i} className="flex items-center justify-between" style={{ fontSize: 13 }}>
              <span className="truncate">{d.type}</span>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="micro text-fg-3">{d.count}</span>
                <span className="font-bold" style={{ color: d.profit >= 0 ? 'var(--win-500)' : 'var(--loss-500)', minWidth: 56, textAlign: 'right' }}>
                  {formatPercent(d.roi)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )
    }
    case 'cote_range': {
      const data = profitByOddRange(bets).filter(d => d.count > 0)
      return <div className="card p-4">{data.map(d => <SurfaceBar key={d.label} label={d.label} roi={d.roi} bets={d.count} win={d.winRate.toFixed(0)} />)}</div>
    }
    case 'best_players': {
      const data = profitByPlayer(bets).filter(p => p.count >= 2).slice(0, 5)
      return (
        <div className="card p-4 space-y-2">
          {data.length === 0 ? <p className="caption">Pas assez de données.</p> : data.map((d, i) => (
            <div key={i} className="flex items-center justify-between" style={{ fontSize: 13 }}>
              <span className="truncate font-semibold">{d.player}</span>
              <span className="font-bold flex-shrink-0" style={{ color: d.profit >= 0 ? 'var(--win-500)' : 'var(--loss-500)' }}>
                {formatCurrencyPrecise(d.profit)} ({d.count})
              </span>
            </div>
          ))}
        </div>
      )
    }
    case 'combo_vs_simple': {
      const combo = bets.filter(b => b.betType === 'combine' || b.mode === 'combine')
      const simple = bets.filter(b => b.betType !== 'combine' && b.mode !== 'combine')
      return (
        <div className="card p-4 grid grid-cols-2 gap-3">
          <Metric label="Simples" value={formatPercent(computeROI(simple))} color={computeROI(simple) >= 0 ? 'var(--win-500)' : 'var(--loss-500)'} />
          <Metric label="Combinés" value={formatPercent(computeROI(combo))} color={computeROI(combo) >= 0 ? 'var(--win-500)' : 'var(--loss-500)'} />
        </div>
      )
    }
    case 'bankroll_evolution': {
      const pnl = cumulativePnL(bets).map(p => p.pnl)
      return (
        <div className="card p-4">
          <div style={{ height: 140 }}>
            <ROICurve data={pnl} color="#2962ff" height={140} />
          </div>
        </div>
      )
    }
    case 'drawdown_max': {
      const dd = maxDrawdown(bets)
      return (
        <div className="card p-4 text-center">
          <div className="stat-value" style={{ color: 'var(--loss-500)', fontSize: 36 }}>
            -{dd.toFixed(2)} {user.currency}
          </div>
          <div className="caption mt-1">Pire chute depuis un sommet.</div>
        </div>
      )
    }
    case 'profit_factor': {
      const pf = profitFactor(bets)
      return (
        <div className="card p-4 text-center">
          <div className="stat-value" style={{ color: pf >= 1 ? 'var(--win-500)' : 'var(--loss-500)', fontSize: 36 }}>
            {pf === 999 ? '∞' : pf.toFixed(2)}
          </div>
          <div className="caption mt-1">&gt; 1 = profitable. Cible pro : &gt; 1.3</div>
        </div>
      )
    }
    case 'tour_atp_wta': {
      const data = profitByTour(bets)
      return (
        <div className="card p-4 grid grid-cols-2 gap-3">
          {data.map(d => (
            <div key={d.tour} className="text-center">
              <div className="micro text-fg-3" style={{ letterSpacing: '0.1em' }}>{d.tour}</div>
              <div className="stat-value mt-1" style={{ color: d.profit >= 0 ? 'var(--win-500)' : 'var(--loss-500)', fontSize: 22 }}>
                {formatCurrency(d.profit, user.currency)}
              </div>
              <div className="micro text-fg-3">{d.count} · {formatPercent(d.roi)}</div>
            </div>
          ))}
        </div>
      )
    }
    case 'tournament_roi': {
      const data = profitByTournament(bets).slice(0, 5)
      return (
        <div className="card p-4 space-y-2">
          {data.map((d, i) => {
            const t = TOURNAMENTS.find(x => x.id === d.tournamentId)
            return (
              <div key={i} className="flex items-center justify-between" style={{ fontSize: 13 }}>
                <span className="flex items-center gap-2 truncate">
                  <span>{t?.flag || '🎾'}</span>
                  <span className="truncate">{t?.name || 'Autre'}</span>
                </span>
                <span className="font-bold" style={{ color: d.profit >= 0 ? 'var(--win-500)' : 'var(--loss-500)' }}>
                  {formatCurrencyPrecise(d.profit)}
                </span>
              </div>
            )
          })}
        </div>
      )
    }
    case 'tilt_detection': {
      const ep = detectTilt(bets)
      return (
        <div className="card p-4 text-center">
          {ep.length === 0 ? (
            <>
              <Icon name="shield" size={32} color="green" className="mx-auto mb-2" />
              <p className="body" style={{ color: 'white' }}>Aucun épisode de tilt détecté</p>
              <p className="caption mt-1">Ton contrôle émotionnel est bon.</p>
            </>
          ) : (
            <>
              <div className="stat-value" style={{ color: 'var(--loss-500)', fontSize: 30 }}>{ep.length}</div>
              <p className="caption mt-1">épisode{ep.length > 1 ? 's' : ''} de tilt (paris rapprochés avec mise ↑ après perte).</p>
            </>
          )}
        </div>
      )
    }
    case 'hot_streak': {
      const s = computeStreak(bets)
      return (
        <div className="card p-4 text-center">
          <div className="stat-value" style={{ color: s.type === 'won' ? 'var(--win-500)' : 'var(--loss-500)', fontSize: 28 }}>
            {s.count > 0 ? `${s.count} ${s.type === 'won' ? 'V' : 'D'}` : '—'}
          </div>
          <p className="caption mt-1">Série en cours</p>
        </div>
      )
    }
    default:
      return <div className="card p-4 text-center caption">Disponible avec plus de données.</div>
  }
}

function Metric({ label, value, color }) {
  return (
    <div className="text-center">
      <div className="micro text-fg-3" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
      <div className="stat-value mt-1" style={{ color: color || 'var(--fg-1)', fontSize: 18 }}>{value}</div>
    </div>
  )
}
