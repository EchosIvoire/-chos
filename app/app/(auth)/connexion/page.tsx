'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ConnexionPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(error.message)
      else router.push('/tableau-de-bord')
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${location.origin}/tableau-de-bord` },
      })
      if (error) setMessage(error.message)
      else setMessage('Vérifiez votre email pour confirmer votre compte.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#E2DDD6' }}>
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="serif text-4xl font-semibold mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
            SOLEA
          </h1>
          <p className="text-sm" style={{ color: 'var(--mu)' }}>
            Devis &amp; Facturation pour artisans BTP
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex gap-2 mb-6 p-1 rounded-xl" style={{ background: 'var(--s50)' }}>
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: mode === m ? 'white' : 'transparent',
                  color: mode === m ? 'var(--ink)' : 'var(--mu)',
                  boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
                }}
              >
                {m === 'login' ? 'Connexion' : 'Inscription'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--mu)' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="vous@email.com"
                className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-colors"
                style={{
                  border: '1.5px solid var(--s100)',
                  background: 'var(--cr)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--s300)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--s100)')}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--mu)' }}>
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-colors"
                style={{
                  border: '1.5px solid var(--s100)',
                  background: 'var(--cr)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--s300)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--s100)')}
              />
            </div>

            {message && (
              <p className="text-sm text-center py-2 px-3 rounded-lg"
                style={{ background: 'var(--s50)', color: 'var(--mu)' }}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-medium text-white transition-opacity mt-1"
              style={{ background: 'var(--ink)', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? '...' : mode === 'login' ? 'Se connecter' : "Créer mon compte"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: 'var(--mu)' }}>
          En vous connectant, vous acceptez nos{' '}
          <a href="#" style={{ color: 'var(--s500)' }}>CGU</a>
        </p>
      </div>
    </div>
  )
}
