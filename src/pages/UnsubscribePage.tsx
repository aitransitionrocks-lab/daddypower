import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export default function UnsubscribePage() {
  const [params] = useSearchParams()
  const email = params.get('email') || ''
  const [status, setStatus] = useState<'confirm' | 'done' | 'error'>('confirm')

  const handleUnsubscribe = async () => {
    if (!email || !isSupabaseConfigured()) {
      setStatus('error')
      return
    }

    try {
      await supabase.from('unsubscribes').insert({
        email_address: email,
      })
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div className="min-h-screen bg-kraft-offwhite flex items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <h1 className="text-2xl font-bold text-kraft-dark mb-4">Abgemeldet</h1>
          <p className="text-kraft-muted">
            Du erhältst keine weiteren E-Mails von uns. Schade, dass du gehst.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-kraft-offwhite flex items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <h1 className="text-2xl font-bold text-kraft-dark mb-4">E-Mails abbestellen</h1>
        <p className="text-kraft-muted mb-6">
          Möchtest du dich wirklich abmelden? Du verpasst Updates zu Challenges und der Community.
        </p>
        {email && (
          <p className="text-sm text-kraft-muted mb-6">{email}</p>
        )}
        <button
          onClick={handleUnsubscribe}
          className="bg-kraft-dark hover:bg-kraft-navy text-white font-semibold py-3 px-6 rounded-xl transition-all cursor-pointer"
        >
          Ja, abmelden
        </button>
        <div className="mt-4">
          <a href="/" className="text-sm text-kraft-muted hover:text-kraft-dark">
            Zurück zur Startseite
          </a>
        </div>
        {status === 'error' && (
          <p className="text-kraft-accent text-sm mt-4">Ein Fehler ist aufgetreten.</p>
        )}
      </div>
    </div>
  )
}
