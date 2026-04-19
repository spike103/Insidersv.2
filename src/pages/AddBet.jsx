import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import Icon from '../components/Icon.jsx'
import { useApp } from '../contexts/AppContext.jsx'
import { SURFACES } from '../data/players.js'
import { TOURNAMENTS, tournamentsOnDate } from '../data/tournaments.js'

// Rounds / tour du tournoi
const ROUNDS = [
  { id: 'R128', label: '1er tour (R128)' },
  { id: 'R64', label: '2e tour (R64)' },
  { id: 'R32', label: '3e tour (R32)' },
  { id: 'R16', label: '1/8 (R16)' },
  { id: 'QF', label: 'Quart de finale' },
  { id: 'SF', label: 'Demi-finale' },
  { id: 'F', label: 'Finale' },
  { id: 'Qualif', label: 'Qualifications' },
]

export default function AddBet() {
  const navigate = useNavigate()
  const { addBet, allPlayers, allBetTypes, addCustomBetType, user } = useApp()

  const [mode, setMode] = useState('simple') // simple | combine | live

  // Matchs : pour simple/live = 1 match, pour combiné = N matchs
  const [matches, setMatches] = useState([
    { player1: '', player2: '', tournamentId: '', round: '', odd: '1.85' },
  ])
  const [focusField, setFocusField] = useState(null) // { matchIdx, field: 'p1'|'p2' } | null
  const [query, setQuery] = useState('')

  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)

  // Surface / circuit (auto-remplis mais modifiables)
  const [surface, setSurface] = useState('Hard')
  const [tour, setTour] = useState('ATP')

  const [betType, setBetType] = useState('vainqueur')
  const [stakeMode, setStakeMode] = useState('eur')
  const [stake, setStake] = useState(user?.strategy?.flatAmount ? String(user.strategy.flatAmount) : '10')
  const [stakePct, setStakePct] = useState(user?.strategy?.percentAmount ? String(user.strategy.percentAmount) : '2')
  const [status, setStatus] = useState('pending')

  const [showCustomBet, setShowCustomBet] = useState(false)
  const [customLabel, setCustomLabel] = useState('')

  const availableTournaments = useMemo(() => tournamentsOnDate(date), [date])

  // Mode combiné : 2 matchs par défaut
  useEffect(() => {
    if (mode === 'combine' && matches.length < 2) {
      setMatches([...matches, { player1: '', player2: '', tournamentId: '', round: '', odd: '1.85' }])
    }
    if (mode !== 'combine' && matches.length > 1) {
      setMatches([matches[0]])
    }
  }, [mode])

  const updateMatch = (idx, patch) => {
    setMatches(prev => prev.map((m, i) => i === idx ? { ...m, ...patch } : m))
  }

  const addMatch = () => setMatches([...matches, { player1: '', player2: '', tournamentId: '', round: '', odd: '1.85' }])
  const removeMatch = (idx) => setMatches(matches.filter((_, i) => i !== idx))

  // Auto-détection surface/tour depuis 1er match
  useEffect(() => {
    const m0 = matches[0]
    if (!m0?.tournamentId) return
    const t = TOURNAMENTS.find(x => x.id === m0.tournamentId)
    if (!t) return
    setSurface(t.surface)
    if (t.tour === 'ATP') setTour('ATP')
    else if (t.tour === 'WTA') setTour('WTA')
  }, [matches[0]?.tournamentId])

  useEffect(() => {
    const name = matches[0]?.player1
    if (!name) return
    const p = allPlayers.find(x => x.name === name)
    if (p && p.tour && p.tour !== 'Mixte') setTour(p.tour)
  }, [matches[0]?.player1])

  useEffect(() => {
    if (mode === 'live') setBetType('live')
  }, [mode])

  const suggestions = useMemo(() => {
    if (!focusField || !query) return []
    const q = query.toLowerCase()
    return allPlayers.filter(p => p.name.toLowerCase().includes(q)).slice(0, 6)
  }, [allPlayers, query, focusField])

  const pickPlayer = (name) => {
    if (!focusField) return
    updateMatch(focusField.matchIdx, { [focusField.field]: name })
    setQuery('')
    setFocusField(null)
  }

  const addCustomPlayer = () => {
    const name = query.trim()
    if (!name || !focusField) return
    updateMatch(focusField.matchIdx, { [focusField.field]: name })
    setQuery('')
    setFocusField(null)
  }

  // Cote combinée = produit des cotes
  const combinedOdd = useMemo(() => {
    if (mode !== 'combine') return Number(matches[0]?.odd || 1)
    return matches.reduce((acc, m) => acc * (Number(m.odd) || 1), 1)
  }, [matches, mode])

  const effectiveStake = useMemo(() => {
    if (stakeMode === 'pct') {
      const br = user?.bankrollStart || 500
      return +(br * (Number(stakePct) || 0) / 100).toFixed(2)
    }
    return Number(stake) || 0
  }, [stake, stakePct, stakeMode, user])

  const potentialGain = useMemo(() => {
    return +(effectiveStake * (combinedOdd - 1)).toFixed(2)
  }, [effectiveStake, combinedOdd])

  const canSubmit = matches.every(m => m.player1?.trim() && Number(m.odd) > 1) && effectiveStake > 0

  const submit = () => {
    if (!canSubmit) return

    // Pour simple/live : 1 match = 1 pari
    // Pour combiné : on stocke tous les joueurs + une cote combinée + list des matches
    if (mode === 'combine') {
      const allPlayersInCombo = matches.flatMap(m => [m.player1, m.player2].filter(Boolean))
      const firstTournament = matches[0].tournamentId
      addBet({
        players: allPlayersInCombo,
        tournamentId: firstTournament || null,
        surface, tour,
        betType: 'combine',
        stake: effectiveStake,
        stakeMode, stakePct: stakeMode === 'pct' ? Number(stakePct) : null,
        odd: combinedOdd,
        date: new Date(date + 'T12:00:00').toISOString(),
        status,
        mode: 'combine',
        matches: matches.map(m => ({
          players: [m.player1, m.player2].filter(Boolean),
          tournamentId: m.tournamentId,
          round: m.round,
          odd: Number(m.odd),
        })),
      })
    } else {
      const m = matches[0]
      addBet({
        players: [m.player1, m.player2].filter(Boolean),
        tournamentId: m.tournamentId || null,
        round: m.round || null,
        surface, tour,
        betType: mode === 'live' ? 'live' : betType,
        stake: effectiveStake,
        stakeMode, stakePct: stakeMode === 'pct' ? Number(stakePct) : null,
        odd: Number(m.odd),
        date: new Date(date + 'T12:00:00').toISOString(),
        status,
        mode,
      })
    }
    navigate('/')
  }

  const addCustom = () => {
    if (!customLabel.trim()) return
    addCustomBetType(customLabel.trim())
    setCustomLabel('')
    setShowCustomBet(false)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Ajouter un pari" showBack />

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 pt-2" style={{ paddingBottom: 120 }}>
        {/* Mode tabs */}
        <div className="segmented mb-5">
          {[
            { id: 'simple', label: 'Simple' },
            { id: 'combine', label: 'Combiné' },
            { id: 'live', label: 'Live' },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`seg-btn ${mode === m.id ? 'active' : ''}`}
              style={mode === m.id && m.id === 'live' ? { background: 'var(--loss-500)' } : {}}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Date du match — pleine largeur */}
        <section className="mb-5">
          <label className="field-label">Date du match</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ width: '100%', display: 'block', boxSizing: 'border-box' }}
          />
        </section>

        {/* Matchs (1 pour simple/live, N pour combiné) */}
        {matches.map((match, idx) => (
          <MatchBlock
            key={idx}
            idx={idx}
            match={match}
            showRemove={mode === 'combine' && matches.length > 2}
            availableTournaments={availableTournaments}
            onUpdate={(patch) => updateMatch(idx, patch)}
            onRemove={() => removeMatch(idx)}
            focusField={focusField}
            setFocusField={setFocusField}
            query={query}
            setQuery={setQuery}
            suggestions={suggestions}
            pickPlayer={pickPlayer}
            addCustomPlayer={addCustomPlayer}
            mode={mode}
          />
        ))}

        {mode === 'combine' && (
          <button
            onClick={addMatch}
            className="btn-ghost w-full mb-5"
          >
            <Icon name="add" size={16} color="white" />
            Ajouter un match au combiné
          </button>
        )}

        {/* Circuit + Surface */}
        <section className="mb-5 grid grid-cols-2 gap-2">
          <div>
            <label className="field-label">Circuit</label>
            <select value={tour} onChange={(e) => setTour(e.target.value)}>
              <option value="ATP">ATP</option>
              <option value="WTA">WTA</option>
            </select>
          </div>
          <div>
            <label className="field-label">Surface</label>
            <select value={surface} onChange={(e) => setSurface(e.target.value)}>
              {SURFACES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
        </section>

        {/* Type de pari (masqué en live/combiné) */}
        {mode === 'simple' && (
          <section className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="field-label" style={{ marginBottom: 0 }}>Type de pari</label>
              <button onClick={() => setShowCustomBet(!showCustomBet)} className="micro" style={{ color: 'var(--blue-500)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                + Personnalisé
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {allBetTypes.map(t => (
                <button
                  key={t.id}
                  onClick={() => setBetType(t.id)}
                  className="card p-3 flex items-center gap-2 text-left"
                  style={betType === t.id ? { borderColor: 'var(--blue-500)', borderWidth: 1.5, boxShadow: 'var(--glow-blue-soft)', background: 'var(--ink-800)', cursor: 'pointer' } : { cursor: 'pointer' }}
                >
                  <span style={{ fontSize: 16 }}>{t.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }} className="truncate">{t.label}</span>
                </button>
              ))}
            </div>
            {showCustomBet && (
              <div className="flex gap-2 mt-2">
                <input placeholder="Nom du type personnalisé" value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} />
                <button onClick={addCustom} className="btn-primary" style={{ width: 'auto', padding: '10px 14px' }}>
                  <Icon name="check" size={16} />
                </button>
              </div>
            )}
          </section>
        )}

        {/* Mise & cote */}
        <section className="mb-5">
          <div className="segmented mb-3" style={{ fontSize: 12 }}>
            <button onClick={() => setStakeMode('eur')} className={`seg-btn ${stakeMode === 'eur' ? 'active' : ''}`} style={{ padding: '10px' }}>€</button>
            <button onClick={() => setStakeMode('pct')} className={`seg-btn ${stakeMode === 'pct' ? 'active' : ''}`} style={{ padding: '10px' }}>%</button>
          </div>
          <label className="field-label">
            {stakeMode === 'eur' ? `Mise (${user?.currency || '€'})` : 'Mise (% de bankroll)'}
          </label>
          {stakeMode === 'eur' ? (
            <input type="number" inputMode="decimal" placeholder="10" value={stake} onChange={(e) => setStake(e.target.value)} />
          ) : (
            <input type="number" inputMode="decimal" step="0.1" placeholder="2" value={stakePct} onChange={(e) => setStakePct(e.target.value)} />
          )}
          {stakeMode === 'pct' && (
            <div className="caption mt-2">Mise effective : <b>{effectiveStake.toFixed(2)} {user?.currency || '€'}</b></div>
          )}
          {mode === 'combine' && (
            <div className="caption mt-2">Cote combinée : <b style={{ color: 'var(--blue-500)' }}>{combinedOdd.toFixed(2)}</b></div>
          )}
        </section>

        {/* Statut */}
        <section className="mb-5">
          <label className="field-label">Statut</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="pending">En cours</option>
            <option value="won">Gagné</option>
            <option value="lost">Perdu</option>
            <option value="void">Remboursé</option>
          </select>
        </section>

        {canSubmit && (
          <div className="card p-4 mb-4" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.02))', borderColor: 'rgba(34,197,94,0.3)' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="field-label" style={{ marginBottom: 2 }}>Gain potentiel</div>
                <div className="stat-value text-win" style={{ fontSize: 24 }}>
                  +{potentialGain.toFixed(2)} {user?.currency || '€'}
                </div>
              </div>
              <div className="text-right caption">
                <div>Mise : {effectiveStake.toFixed(2)} {user?.currency || '€'}</div>
                <div>Cote : {combinedOdd.toFixed(2)}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bouton sticky bottom */}
      <div
        className="fixed left-0 right-0 px-5 py-3 safe-bottom"
        style={{
          bottom: 0,
          background: 'var(--ink-900)',
          borderTop: '1px solid var(--ink-600)',
          zIndex: 50,
        }}
      >
        <button onClick={submit} disabled={!canSubmit} className="btn-primary">
          Enregistrer le pari
        </button>
      </div>
    </div>
  )
}

