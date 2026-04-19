import React, { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import Icon from '../components/Icon.jsx'
import { useApp } from '../contexts/AppContext.jsx'
import { SURFACES } from '../data/players.js'
import { TOURNAMENTS, tournamentsOnDate } from '../data/tournaments.js'

export default function AddBet() {
  const navigate = useNavigate()
  const { addBet, allPlayers, allBetTypes, addCustomBetType, user } = useApp()

  // Mode
  const [mode, setMode] = useState('simple') // simple | combine | live

  // Joueurs — toujours 2 pour tennis (match 1v1)
  const [player1, setPlayer1] = useState('')
  const [player2, setPlayer2] = useState('')
  const [focusField, setFocusField] = useState(null) // 'p1' | 'p2' | null
  const [query, setQuery] = useState('')

  // Date + tournoi filtré par date
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [tournamentId, setTournamentId] = useState('')

  // Champs auto-remplis depuis tournoi sélectionné
  const [surface, setSurface] = useState('Hard')
  const [tour, setTour] = useState('ATP')
  const [betType, setBetType] = useState('vainqueur')

  // Mise / cote
  const [stakeMode, setStakeMode] = useState('eur') // 'eur' | 'pct'
  const [stake, setStake] = useState(user?.strategy?.flatAmount ? String(user.strategy.flatAmount) : '10')
  const [stakePct, setStakePct] = useState(user?.strategy?.percentAmount ? String(user.strategy.percentAmount) : '2')
  const [odd, setOdd] = useState('1.85')
  const [status, setStatus] = useState('pending')

  // Custom bet type
  const [showCustomBet, setShowCustomBet] = useState(false)
  const [customLabel, setCustomLabel] = useState('')

  // Tournois disponibles à cette date
  const availableTournaments = useMemo(() => tournamentsOnDate(date), [date])

  // Auto-reset tournoi si plus dispo à la date choisie
  useEffect(() => {
    if (tournamentId && !availableTournaments.some(t => t.id === tournamentId)) {
      setTournamentId('')
    }
  }, [date, availableTournaments, tournamentId])

  // Auto-remplissage depuis tournoi
  useEffect(() => {
    if (!tournamentId) return
    const t = TOURNAMENTS.find(x => x.id === tournamentId)
    if (!t) return
    setSurface(t.surface)
    // Pour les tournois mixtes, on laisse l'utilisateur choisir
    if (t.tour === 'ATP') setTour('ATP')
    else if (t.tour === 'WTA') setTour('WTA')
  }, [tournamentId])

  // Auto-détection du tour depuis le joueur 1
  useEffect(() => {
    if (!player1) return
    const p = allPlayers.find(x => x.name === player1)
    if (p && p.tour && p.tour !== 'Mixte') setTour(p.tour)
    if (p && p.bestSurface && !tournamentId) setSurface(p.bestSurface)
  }, [player1])

  // Si on passe en live, force le betType
  useEffect(() => {
    if (mode === 'live') setBetType('live')
  }, [mode])

  // Suggestions autocomplete joueurs
  const suggestions = useMemo(() => {
    if (!focusField || !query) return []
    const q = query.toLowerCase()
    return allPlayers
      .filter(p => p.name.toLowerCase().includes(q))
      .slice(0, 6)
  }, [allPlayers, query, focusField])

  const pickPlayer = (name) => {
    if (focusField === 'p1') setPlayer1(name)
    if (focusField === 'p2') setPlayer2(name)
    setQuery('')
    setFocusField(null)
  }

  const addCustomPlayer = () => {
    const name = query.trim()
    if (!name) return
    if (focusField === 'p1') setPlayer1(name)
    if (focusField === 'p2') setPlayer2(name)
    setQuery('')
    setFocusField(null)
  }

  // Stake effectif
  const effectiveStake = useMemo(() => {
    if (stakeMode === 'pct') {
      const br = user?.bankrollStart || 500
      return +(br * (Number(stakePct) || 0) / 100).toFixed(2)
    }
    return Number(stake) || 0
  }, [stake, stakePct, stakeMode, user])

  const potentialGain = useMemo(() => {
    return +(effectiveStake * ((Number(odd) || 1) - 1)).toFixed(2)
  }, [effectiveStake, odd])

  const canSubmit = player1.trim() && effectiveStake > 0 && Number(odd) > 1

  const submit = () => {
    if (!canSubmit) return
    const players = [player1.trim()]
    if (player2.trim()) players.push(player2.trim())
    addBet({
      players,
      tournamentId: tournamentId || null,
      surface, tour,
      betType: mode === 'live' ? 'live' : mode === 'combine' ? 'combine' : betType,
      stake: effectiveStake,
      stakeMode, stakePct: stakeMode === 'pct' ? Number(stakePct) : null,
      odd: Number(odd),
      date: new Date(date + 'T12:00:00').toISOString(),
      status,
      mode,
    })
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

      {/* Zone scrollable */}
      <div className="flex-1 overflow-y-auto px-5 pt-2" style={{ paddingBottom: 120 }}>
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

        {/* Joueurs */}
        <section className="mb-5">
          <label className="field-label">Joueurs du match</label>
          <div className="space-y-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Joueur 1"
                value={focusField === 'p1' ? query : player1}
                onFocus={() => { setFocusField('p1'); setQuery(player1) }}
                onBlur={() => setTimeout(() => setFocusField(null), 200)}
                onChange={(e) => setQuery(e.target.value)}
              />
              {focusField === 'p1' && query && (
                <SuggestionList
                  suggestions={suggestions}
                  query={query}
                  onPick={pickPlayer}
                  onAddCustom={addCustomPlayer}
                />
              )}
            </div>
            <div className="text-center micro text-fg-3 py-1">vs</div>
            <div className="relative">
              <input
                type="text"
                placeholder="Joueur 2"
                value={focusField === 'p2' ? query : player2}
                onFocus={() => { setFocusField('p2'); setQuery(player2) }}
                onBlur={() => setTimeout(() => setFocusField(null), 200)}
                onChange={(e) => setQuery(e.target.value)}
              />
              {focusField === 'p2' && query && (
                <SuggestionList
                  suggestions={suggestions}
                  query={query}
                  onPick={pickPlayer}
                  onAddCustom={addCustomPlayer}
                />
              )}
            </div>
          </div>
        </section>

        {/* Date */}
        <section className="mb-5">
          <label className="field-label">Date du match</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </section>

        {/* Tournoi filtré par date */}
        <section className="mb-5">
          <label className="field-label">
            Tournoi
            {availableTournaments.length > 0
              ? ` · ${availableTournaments.length} actif${availableTournaments.length > 1 ? 's' : ''} à cette date`
              : ' · aucun tournoi à cette date'
            }
          </label>
          {availableTournaments.length > 0 ? (
            <select value={tournamentId} onChange={(e) => setTournamentId(e.target.value)}>
              <option value="">Sélectionner un tournoi</option>
              {availableTournaments.map(t => (
                <option key={t.id} value={t.id}>
                  {t.flag} {t.name} — {t.category}
                </option>
              ))}
            </select>
          ) : (
            <div className="card p-3 caption" style={{ color: 'var(--fg-3)', textAlign: 'center' }}>
              Aucun tournoi le {new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })}.
              Change la date ou laisse vide.
            </div>
          )}
        </section>

        {/* Circuit + Surface (pré-remplis mais modifiables) */}
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

        {/* Type de pari (masqué en mode live/combine) */}
        {mode === 'simple' && (
          <section className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="field-label" style={{ marginBottom: 0 }}>Type de pari</label>
              <button onClick={() => setShowCustomBet(!showCustomBet)} className="micro" style={{ color: 'var(--blue-500)', fontWeight: 700, background: 'none', border: 'none' }}>
                + Personnalisé
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {allBetTypes.map(t => (
                <button
                  key={t.id}
                  onClick={() => setBetType(t.id)}
                  className="card p-3 flex items-center gap-2 text-left"
                  style={betType === t.id ? { borderColor: 'var(--blue-500)', borderWidth: 1.5, boxShadow: 'var(--glow-blue-soft)' } : {}}
                >
                  <span style={{ fontSize: 16 }}>{t.icon}</span>
                  <span className="text-xs font-semibold truncate" style={{ fontSize: 12 }}>{t.label}</span>
                </button>
              ))}
            </div>
            {showCustomBet && (
              <div className="flex gap-2 mt-2">
                <input
                  placeholder="Nom du type personnalisé"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                />
                <button onClick={addCustom} className="btn-primary" style={{ width: 'auto', padding: '10px 14px' }}>
                  <Icon name="check" size={16} />
                </button>
              </div>
            )}
          </section>
        )}

        {/* Mise + cote */}
        <section className="mb-5">
          <div className="segmented mb-3" style={{ fontSize: 12 }}>
            <button onClick={() => setStakeMode('eur')} className={`seg-btn ${stakeMode === 'eur' ? 'active' : ''}`} style={{ padding: '10px' }}>€</button>
            <button onClick={() => setStakeMode('pct')} className={`seg-btn ${stakeMode === 'pct' ? 'active' : ''}`} style={{ padding: '10px' }}>%</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="field-label">
                {stakeMode === 'eur' ? `Mise (${user?.currency || '€'})` : 'Mise (% bankroll)'}
              </label>
              {stakeMode === 'eur' ? (
                <input type="number" inputMode="decimal" placeholder="10" value={stake} onChange={(e) => setStake(e.target.value)} />
              ) : (
                <input type="number" inputMode="decimal" step="0.1" placeholder="2" value={stakePct} onChange={(e) => setStakePct(e.target.value)} />
              )}
            </div>
            <div>
              <label className="field-label">Cote</label>
              <input type="number" inputMode="decimal" step="0.01" placeholder="1.85" value={odd} onChange={(e) => setOdd(e.target.value)} />
            </div>
          </div>
          {stakeMode === 'pct' && (
            <div className="caption mt-2">Mise effective : <b>{effectiveStake.toFixed(2)} {user?.currency || '€'}</b></div>
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

        {/* Récap gain potentiel */}
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
                <div>Cote : {odd}</div>
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
          background: 'linear-gradient(to top, var(--ink-900) 85%, transparent)',
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
      {/* Option "ajouter en tant que nouveau joueur" */}
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
