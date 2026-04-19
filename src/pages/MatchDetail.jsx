import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import Icon from '../components/Icon.jsx'
import { useApp } from '../contexts/AppContext.jsx'
import { TOURNAMENTS } from '../data/tournaments.js'
import { SURFACES } from '../data/players.js'
import { betProfit, formatCurrencyPrecise } from '../utils/stats.js'

const ROUND_LABEL = {
  'R128': '1er tour', 'R64': '2e tour', 'R32': '3e tour',
  'R16': '1/8 de finale', 'QF': 'Quart de finale',
  'SF': 'Demi-finale', 'F': 'Finale', 'Qualif': 'Qualifications',
}

export default function MatchDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, findPlayer, settleBet, deleteBet } = useApp()
  const bet = (user?.bets || []).find(b => b.id === id)

  if (!bet) {
    return (
      <>
        <TopBar showBack />
        <div className="px-5 pt-4 pb-24 text-center">
          <div className="card p-6">
            <p className="body">Pari introuvable.</p>
            <button onClick={() => navigate('/matchs')} className="btn-primary mt-4" style={{ width: 'auto', padding: '10px 18px' }}>Retour aux matchs</button>
          </div>
        </div>
      </>
    )
  }

  const tournament = TOURNAMENTS.find(t => t.id === bet.tournamentId)
  const surface = SURFACES.find(s => s.id === bet.surface)
  const profit = betProfit(bet)
  const isLive = bet.betType === 'live' || bet.mode === 'live'
  const isCombo = bet.mode === 'combine'

  const statusLabel = {
    won: '✓ Gagné',
    lost: '✗ Perdu',
    pending: '⌛ En cours',
    void: '↺ Remboursé',
    cashout: '⚡ Cashout',
  }[bet.status]

  const statusColor = {
    won: 'var(--win-500)',
    lost: 'var(--loss-500)',
    pending: 'var(--blue-500)',
    void: 'var(--fg-3)',
    cashout: 'var(--gold-400)',
  }[bet.status]

  const handleDelete = () => {
    if (confirm('Supprimer ce pari ?')) {
      deleteBet(bet.id)
      navigate('/matchs')
    }
  }

  return (
    <>
      <TopBar title="Détail du match" showBack />
      <div className="px-5 pt-2 pb-28">
        {/* Hero avec joueurs */}
        <div className="card p-5 mb-4 animate-fade-in" style={isLive ? { background: 'linear-gradient(135deg, rgba(41,98,255,0.18), rgba(41,98,255,0.05))', borderColor: 'var(--blue-500)', boxShadow: 'var(--glow-blue-soft)' } : {}}>
          {tournament && (
            <div className="flex items-center gap-2 mb-3">
              <span style={{ fontSize: 18 }}>{tournament.flag}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{tournament.name}</div>
                <div className="micro text-fg-3">{tournament.dates}</div>
              </div>
              {isLive && (
                <span className="flex items-center gap-1" style={{ fontSize: 11, fontWeight: 700, color: 'var(--loss-400)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--loss-400)' }} />
                  LIVE
                </span>
              )}
            </div>
          )}

          {/* Liste joueurs */}
          <div className="space-y-2">
            {(bet.players || []).map((name, i) => {
              const p = findPlayer(name) || { flag: '🌍' }
              return (
                <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: 'var(--ink-700)' }}>
                  <button
                    onClick={() => navigate(`/players/${encodeURIComponent(name)}`)}
                    className="flex items-center gap-2 min-w-0 flex-1"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <span style={{ fontSize: 18 }}>{p.flag || '🌍'}</span>
                    <span className="text-sm font-semibold truncate text-white">{name}</span>
                  </button>
                  {i === 0 && !isCombo && (
                    <span className="font-bold text-sm" style={{ color: 'var(--blue-500)' }}>{bet.odd?.toFixed(2)}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Détails structurés */}
        <div className="card mb-4">
          <DetailRow label="Statut" value={statusLabel} color={statusColor} />
          <DetailRow label="Tournoi" value={tournament?.name || '—'} icon={tournament?.flag} />
          <DetailRow label="Catégorie" value={tournament?.category || '—'} badge={tournament?.isPrestige} />
          <DetailRow label="Surface" value={surface?.label || bet.surface || '—'} />
          <DetailRow label="Circuit" value={bet.tour || '—'} />
          {bet.round && <DetailRow label="Tour" value={ROUND_LABEL[bet.round] || bet.round} />}
          <DetailRow label="Type de pari" value={bet.betType === 'combine' ? 'Combiné' : bet.betType === 'live' ? 'Live' : bet.betType} />
          <DetailRow label="Date" value={new Date(bet.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} />
          <DetailRow label="Mise" value={`${bet.stake.toFixed(2)} ${user.currency}${bet.stakeMode === 'pct' ? ` (${bet.stakePct}%)` : ''}`} />
          <DetailRow label="Cote" value={bet.odd?.toFixed(2)} />
          {bet.status !== 'pending' && (
            <DetailRow label="Résultat" value={formatCurrencyPrecise(profit)} color={profit >= 0 ? 'var(--win-500)' : profit < 0 ? 'var(--loss-500)' : 'var(--fg-3)'} noBorder />
          )}
        </div>

        {/* Combiné : liste des matchs */}
        {isCombo && bet.matches?.length > 0 && (
          <>
            <h3 className="h3 mb-3">Matchs du combiné</h3>
            <div className="space-y-2 mb-4">
              {bet.matches.map((m, i) => {
                const t = TOURNAMENTS.find(x => x.id === m.tournamentId)
                return (
                  <div key={i} className="card p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="micro text-fg-3">Match {i + 1}{m.round ? ` · ${ROUND_LABEL[m.round] || m.round}` : ''}</span>
                      <span className="font-bold" style={{ color: 'var(--blue-500)', fontSize: 14 }}>{m.odd?.toFixed(2)}</span>
                    </div>
                    {m.players?.length > 0 && (
                      <div className="text-sm">
                        {m.players.join(' vs ')}
                      </div>
                    )}
                    {t && <div className="caption mt-1">{t.flag} {t.name}</div>}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Actions */}
        {bet.status === 'pending' && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => settleBet(bet.id, 'won')}
              className="btn-primary"
              style={{ background: 'var(--win-500)', boxShadow: 'none' }}
            >
              <Icon name="check" size={16} /> Gagné
            </button>
            <button
              onClick={() => settleBet(bet.id, 'lost')}
              className="btn-primary"
              style={{ background: 'var(--loss-500)', boxShadow: 'none' }}
            >
              <Icon name="close" size={16} /> Perdu
            </button>
          </div>
        )}

        <button onClick={handleDelete} className="btn-ghost w-full" style={{ color: 'var(--loss-400)', borderColor: 'rgba(239,68,68,0.3)' }}>
          <Icon name="trash" size={14} /> Supprimer ce pari
        </button>
      </div>
    </>
  )
}

function DetailRow({ label, value, color, icon, badge, noBorder }) {
  return (
    <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: noBorder ? 'none' : '1px solid var(--ink-600)' }}>
      <span className="field-label" style={{ marginBottom: 0 }}>{label}</span>
      <span className="flex items-center gap-2 text-right font-semibold text-sm" style={{ color: color || 'var(--fg-1)' }}>
        {icon && <span>{icon}</span>}
        <span>{value}</span>
        {badge && <Icon name="crown" size={14} color="gold" />}
      </span>
    </div>
  )
}
