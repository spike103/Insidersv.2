import React, { useState } from 'react'
import { useApp } from '../contexts/AppContext.jsx'
import Logo from '../components/Logo.jsx'

export default function Login() {
  const { login } = useApp()
  const [pseudo, setPseudo] = useState('')
  const [creating, setCreating] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    if (pseudo.trim()) login(pseudo.trim())
  }

  return (
    <div className="min-h-screen court-bg flex flex-col safe-top safe-bottom">
      <div className="flex-1 flex flex-col px-6 pt-14 pb-8">
        <div className="mb-12">
          <Logo size={40} withText={false} />
        </div>

        <div className="mb-4">
          <h1 className="display" style={{ fontSize: 36, lineHeight: 1.05 }}>
            <span className="accent-word">EVERY</span>{' '}
            <span style={{ color: 'white', fontStyle: 'italic' }}>BET</span>
          </h1>
          <h1 className="display" style={{ fontSize: 36, lineHeight: 1.05, color: 'white', fontStyle: 'italic' }}>
            HIDES A TRUTH.
          </h1>
          <h1 className="display" style={{ fontSize: 36, lineHeight: 1.05, color: 'white', fontStyle: 'italic', marginTop: 10 }}>
            JOIN THOSE
          </h1>
          <h1 className="display" style={{ fontSize: 36, lineHeight: 1.05, color: 'white', fontStyle: 'italic' }}>
            WHO HOLD IT.
          </h1>
        </div>

        <div className="flex-1" />

        <form onSubmit={submit} className="space-y-4">
          <input
            type="text"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            placeholder={creating ? 'Choisis ton pseudo' : 'Ton pseudo'}
            autoComplete="username"
            autoFocus
            style={{ textAlign: 'center', fontWeight: 600 }}
          />
          <button type="submit" disabled={!pseudo.trim()} className="btn-primary">
            {creating ? 'Créer mon compte' : 'Se connecter'}
          </button>

          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px" style={{ background: 'var(--ink-600)' }} />
            <span className="caption">ou</span>
            <div className="flex-1 h-px" style={{ background: 'var(--ink-600)' }} />
          </div>

          <p className="text-center body">
            {creating ? 'Déjà un compte ?' : "Pas encore de compte ?"}{' '}
            <button
              type="button"
              onClick={() => setCreating(!creating)}
              className="font-bold"
              style={{ color: 'var(--blue-500)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              {creating ? 'Se connecter' : 'Créer un compte'}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
