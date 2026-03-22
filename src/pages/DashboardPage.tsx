import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { signOut } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { useI18n } from '../i18n'
import { trackEvent } from '../lib/tracking'
import LanguageSwitcher from '../components/LanguageSwitcher'

interface Subscription {
  status: string
  current_period_end: string | null
  result_type: string | null
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, role } = useAuth()
  const { t } = useI18n()

  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    trackEvent('dashboard_viewed')
  }, [])

  useEffect(() => {
    if (!user) return

    supabase
      .from('subscriptions')
      .select('status, current_period_end, result_type')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()
      .then(({ data }) => {
        setSubscription(data || null)
        setLoading(false)
      })
  }, [user])

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0]
  const resultType = subscription?.result_type || user?.user_metadata?.result_type
  const resultTitle = resultType ? t.results.types[resultType]?.title : null

  return (
    <div className="min-h-screen bg-gray-50">
      <LanguageSwitcher />

      {/* Header */}
      <header className="bg-kraft-dark text-white px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">daddypower</h1>
            <p className="text-sm text-gray-400">
              {firstName && `Hey ${firstName}`}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {role && (role === 'super_admin' || role === 'operator') && (
              <a
                href="/admin"
                className="text-sm text-gray-300 hover:text-white underline"
              >
                Admin
              </a>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-gray-300 hover:text-white underline cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Willkommen */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm mb-6">
          <h2 className="text-2xl font-bold text-kraft-dark mb-2">
            {firstName ? `Willkommen zurück, ${firstName}!` : 'Willkommen!'}
          </h2>

          {resultTitle && (
            <div className="inline-block bg-kraft-accent/10 text-kraft-accent text-sm font-medium px-3 py-1 rounded-full mb-4">
              {resultTitle}
            </div>
          )}

          {subscription ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-green-800 font-medium">Dein Abo ist aktiv</p>
              {subscription.current_period_end && (
                <p className="text-green-600 text-sm mt-1">
                  Nächste Verlängerung: {new Date(subscription.current_period_end).toLocaleDateString('de-DE')}
                </p>
              )}
            </div>
          ) : !loading ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-yellow-800 font-medium">Kein aktives Abo</p>
              <p className="text-yellow-600 text-sm mt-1">
                Starte jetzt mit einer Challenge und werde Teil der Community.
              </p>
            </div>
          ) : null}
        </div>

        {/* Quick Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: '💪 Workouts', href: '/workouts', desc: 'Trainieren' },
            { label: '📊 Check-in', href: '/checkin', desc: 'Tages-Check' },
            { label: '🎯 Challenges', href: '/challenges', desc: 'Mitmachen' },
            { label: '🤝 Partner', href: '/partner', desc: 'Netzwerk' },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="bg-white rounded-xl p-4 shadow-sm text-center hover:shadow-md transition-all block"
            >
              <p className="text-2xl mb-1">{item.label.split(' ')[0]}</p>
              <p className="text-sm font-medium text-kraft-dark">{item.label.split(' ')[1]}</p>
              <p className="text-xs text-kraft-muted mt-1">{item.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