function MatchBlock({ idx, match, showRemove, availableTournaments, onUpdate, onRemove, focusField, setFocusField, query, setQuery, suggestions, pickPlayer, addCustomPlayer, mode }) {
  const isFocused = (field) => focusField?.matchIdx === idx && focusField?.field === field

  return (
    <section className="card mb-4" style={{ padding: 14 }}>
      {mode === 'combine' && (
        <div className="flex items-center justify-between mb-3">
          <span className="field-label" style={{ marginBottom: 0, color: 'var(--blue-500)' }}>Match {idx + 1}</span>
          {showRemove && (
            <button onClick={onRemove} className="w-7 h-7 flex items-center justify-center" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <Icon name="clear" size={16} color="muted" />
            </button>
          )}
        </div>
      )}

      <div className="space-y-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Joueur 1"
            value={isFocused('player1') ? query : match.player1}
            onFocus={() => { setFocusField({ matchIdx: idx, field: 'player1' }); setQuery(match.player1) }}
            onBlur={() => setTimeout(() => setFocusField(null), 200)}
            onChange={(e) => setQuery(e.target.value)}
          />
          {isFocused('player1') && query && (
            <SuggestionList suggestions={suggestions} query={query} onPick={pickPlayer} onAddCustom={addCustomPlayer} />
          )}
        </div>
        <div className="text-center micro text-fg-3" style={{ fontStyle: 'italic', fontWeight: 700, padding: '2px 0' }}>vs</div>
        <div className="relative">
          <input
            type="text"
            placeholder="Joueur 2 (optionnel)"
            value={isFocused('player2') ? query : match.player2}
            onFocus={() => { setFocusField({ matchIdx: idx, field: 'player2' }); setQuery(match.player2) }}
            onBlur={() => setTimeout(() => setFocusField(null), 200)}
            onChange={(e) => setQuery(e.target.value)}
          />
          {isFocused('player2') && query && (
            <SuggestionList suggestions={suggestions} query={query} onPick={pickPlayer} onAddCustom={addCustomPlayer} />
          )}
        </div>
      </div>

      {/* Tournoi */}
      <div className="mt-3">
        <label className="field-label">
          Tournoi {availableTournaments.length > 0 ? `· ${availableTournaments.length} actif${availableTournaments.length > 1 ? 's' : ''}` : '· aucun à cette date'}
        </label>
        <select
          value={match.tournamentId}
          onChange={(e) => onUpdate({ tournamentId: e.target.value })}
        >
          <option value="">Sélectionner un tournoi</option>
          {availableTournaments.length === 0 && (
            <optgroup label="Tous les tournois">
              {TOURNAMENTS.map(t => (
                <option key={t.id} value={t.id}>{t.flag} {t.name} — {t.category}</option>
              ))}
            </optgroup>
          )}
          {availableTournaments.length > 0 && availableTournaments.map(t => (
            <option key={t.id} value={t.id}>{t.flag} {t.name} — {t.category}</option>
          ))}
        </select>
        {match.tournamentId && (
          <div className="caption mt-1">
            {(() => {
              const t = TOURNAMENTS.find(x => x.id === match.tournamentId)
              return t ? `${t.category} · ${t.surface} · ${t.dates}` : ''
            })()}
          </div>
        )}
      </div>

      {/* Tour du tournoi */}
      <div className="mt-3">
        <label className="field-label">Tour du tournoi</label>
        <select value={match.round} onChange={(e) => onUpdate({ round: e.target.value })}>
          <option value="">—</option>
          {ROUNDS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
      </div>

      {/* Cote (pour ce match) */}
      <div className="mt-3">
        <label className="field-label">Cote</label>
        <input
          type="number" inputMode="decimal" step="0.01"
          placeholder="1.85" value={match.odd}
          onChange={(e) => onUpdate({ odd: e.target.value })}
        />
      </div>
    </section>
  )
}

function SuggestionList({ suggestions, query, onPick, onAddCustom }) {
  return (
    <div
      className="absolute top-full left-0 right-0 z-20 mt-1 card overflow-hidden"
      style={{ maxHeight: 256, overflowY: 'auto' }}
    >
      {suggestions.map(s => (
        <button
          key={s.id}
          onMouseDown={(e) => { e.preventDefault(); onPick(s.name) }}
          className="w-full flex items-center gap-2 p-3 text-left"
          style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--ink-600)', cursor: 'pointer' }}
        >
          <span style={{ fontSize: 18 }}>{s.flag || '🌍'}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{s.name}</div>
            <div className="micro text-fg-3">{s.tour}{s.rank ? ` · #${s.rank}` : ''}{s.custom ? ' · perso' : ''}</div>
          </div>
        </button>
      ))}
      {!suggestions.some(s => s.name.toLowerCase() === query.toLowerCase()) && query.trim() && (
        <button
          onMouseDown={(e) => { e.preventDefault(); onAddCustom() }}
          className="w-full flex items-center gap-2 p-3 text-left"
          style={{ background: 'rgba(41,98,255,0.08)', border: 'none', cursor: 'pointer' }}
        >
          <Icon name="add" size={18} color="blue" />
          <span className="text-sm font-semibold" style={{ color: 'var(--blue-500)' }}>Ajouter « {query} » comme nouveau joueur</span>
        </button>
      )}
    </div>
  )
}
