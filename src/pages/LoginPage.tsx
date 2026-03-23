import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithMagicLink, signInWithPassword } from '../lib/auth'
import { useAuth } from '../hooks/useAuth'
import { useI18n } from '../i18n'
import { useEffect } from 'react'

export default function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { t } = useI18n()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'magic' | 'password'>('magic')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'magic') {
        const result = await signInWithMagicLink(email)
        if (result.success) {
          setMagicLinkSent(true)
        } else {
          setError(result.error || 'Fehler beim Senden des Links')
        }
      } else {
        const result = await signInWithPassword(email, password)
        if (result.success) {
          navigate('/dashboard')
        } else {
          setError(result.error || 'Login fehlgeschlagen')
        }
      }
    } catch {
      setError('Ein Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  if (magicLinkSent) {
    return (
      <div className="min-h-screen bg-kraft-offwhite flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center">
          <div className="text-5xl mb-6">📧</div>
          <h1 className="text-2xl font-bold text-kraft-dark mb-4">Check deine E-Mails</h1>
          <p className="text-kraft-muted mb-6">
            Wir haben dir einen Login-Link an <strong>{email}</strong> geschickt.
            Klicke auf den Link um dich einzuloggen.
          </p>
          <button
            onClick={() => setMagicLinkSent(false)}
            className="text-kraft-accent underline text-sm cursor-pointer"
          >
            Andere E-Mail verwenden
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-kraft-offwhite flex items-center justify-center px-6">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-kraft-dark mb-2">
            {mode === 'magic' ? 'Login per E-Mail' : 'Login'}
          </h1>
          <p className="text-kraft-muted text-sm">
            {mode === 'magic'
              ? 'Wir senden dir einen sicheren Login-Link.'
              : 'Melde dich mit E-Mail und Passwort an.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-kraft-dark mb-1">
              {t.admin.email}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="deine@email.de"
              className="w-full px-4 py-3 border-2 border-kraft-border rounded-xl focus:border-kraft-accent focus:outline-none"
            />
          </div>

          {mode === 'password' && (
            <div>
              <label className="block text-sm font-medium text-kraft-dark mb-1">
                {t.admin.password}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-kraft-border rounded-xl focus:border-kraft-accent focus:outline-none"
              />
            </div>
          )}

          {error && <p className="text-kraft-accent text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-kraft-accent hover:bg-amber-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-all cursor-pointer"
          >
            {loading
              ? 'Bitte warten...'
              : mode === 'magic'
                ? 'Login-Link senden'
                : 'Einloggen'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setMode(mode === 'magic' ? 'password' : 'magic')}
            className="text-sm text-kraft-muted hover:text-kraft-dark underline cursor-pointer"
          >
            {mode === 'magic' ? 'Stattdessen mit Passwort anmelden' : 'Stattdessen Magic Link nutzen'}
          </button>
        </div>

        <div className="mt-4 text-center">
          <a href="/" className="text-sm text-kraft-muted hover:text-kraft-dark">
            ← Zurück zur Startseite
          </a>
        </div>
      </div>
    </div>
  )
}
