import React, { useState } from 'react'
import TopBar from '../components/TopBar.jsx'
import Icon from '../components/Icon.jsx'
import { useApp } from '../contexts/AppContext.jsx'

export default function Settings() {
  const { user, logout, resetCurrentUser, deleteCurrentUser, updateStrategy, updateGoals, setBankroll, setCurrency, seedDemoData, removeCustomPlayer, removeCustomBetType } = useApp()
  const [bankroll, setBankrollValue] = useState(String(user?.bankrollStart || 500))
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!user) return null

  return (
    <>
      <TopBar title="Réglages" showBack />
      <div className="px-5 pt-2 pb-28 space-y-6">
        <section>
          <h2 className="field-label">Profil</h2>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2962ff, #5b83ff)', fontWeight: 700, fontSize: 16 }}>
                {user.pseudo.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="h3 truncate">{user.pseudo}</div>
                <div className="caption">Membre depuis le {new Date(user.createdAt).toLocaleDateString('fr-FR')}</div>
              </div>
              <button onClick={logout} className="btn-ghost" style={{ padding: '8px 12px', fontSize: 12 }}>
                <Icon name="logout" size={13} />
                Déconnexion
              </button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="field-label">Bankroll</h2>
          <div className="card p-4 space-y-3">
            <div>
              <label className="micro text-fg-3 block mb-2">Capital de départ ({user.currency})</label>
              <div className="flex gap-2">
                <input type="number" inputMode="decimal" value={bankroll} onChange={(e) => setBankrollValue(e.target.value)} />
                <button onClick={() => setBankroll(Number(bankroll) || 0)} className="btn-primary" style={{ width: 'auto', padding: '12px 16px' }}>
                  <Icon name="check" size={16} />
                </button>
              </div>
            </div>
            <div>
              <label className="micro text-fg-3 block mb-2">Devise</label>
              <select value={user.currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="€">Euro (€)</option>
                <option value="$">Dollar ($)</option>
                <option value="£">Livre (£)</option>
              </select>
            </div>
          </div>
        </section>

        <section>
          <h2 className="field-label">Stratégie de mise</h2>
          <div className="card p-4 space-y-3">
            <div>
              <label className="micro text-fg-3 block mb-2">Type de mise</label>
              <select value={user.strategy.type} onChange={(e) => updateStrategy({ type: e.target.value })}>
                <option value="flat">Mise fixe</option>
                <option value="percent">% de bankroll</option>
                <option value="kelly">Critère de Kelly</option>
              </select>
            </div>
            {user.strategy.type === 'flat' && (
              <div>
                <label className="micro text-fg-3 block mb-2">Mise ({user.currency})</label>
                <input type="number" value={user.strategy.flatAmount} onChange={(e) => updateStrategy({ flatAmount: Number(e.target.value) || 0 })} />
              </div>
            )}
            {user.strategy.type === 'percent' && (
              <div>
                <label className="micro text-fg-3 block mb-2">% de bankroll</label>
                <input type="number" step="0.1" value={user.strategy.percentAmount} onChange={(e) => updateStrategy({ percentAmount: Number(e.target.value) || 0 })} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="micro text-fg-3 block mb-2">Cote min</label>
                <input type="number" step="0.1" value={user.strategy.minOdd} onChange={(e) => updateStrategy({ minOdd: Number(e.target.value) || 0 })} />
              </div>
              <div>
                <label className="micro text-fg-3 block mb-2">Cote max</label>
                <input type="number" step="0.1" value={user.strategy.maxOdd} onChange={(e) => updateStrategy({ maxOdd: Number(e.target.value) || 0 })} />
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="field-label">Objectifs</h2>
          <div className="card p-4 grid grid-cols-2 gap-3">
            <div>
              <label className="micro text-fg-3 block mb-2">Profit mensuel ({user.currency})</label>
              <input type="number" value={user.goals.monthlyProfit} onChange={(e) => updateGoals({ monthlyProfit: Number(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="micro text-fg-3 block mb-2">ROI mensuel (%)</label>
              <input type="number" step="0.5" value={user.goals.monthlyROI} onChange={(e) => updateGoals({ monthlyROI: Number(e.target.value) || 0 })} />
            </div>
          </div>
        </section>

        {user.customPlayers?.length > 0 && (
          <section>
            <h2 className="field-label">Joueurs personnalisés ({user.customPlayers.length})</h2>
            <div className="card p-2 space-y-1">
              {user.customPlayers.map(p => (
                <div key={p.id} className="flex items-center justify-between px-2 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span>{p.flag}</span>
                    <span className="text-sm truncate">{p.name}</span>
                    <span className="micro text-fg-3">{p.tour}</span>
                  </div>
                  <button onClick={() => removeCustomPlayer(p.id)} className="w-8 h-8 flex items-center justify-center" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    <Icon name="clear" size={16} color="muted" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="field-label">Données</h2>
          <div className="space-y-2">
            <button onClick={seedDemoData} className="btn-ghost w-full">
              <Icon name="sparkle" size={15} /> Charger données de démo
            </button>
            {!confirmReset ? (
              <button onClick={() => setConfirmReset(true)} className="btn-ghost w-full" style={{ color: 'var(--gold-400)', borderColor: 'rgba(240,224,128,0.3)' }}>
                <Icon name="refresh" size={15} /> Réinitialiser mes données
              </button>
            ) : (
              <div className="card p-3 space-y-2" style={{ borderColor: 'rgba(240,224,128,0.4)' }}>
                <p className="caption">Toutes tes données seront effacées.</p>
                <div className="flex gap-2">
                  <button onClick={() => { resetCurrentUser(); setConfirmReset(false) }} className="btn-primary" style={{ flex: 1, padding: '10px', fontSize: 13 }}>Confirmer</button>
                  <button onClick={() => setConfirmReset(false)} className="btn-ghost" style={{ flex: 1, padding: '10px', fontSize: 13 }}>Annuler</button>
                </div>
              </div>
            )}
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)} className="btn-ghost w-full" style={{ color: 'var(--loss-400)', borderColor: 'rgba(239,68,68,0.3)' }}>
                <Icon name="trash" size={15} /> Supprimer mon compte
              </button>
            ) : (
              <div className="card p-3 space-y-2" style={{ borderColor: 'rgba(239,68,68,0.4)' }}>
                <p className="caption">Action irréversible.</p>
                <div className="flex gap-2">
                  <button onClick={deleteCurrentUser} className="btn-primary" style={{ flex: 1, padding: '10px', fontSize: 13, background: 'var(--loss-500)', boxShadow: 'none' }}>Supprimer</button>
                  <button onClick={() => setConfirmDelete(false)} className="btn-ghost" style={{ flex: 1, padding: '10px', fontSize: 13 }}>Annuler</button>
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="text-center micro text-fg-4">Insiders v2 · MVP local</div>
      </div>
    </>
  )
}
