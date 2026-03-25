import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useI18n } from '../i18n'
import { supabase } from '../lib/supabase'
import LanguageSwitcher from '../components/LanguageSwitcher'
import NetworkTree from '../components/partner/NetworkTree'

export default function PartnerNetworkPage() {
  const { user } = useAuth()
  const { t } = useI18n()
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchPartner = async () => {
      const { data } = await supabase
        .from('partner_network')
        .select('id')
        .eq('user_id', user.id)
        .single()

      setPartnerId(data?.id || null)
      setLoading(false)
    }

    fetchPartner()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen bg-kraft-offwhite flex items-center justify-center">
        <div className="animate-pulse text-kraft-muted">...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-kraft-offwhite">
      <LanguageSwitcher />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-kraft-dark">{t.network.pageTitle}</h1>
          <Link
            to="/partner"
            className="text-sm text-kraft-accent font-semibold hover:underline"
          >
            {t.network.backToPartner}
          </Link>
        </div>

        {partnerId ? (
          <NetworkTree partnerId={partnerId} />
        ) : (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <p className="text-kraft-muted">{t.partner.notPartnerMessage}</p>
          </div>
        )}
      </div>
    </div>
  )
}
