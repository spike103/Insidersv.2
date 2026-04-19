import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { DEFAULT_BET_TYPES } from '../data/betTypes.js'
import { PLAYERS } from '../data/players.js'

const AppContext = createContext(null)
export const useApp = () => useContext(AppContext)

const STORAGE_KEY = 'insiders_app_v2'

const DEFAULT_STRATEGY = {
  type: 'flat', flatAmount: 10, percentAmount: 2,
  maxStake: 50, minOdd: 1.4, maxOdd: 3.5,
  maxBetsPerDay: 5, cooldownAfterLoss: 30,
}

const DEFAULT_GOALS = {
  monthlyProfit: 200, monthlyROI: 8,
  maxDrawdown: 100, minWinRate: 55,
}

function loadState() {
  try { const raw = localStorage.getItem(STORAGE_KEY); if (!raw) return null; return JSON.parse(raw) }
  catch { return null }
}
function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
}

function createDefaultUser(pseudo) {
  return {
    pseudo,
    createdAt: new Date().toISOString(),
    bankrollStart: 500, bankrollCurrent: 500, currency: '€',
    bets: [],
    strategy: { ...DEFAULT_STRATEGY },
    goals: { ...DEFAULT_GOALS },
    customBetTypes: [],
    customPlayers: [],
    onboardingDone: false,
    alertsIgnored: [],
  }
}

