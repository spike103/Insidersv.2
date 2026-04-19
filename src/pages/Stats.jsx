import React, { useMemo, useState } from 'react'
import TopBar from '../components/TopBar.jsx'
import Icon from '../components/Icon.jsx'
import { Ring, Radar, Heatmap, SurfaceBar, ROICurve } from '../components/Charts.jsx'
import { useApp } from '../contexts/AppContext.jsx'
import { ANALYSES } from '../data/analyses.js'
import {
  computeROI, computeWinRate, totalProfit,
  profitBySurface, profitByOddRange, profitByBetType, profitByPlayer,
  profitByTour, profitByTournament, cumulativePnL, maxDrawdown, profitFactor,
  detectTilt, computeStreak,
  formatPercent, formatCurrencyPrecise, formatCurrency,
} from '../utils/stats.js'
import { TOURNAMENTS } from '../data/tournaments.js'

export default function Stats() {
  const { user } = useApp()
  const bets = user?.bets || []
  const [view, setView] = useState('editorial')

  if (bets.length < 2) {
    return (
      <>
        <TopBar title="Mes stats" />
        <div className="px-5 pt-2 pb-28">
          <div className="card p-8 text-center">
            <Icon name="chart_bar" size={40} color="muted" className="mx-auto mb-3" />
            <h3 className="h3 mb-1">Pas assez de données</h3>
            <p className="body">Ajoute au moins 2 paris pour voir tes stats et analyses.</p>
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
          <button onClick={() => setView('editorial')} className={`seg-btn ${view === 'editorial' ? 'active' : ''}`}>Récap</button>
          <button onClick={() => setView('analyses')} className={`seg-btn ${view === 'analyses' ? 'active' : ''}`}>Analyses</button>
        </div>
        {view === 'editorial' ? <Editorial bets={bets} user={user} /> : <AnalysesView bets={bets} user={user} />}
      </div>
    </>
  )
}

// ===== V2 EDITORIAL — 4 CHAPITRES STRICT =====
function Editorial({ bets, user }) {
  const roi = computeROI(bets)
  const profit = totalProfit(bets)
  const winRate = computeWinRate(bets)

  return (
    <div className="animate-fade-in">
      <ChapterOne bets={bets} roi={roi} profit={profit} winRate={winRate} user={user} />
      <ChapterTwo bets={bets} />
      <ChapterThree bets={bets} user={user} />
      <ChapterFour bets={bets} user={user} />
      <EndOfRecap name={user.pseudo} />
    </div>
  )
}

// -------- CHAPTER 01 — THE PATTERN --------
function ChapterOne({ bets, roi, profit, winRate, user }) {
  const surfaces = useMemo(() => profitBySurface(bets).filter(s => s.count > 0), [bets])
  const topSurface = [...surfaces].sort((a, b) => b.roi - a.roi)[0]
  const worstSurface = [...surfaces].sort((a, b) => a.roi - b.roi)[0]

  // Pattern headline : calcule l'écart top vs average
  const topRatio = topSurface && surfaces.length > 1
    ? (topSurface.roi > 0 ? (topSurface.roi / Math.max(1, Math.abs(surfaces.find(s => s.surface !== topSurface.surface)?.roi || 1))) : null)
    : null

  const radarData = surfaces.map(s => ({
    label: s.surface === 'Hard' ? 'Hard' : s.surface === 'Clay' ? 'Clay' : s.surface === 'Grass' ? 'Grass' : 'Indoor',
    value: Math.max(5, Math.min(100, ((s.roi + 30) / 60) * 100)),
  }))

  const surfaceColor = roi >= 0 ? 'var(--win-500)' : 'var(--loss-500)'

  return (
    <>
      <ChapterBreak num="01" title="THE PATTERN" />

      {/* Headline insight */}
      <div className="mb-4">
        <h3 className="display" style={{ fontSize: 20, lineHeight: 1.25, letterSpacing: '-0.01em' }}>
          {topSurface && topRatio && topRatio > 1.5 ? (
            <><span className="accent-word">YOU'RE</span> <span style={{ color: 'white' }}>{topRatio.toFixed(0)}× BETTER ON {topSurface.surface.toUpperCase()}</span><br/><span style={{ color: 'white' }}>THAN {worstSurface?.surface.toUpperCase() || 'OTHERS'}.</span></>
          ) : roi >= 0 ? (
            <><span className="accent-word">YOU'RE</span> <span style={{ color: 'white' }}>IN THE GREEN: +{roi.toFixed(1)}%</span><br/><span style={{ color: 'white' }}>ROI THIS SEASON.</span></>
          ) : (
            <><span className="accent-word">WATCH OUT.</span> <span style={{ color: 'white' }}>{roi.toFixed(1)}%</span><br/><span style={{ color: 'white' }}>ROI — LET'S FIX IT.</span></>
          )}
        </h3>
        {topSurface && worstSurface && topSurface.surface !== worstSurface.surface && (
          <p className="body mt-3">
            Ton ROI {topSurface.surface} est {formatPercent(topSurface.roi)} contre {formatPercent(worstSurface.roi)} sur {worstSurface.surface}.
            Considère augmenter tes paris sur {topSurface.surface} pendant la saison.
          </p>
        )}
      </div>

      {/* Surface Map */}
      {surfaces.length >= 2 && (
        <div className="card p-4 mb-4">
          <div className="micro text-fg-3" style={{ letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>SURFACE MAP</div>
          <div className="flex justify-center">
            <Radar data={radarData} size={220} color={surfaceColor} />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {topSurface && (
              <div style={{ padding: 12, borderRadius: 12, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)' }}>
                <div className="micro" style={{ color: 'var(--win-400)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>PEAK</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{topSurface.surface}</div>
                <div className="stat-value" style={{ color: 'var(--win-500)', fontSize: 16 }}>{formatPercent(topSurface.roi)}</div>
              </div>
            )}
            {worstSurface && worstSurface.surface !== topSurface?.surface && (
              <div style={{ padding: 12, borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <div className="micro" style={{ color: 'var(--loss-400)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>VALLEY</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{worstSurface.surface}</div>
                <div className="stat-value" style={{ color: 'var(--loss-500)', fontSize: 16 }}>{formatPercent(worstSurface.roi)}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// -------- CHAPTER 02 — YOUR RHYTHM --------
function ChapterTwo({ bets }) {
  // Compute impulse score from betting patterns
  const tiltEpisodes = useMemo(() => detectTilt(bets), [bets])
  const liveBets = bets.filter(b => b.betType === 'live' || b.mode === 'live')
  const liveRate = bets.length > 0 ? (liveBets.length / bets.length) * 100 : 0

  // Simple impulse heuristic
  let impulseScore = 20
  impulseScore += tiltEpisodes.length * 15
  impulseScore += liveRate * 0.5
  impulseScore = Math.min(100, Math.max(0, Math.round(impulseScore)))

  const label = impulseScore < 40 ? 'DISCIPLINED' : impulseScore < 65 ? 'MODERATE' : 'REACTIVE'
  const labelColor = impulseScore < 40 ? 'var(--win-500)' : impulseScore < 65 ? 'var(--gold-400)' : 'var(--loss-500)'
  const statusText = impulseScore < 40 ? 'patient' : impulseScore < 65 ? 'équilibré' : 'réactif'

  // Heatmap 7×24
  const heatmap = useMemo(() => {
    const data = Array.from({ length: 7 }, () => Array(24).fill(0))
    bets.forEach(b => {
      const d = new Date(b.date)
      const dayIdx = (d.getDay() + 6) % 7 // 0=Mon
      const hour = d.getHours()
      data[dayIdx][hour]++
    })
    return data
  }, [bets])

  // Evening bets analysis
  const eveningBets = bets.filter(b => {
    const h = new Date(b.date).getHours()
    return h >= 21 || h <= 2
  })
  const eveningLossRate = eveningBets.length > 0
    ? (eveningBets.filter(b => b.status === 'lost').length / eveningBets.filter(b => b.status !== 'pending').length) * 100
    : 0

  return (
    <>
      <ChapterBreak num="02" title="YOUR RHYTHM" />

      <p className="body mb-4">
        Tu es <span className="font-bold" style={{ color: labelColor }}>{statusText}</span>.
        {impulseScore < 40 && <> La plupart de tes paris sont placés avec du recul.</>}
        {impulseScore >= 40 && impulseScore < 65 && <> Un équilibre entre réflexion et action.</>}
        {impulseScore >= 65 && <> Tu prends tes décisions dans le feu de l'action.</>}
      </p>

      {/* Impulse Score Card */}
      <div className="card p-4 mb-4">
        <div className="flex items-center gap-4">
          <Ring
            value={impulseScore}
            size={96}
            stroke={10}
            color={labelColor}
          >
            <div style={{ fontSize: 26, fontWeight: 700 }}>{impulseScore}</div>
            <div style={{ fontSize: 8, color: 'var(--fg-3)', letterSpacing: '0.08em' }}>/ 100</div>
          </Ring>
          <div className="flex-1">
            <div className="micro text-fg-3" style={{ letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>IMPULSE SCORE</div>
            <div style={{ fontSize: 18, fontWeight: 700, fontStyle: 'italic', marginTop: 4, color: labelColor }}>{label}</div>
            <div className="caption mt-1">
              Basé sur variance des mises, taux de paris live et séquences après perte.
            </div>
          </div>
        </div>
      </div>

      {/* When You Bet Heatmap */}
      <div className="card p-4 mb-4">
        <div className="micro text-fg-3" style={{ letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>WHEN YOU BET</div>
        <Heatmap data={heatmap} accent="#22c55e" />
      </div>

      {/* Warning card if impulse high OR evening losses significant */}
      {(impulseScore >= 50 || (eveningBets.length >= 3 && eveningLossRate > 55)) && (
        <div
          className="mb-4"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: 16,
            padding: 16,
          }}
        >
          <div className="micro" style={{ color: 'var(--loss-400)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
            WARNING
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
            {eveningBets.length >= 3 && eveningLossRate > 55
              ? 'Les paris du soir sous-performent.'
              : 'Trop de paris impulsifs détectés.'}
          </div>
          <div className="caption">
            {eveningBets.length >= 3 && eveningLossRate > 55
              ? `${eveningLossRate.toFixed(0)}% de tes pertes viennent de paris placés après 21h. Signal d'impulsivité.`
              : `${tiltEpisodes.length} épisode(s) de tilt détecté(s). Garde ta discipline après une perte.`}
          </div>
        </div>
      )}
    </>
  )
}

// -------- CHAPTER 03 — YOUR TARGETS --------
function ChapterThree({ bets, user }) {
  const topPlayers = useMemo(() => {
    const byPlayer = profitByPlayer(bets).filter(p => p.count >= 2).slice(0, 5)
    return byPlayer.map(p => {
      const pBets = bets.filter(b => (b.players || []).includes(p.player))
      const wins = pBets.filter(b => b.status === 'won').length
      const losses = pBets.filter(b => b.status === 'lost').length
      return { ...p, wins, losses, total: wins + losses }
    }).filter(p => p.total > 0)
  }, [bets])

  const { findPlayer } = useApp()

  if (topPlayers.length === 0) {
    return (
      <>
        <ChapterBreak num="03" title="YOUR TARGETS" />
        <div className="card p-5 text-center caption mb-4">Pas assez de données sur tes joueurs cibles.</div>
      </>
    )
  }

  return (
    <>
      <ChapterBreak num="03" title="YOUR TARGETS" />
      <p className="body mb-4">
        Ton palmarès contre les joueurs que tu as pariés le plus cette saison.
      </p>

      <div className="space-y-2 mb-4">
        {topPlayers.map((p, i) => {
          const player = findPlayer(p.player) || { flag: '🌍' }
          const wPct = (p.wins / p.total) * 100
          const isPositive = p.profit >= 0

          return (
            <div
              key={i}
              style={{
                padding: 16,
                background: 'var(--ink-800)',
                border: '1px solid var(--ink-600)',
                borderRadius: 16,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: 24 }}>{player.flag || '🌍'}</span>
                  <div>
                    <div className="pill-label" style={{ fontSize: 15 }}>{p.player.toUpperCase()}</div>
                    <div className="micro text-fg-3">
                      {p.total} paris · {wPct.toFixed(0)}% réussis
                    </div>
                  </div>
                </div>
                <div className="stat-value" style={{ fontSize: 18, color: isPositive ? 'var(--win-500)' : 'var(--loss-500)' }}>
                  {formatCurrencyPrecise(p.profit)}
                </div>
              </div>

              {/* W/L bar */}
              <div style={{ display: 'flex', height: 6, borderRadius: 999, overflow: 'hidden', background: 'var(--ink-700)' }}>
                <div style={{ width: `${(p.wins / p.total) * 100}%`, background: 'var(--win-500)' }} />
                <div style={{ width: `${(p.losses / p.total) * 100}%`, background: 'var(--loss-500)' }} />
              </div>
              <div className="flex justify-between mt-2">
                <span className="micro" style={{ color: 'var(--win-500)', fontWeight: 700 }}>{p.wins}W</span>
                <span className="micro" style={{ color: 'var(--loss-500)', fontWeight: 700 }}>{p.losses}L</span>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

// -------- CHAPTER 04 — THE BANKROLL --------
function ChapterFour({ bets, user }) {
  const start = user.bankrollStart || 500
  const profit = totalProfit(bets)
  const current = start + profit
  const pct = start > 0 ? (profit / start) * 100 : 0
  const positive = profit >= 0

  // Peak & Low from cumulative PnL
  const cumul = useMemo(() => cumulativePnL(bets), [bets])
  const peak = cumul.length > 0 ? start + Math.max(0, ...cumul.map(c => c.pnl)) : start
  const low = cumul.length > 0 ? start + Math.min(0, ...cumul.map(c => c.pnl)) : start

  // Kelly adherence heuristic
  const flatStake = user.strategy?.flatAmount || 10
  const avgStake = bets.length > 0 ? bets.reduce((s, b) => s + b.stake, 0) / bets.length : flatStake
  const variance = bets.length > 0 ? bets.reduce((s, b) => s + Math.pow(b.stake - avgStake, 2), 0) / bets.length : 0
  const stdev = Math.sqrt(variance)
  const kellyAdherence = Math.max(0, Math.min(100, Math.round(100 - (stdev / Math.max(1, avgStake)) * 100)))

  // Streak
  const streak = computeStreak(bets)

  const rangeMin = Math.min(low, start) - 10
  const rangeMax = Math.max(peak, start) + 10
  const rangeSize = rangeMax - rangeMin || 1
  const currentPos = ((current - rangeMin) / rangeSize) * 100
  const startPos = ((start - rangeMin) / rangeSize) * 100

  return (
    <>
      <ChapterBreak num="04" title="THE BANKROLL" />

      <div className="card p-4 mb-4">
        <div className="micro text-fg-3" style={{ letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>CURRENT</div>
        <div className="flex items-baseline gap-3 mt-1 mb-3">
          <div className="stat-value" style={{ fontSize: 36 }}>{current.toFixed(0)}{user.currency}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: positive ? 'var(--win-500)' : 'var(--loss-500)' }}>
            {positive ? '+' : ''}{pct.toFixed(1)}%
          </div>
        </div>

        {/* Progress bar with start marker */}
        <div style={{ position: 'relative', height: 40, background: 'var(--ink-700)', borderRadius: 10, marginBottom: 8, overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: `${currentPos}%`,
              background: positive
                ? 'linear-gradient(90deg, rgba(34,197,94,0.3), var(--win-500))'
                : 'linear-gradient(90deg, rgba(239,68,68,0.3), var(--loss-500))',
            }}
          />
          <div style={{ position: 'absolute', left: `${startPos}%`, top: -4, bottom: -4, width: 2, background: 'white' }} />
        </div>
        <div className="flex justify-between" style={{ marginTop: 10 }}>
          <span className="micro">Low <b style={{ color: 'var(--loss-500)' }}>{low.toFixed(0)}{user.currency}</b></span>
          <span className="micro">Peak <b style={{ color: 'var(--win-500)' }}>{peak.toFixed(0)}{user.currency}</b></span>
        </div>

        {/* Kelly */}
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--ink-600)' }} className="flex items-center gap-3">
          <Ring value={kellyAdherence} size={54} stroke={6} color={kellyAdherence > 60 ? 'var(--win-500)' : 'var(--loss-500)'}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{kellyAdherence}</div>
          </Ring>
          <div className="flex-1">
            <div className="micro text-fg-3" style={{ letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>KELLY ADHERENCE</div>
            <div className="caption mt-1" style={{ color: 'var(--fg-1)', fontSize: 13, fontWeight: 600 }}>
              {kellyAdherence > 60
                ? 'Ton dimensionnement est proche de l\'optimal.'
                : 'Tu sur-mises souvent. Attention aux variations.'}
            </div>
          </div>
        </div>
      </div>

      {/* Streak card */}
      {streak.count > 0 && (
        <div
          className="mb-4"
          style={{
            background: streak.type === 'won' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${streak.type === 'won' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
            borderRadius: 16,
            padding: 16,
          }}
        >
          <div className="micro" style={{ color: streak.type === 'won' ? 'var(--win-400)' : 'var(--loss-400)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
            STREAK
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
            {streak.type === 'won'
              ? `Série de ${streak.count} paris gagnants.`
              : `Série de ${streak.count} paris perdus.`}
          </div>
          <div className="caption">
            {streak.type === 'won'
              ? 'Ne laisse pas l\'euphorie gonfler tes mises.'
              : 'Prends du recul. Ne change pas ta stratégie sous la pression.'}
          </div>
        </div>
      )}
    </>
  )
}

// -------- End of recap + Share --------
function EndOfRecap({ name }) {
  const share = async () => {
    const text = `J'ai révélé mes patterns avec Insiders. ${name}, that's your read.`
    if (navigator.share) {
      try { await navigator.share({ title: 'Mon récap Insiders', text }); return } catch {}
    }
    try { await navigator.clipboard.writeText(text); alert('Lien copié !') } catch {}
  }

  return (
    <div style={{ padding: '32px 0 10px', textAlign: 'center' }}>
      <div className="micro text-fg-3" style={{ letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
        END OF RECAP
      </div>
      <div className="accent-word" style={{ fontSize: 16, marginBottom: 20 }}>
        {(name || 'INSIDER').toUpperCase()}, THAT'S YOUR READ.
      </div>
      <button onClick={share} className="btn-primary">
        Share this recap
      </button>
    </div>
  )
}

// -------- Chapter break --------
function ChapterBreak({ num, title }) {
  return (
    <div style={{ padding: '24px 0 14px' }}>
      <div className="micro" style={{ color: 'var(--blue-500)', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', fontStyle: 'italic' }}>
        CHAPTER · {num}
      </div>
      <div className="display" style={{ fontSize: 28, marginTop: 4 }}>
        {title}
      </div>
      <div style={{ height: 2, width: 40, background: 'var(--blue-500)', marginTop: 10, boxShadow: '0 0 12px rgba(41,98,255,0.6)' }} />
    </div>
  )
}

// ==================== ANALYSES VIEW ====================
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
              style={{ cursor: 'pointer' }}
            >
              <div className="rounded-lg flex items-center justify-center flex-shrink-0" style={{ width: 36, height: 36, background: `${ANALYSES[activeCategory].color}22` }}>
                <Icon name="chart_line" size={16} style={{ stroke: ANALYSES[activeCategory].color }} />
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
        <div className="card p-4 grid grid-cols-3 gap-2">
          <Metric label="ROI" value={formatPercent(r)} color={r >= 0 ? 'var(--win-500)' : 'var(--loss-500)'} />
          <Metric label="Profit" value={formatCurrency(p, user.currency)} color={p >= 0 ? 'var(--win-500)' : 'var(--loss-500)'} />
          <Metric label="Win rate" value={`${wr.toFixed(1)}%`} />
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
              <div className="flex items-center gap-3">
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
              <span className="font-bold" style={{ color: d.profit >= 0 ? 'var(--win-500)' : 'var(--loss-500)' }}>
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
              <p className="caption mt-1">épisode{ep.length > 1 ? 's' : ''} de tilt.</p>
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
