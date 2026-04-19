import React from 'react'
import Icon from './Icon.jsx'
import { useApp } from '../contexts/AppContext.jsx'
import { TOURNAMENTS } from '../data/tournaments.js'
import { betProfit, formatCurrencyPrecise } from '../utils/stats.js'

export default function BetCard({ bet, onSettle, onDelete, showDate = false }) {
  const { findPlayer } = useApp()
  const tournament = TOURNAMENTS.find(t => t.id === bet.tournamentId)
  const profit = betProfit(bet)
  const isLive = bet.betType === 'live' || bet.mode === 'live'

  const statusColor = {
    won: 'var(--win-500)',
    lost: 'var(--loss-500)',
    void: 'var(--fg-3)',
    cashout: 'var(--gold-400)',
    pending: 'var(--blue-500)',
  }[bet.status]

  return (
    <div className="card p-3 animate-fade-in">
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {showDate && (
            <span
              className="chip active"
              style={{ fontSize: 11, padding: '4px 10px', textTransform: 'none', fontStyle: 'normal', letterSpacing: 0 }}
            >
              {new Date(bet.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
            </span>
          )}
          {tournament && (
            <span className="micro text-fg-3 truncate flex items-center gap-1">
              <span>{tournament.flag}</span>
              <span className="truncate">{tournament.name}</span>
            </span>
          )}
        </div>
        {isLive && (
          <span className="flex items-center gap-1" style={{ fontSize: 10, fontWeight: 700, color: 'var(--loss-400)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--loss-400)' }} />
            LIVE
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        {(bet.players || []).map((name, i) => {
          const p = findPlayer(name) || { flag: '🌍' }
          const isFirst = i === 0
          return (
            <div key={i} className="flex items-center justify-between gap-2 rounded-lg px-3 py-2" style={{ background: 'var(--ink-700)' }}>
              <div className="flex items-center gap-2 min-w-0">
                <span style={{ fontSize: 14 }}>{p.flag || '🌍'}</span>
                <span className="text-sm font-semibold truncate">{name}</span>
              </div>
              {isFirst && (
                <span className="font-bold text-sm flex-shrink-0" style={{ color: 'var(--blue-500)' }}>
                  {bet.odd?.toFixed(2)}
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid var(--ink-600)' }}>
        <div className="flex items-center gap-2">
          <span className="micro text-fg-3">Mise</span>
          <span className="text-sm font-bold">{bet.stake}€</span>
        </div>
        <div className="flex items-center gap-2">
          {bet.status === 'pending' ? (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); onSettle?.(bet.id, 'won') }}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(34,197,94,0.2)', color: 'var(--win-500)', border: 'none', cursor: 'pointer' }}
                aria-label="Gagné"
              >
                <Icon name="check" size={14} strokeWidth={3} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onSettle?.(bet.id, 'lost') }}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(239,68,68,0.2)', color: 'var(--loss-500)', border: 'none', cursor: 'pointer' }}
                aria-label="Perdu"
              >
                <Icon name="close" size={14} strokeWidth={3} />
              </button>
            </div>
          ) : (
            <span className="text-sm font-bold" style={{ color: statusColor }}>
              {formatCurrencyPrecise(profit)}
            </span>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(bet.id) }}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'var(--ink-700)', color: 'var(--fg-3)', border: 'none', cursor: 'pointer' }}
              aria-label="Supprimer"
            >
              <Icon name="trash" size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