export function AppProvider({ children }) {
  const [state, setState] = useState(() => loadState() || { users: {}, currentUser: null })
  useEffect(() => { saveState(state) }, [state])

  const user = state.currentUser ? state.users[state.currentUser] : null

  const login = (pseudo) => {
    const clean = pseudo.trim()
    if (!clean) return
    setState(prev => {
      const users = { ...prev.users }
      if (!users[clean]) users[clean] = createDefaultUser(clean)
      return { ...prev, users, currentUser: clean }
    })
  }
  const logout = () => setState(prev => ({ ...prev, currentUser: null }))
  const resetCurrentUser = () => {
    if (!state.currentUser) return
    setState(prev => {
      const users = { ...prev.users }
      users[prev.currentUser] = createDefaultUser(prev.currentUser)
      users[prev.currentUser].onboardingDone = true
      return { ...prev, users }
    })
  }
  const deleteCurrentUser = () => {
    if (!state.currentUser) return
    setState(prev => {
      const users = { ...prev.users }
      delete users[prev.currentUser]
      return { ...prev, users, currentUser: null }
    })
  }
  const updateUser = (patch) => {
    if (!state.currentUser) return
    setState(prev => ({
      ...prev,
      users: { ...prev.users, [prev.currentUser]: { ...prev.users[prev.currentUser], ...patch } },
    }))
  }
  const setBankroll = (value) => updateUser({ bankrollStart: value, bankrollCurrent: value })
  const setCurrency = (currency) => updateUser({ currency })
  const setOnboardingDone = () => updateUser({ onboardingDone: true })
  const updateStrategy = (patch) => updateUser({ strategy: { ...user.strategy, ...patch } })
  const updateGoals = (patch) => updateUser({ goals: { ...user.goals, ...patch } })
  const ignoreAlert = (id) => updateUser({ alertsIgnored: [...(user.alertsIgnored || []), id] })

  // Ajoute automatiquement un joueur à la liste custom s'il n'existe pas déjà
  const ensurePlayer = (name, meta = {}) => {
    if (!user || !name?.trim()) return
    const clean = name.trim()
    // déjà présent dans PLAYERS officiels ?
    if (PLAYERS.some(p => p.name.toLowerCase() === clean.toLowerCase())) return
    // déjà dans customPlayers ?
    if ((user.customPlayers || []).some(p => p.name.toLowerCase() === clean.toLowerCase())) return
    const id = `custom_p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const newPlayer = {
      id, name: clean,
      tour: meta.tour || 'ATP',
      country: meta.country || 'INT',
      flag: meta.flag || '🌍',
      rank: null,
      bestSurface: meta.surface || 'Hard',
      custom: true,
    }
    updateUser({ customPlayers: [...(user.customPlayers || []), newPlayer] })
  }

  const addBet = (bet) => {
    if (!state.currentUser) return
    // auto-ajout des joueurs saisis
    ;(bet.players || []).forEach(p => ensurePlayer(p, { tour: bet.tour, surface: bet.surface }))
    const newBet = {
      id: `bet_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      status: bet.status || 'pending',
      ...bet,
    }
    setState(prev => {
      const u = prev.users[prev.currentUser]
      return { ...prev, users: { ...prev.users, [prev.currentUser]: { ...u, bets: [...u.bets, newBet] } } }
    })
    return newBet
  }
  const updateBet = (id, patch) => {
    if (!state.currentUser) return
    setState(prev => {
      const u = prev.users[prev.currentUser]
      return { ...prev, users: { ...prev.users, [prev.currentUser]: { ...u, bets: u.bets.map(b => b.id === id ? { ...b, ...patch } : b) } } }
    })
  }
  const deleteBet = (id) => {
    if (!state.currentUser) return
    setState(prev => {
      const u = prev.users[prev.currentUser]
      return { ...prev, users: { ...prev.users, [prev.currentUser]: { ...u, bets: u.bets.filter(b => b.id !== id) } } }
    })
  }
  const settleBet = (id, status, cashout) => {
    const patch = { status }
    if (status === 'cashout' && cashout != null) patch.cashout = cashout
    updateBet(id, patch)
  }

  const addCustomBetType = (label, icon = '✏️') => {
    if (!user) return
    const id = `custom_${Date.now()}`
    updateUser({ customBetTypes: [...(user.customBetTypes || []), { id, label, icon, custom: true }] })
  }
  const removeCustomBetType = (id) => {
    if (!user) return
    updateUser({ customBetTypes: (user.customBetTypes || []).filter(t => t.id !== id) })
  }

  const removeCustomPlayer = (id) => {
    if (!user) return
    updateUser({ customPlayers: (user.customPlayers || []).filter(p => p.id !== id) })
  }

  const allBetTypes = useMemo(() => [...DEFAULT_BET_TYPES, ...(user?.customBetTypes || [])], [user])
  const allPlayers = useMemo(() => [...PLAYERS, ...(user?.customPlayers || [])], [user])

  // Trouver un joueur par id ou par nom
  const findPlayer = (idOrName) => {
    if (!idOrName) return null
    return allPlayers.find(p => p.id === idOrName || p.name === idOrName)
  }

  const seedDemoData = () => {
    if (!user) return
    const now = new Date()
    const daysAgo = (d) => { const x = new Date(now); x.setDate(x.getDate() - d); return x.toISOString() }
    const demo = [
      { id: 'seed_1', createdAt: daysAgo(28), date: daysAgo(28), status: 'won', stake: 20, odd: 1.85, players: ['Jannik Sinner'], tour: 'ATP', surface: 'Hard', betType: 'vainqueur', tournamentId: 't_ao' },
      { id: 'seed_2', createdAt: daysAgo(25), date: daysAgo(25), status: 'lost', stake: 25, odd: 2.10, players: ['Novak Djokovic'], tour: 'ATP', surface: 'Hard', betType: 'vainqueur', tournamentId: 't_ao' },
      { id: 'seed_3', createdAt: daysAgo(22), date: daysAgo(22), status: 'lost', stake: 30, odd: 1.95, players: ['Novak Djokovic'], tour: 'ATP', surface: 'Hard', betType: 'set_gagnant', tournamentId: 't_doha' },
      { id: 'seed_4', createdAt: daysAgo(20), date: daysAgo(20), status: 'won', stake: 15, odd: 2.50, players: ['Carlos Alcaraz'], tour: 'ATP', surface: 'Hard', betType: 'vainqueur', tournamentId: 't_dubai' },
      { id: 'seed_5', createdAt: daysAgo(18), date: daysAgo(18), status: 'lost', stake: 40, odd: 1.75, players: ['Novak Djokovic'], tour: 'ATP', surface: 'Hard', betType: 'live', tournamentId: 't_dubai' },
      { id: 'seed_6', createdAt: daysAgo(15), date: daysAgo(15), status: 'lost', stake: 20, odd: 2.20, players: ['Iga Świątek'], tour: 'WTA', surface: 'Clay', betType: 'vainqueur', tournamentId: 't_indian_wells' },
      { id: 'seed_7', createdAt: daysAgo(12), date: daysAgo(12), status: 'lost', stake: 25, odd: 1.90, players: ['Aryna Sabalenka'], tour: 'WTA', surface: 'Hard', betType: 'live', tournamentId: 't_miami' },
      { id: 'seed_8', createdAt: daysAgo(10), date: daysAgo(10), status: 'won', stake: 30, odd: 2.05, players: ['Jannik Sinner'], tour: 'ATP', surface: 'Hard', betType: 'vainqueur', tournamentId: 't_miami' },
      { id: 'seed_9', createdAt: daysAgo(7), date: daysAgo(7), status: 'won', stake: 20, odd: 1.80, players: ['Carlos Alcaraz'], tour: 'ATP', surface: 'Clay', betType: 'set_gagnant', tournamentId: 't_monte_carlo' },
      { id: 'seed_10', createdAt: daysAgo(5), date: daysAgo(5), status: 'lost', stake: 35, odd: 2.30, players: ['Novak Djokovic'], tour: 'ATP', surface: 'Clay', betType: 'live', tournamentId: 't_monte_carlo' },
      { id: 'seed_11', createdAt: daysAgo(3), date: daysAgo(3), status: 'won', stake: 25, odd: 1.95, players: ['Lorenzo Musetti'], tour: 'ATP', surface: 'Clay', betType: 'vainqueur', tournamentId: 't_monte_carlo' },
      { id: 'seed_12', createdAt: daysAgo(2), date: daysAgo(2), status: 'won', stake: 20, odd: 2.40, players: ['Arthur Fils'], tour: 'ATP', surface: 'Clay', betType: 'vainqueur', tournamentId: 't_monte_carlo' },
      { id: 'seed_13', createdAt: daysAgo(1), date: daysAgo(1), status: 'lost', stake: 15, odd: 2.15, players: ['Ons Jabeur'], tour: 'WTA', surface: 'Clay', betType: 'vainqueur', tournamentId: 't_madrid' },
      { id: 'seed_14', createdAt: daysAgo(0), date: daysAgo(0), status: 'pending', stake: 20, odd: 1.75, players: ['Jannik Sinner'], tour: 'ATP', surface: 'Clay', betType: 'vainqueur', tournamentId: 't_madrid' },
    ].map(b => ({ ...b, id: `demo_${b.id}` }))
    setState(prev => {
      const u = prev.users[prev.currentUser]
      return { ...prev, users: { ...prev.users, [prev.currentUser]: { ...u, bets: [...u.bets, ...demo] } } }
    })
  }

  // Coins = nombre de paris gagnants (commence à 0)
  const coins = useMemo(() => {
    if (!user) return 0
    return (user.bets || []).filter(b => b.status === 'won').length
  }, [user])

  // Notifications = insights non ignorés
  const notifications = useMemo(() => {
    if (!user) return []
    const list = []
    const bets = user.bets || []
    const liveBets = bets.filter(b => b.betType === 'live' || b.mode === 'live')
    if (liveBets.length >= 3) {
      const liveRoi = liveBets.filter(b => b.status !== 'pending').length > 0
        ? (liveBets.reduce((a, b) => a + (b.status === 'won' ? b.stake * (b.odd - 1) : b.status === 'lost' ? -b.stake : 0), 0) / liveBets.filter(b => b.status !== 'pending').reduce((a, b) => a + b.stake, 0)) * 100
        : 0
      if (liveRoi < -10 && !(user.alertsIgnored || []).includes('alert_live_sunday')) {
        list.push({
          id: 'alert_live_sunday',
          kind: 'warning',
          title: 'Les paris live te coûtent cher',
          body: `Tu perds ${Math.abs(liveRoi).toFixed(1)}% de ROI sur tes paris live. Limite ce type de pari.`,
        })
      }
    }
    const wonToday = bets.filter(b => b.status === 'won' && new Date(b.date).toDateString() === new Date().toDateString()).length
    if (wonToday >= 3) {
      list.push({
        id: 'alert_hot_today',
        kind: 'success',
        title: `🔥 ${wonToday} paris gagnés aujourd'hui`,
        body: 'Belle série ! N\'augmente pas tes mises sous l\'excitation.',
      })
    }
    return list
  }, [user])

  // Ajoute un joueur custom via Tennis page
  const addCustomPlayer = ({ firstName, lastName, country, tour, rank, flag }) => {
    if (!user) return
    const name = `${firstName.trim()} ${lastName.trim()}`.trim()
    if (!name) return
    if (PLAYERS.some(p => p.name.toLowerCase() === name.toLowerCase())) return
    if ((user.customPlayers || []).some(p => p.name.toLowerCase() === name.toLowerCase())) return
    const id = `custom_p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const newPlayer = {
      id, name,
      tour: tour || 'ATP',
      country: country || 'INT',
      flag: flag || '🌍',
      rank: rank ? Number(rank) : null,
      bestSurface: 'Hard',
      custom: true,
    }
    updateUser({ customPlayers: [...(user.customPlayers || []), newPlayer] })
    return newPlayer
  }

  const value = {
    state, user, isAuth: !!user, coins, notifications,
    login, logout, resetCurrentUser, deleteCurrentUser,
    updateUser, setBankroll, setCurrency, setOnboardingDone,
    updateStrategy, updateGoals, ignoreAlert,
    addBet, updateBet, deleteBet, settleBet,
    addCustomBetType, removeCustomBetType, allBetTypes,
    allPlayers, findPlayer, ensurePlayer, removeCustomPlayer, addCustomPlayer,
    seedDemoData,
  }
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
