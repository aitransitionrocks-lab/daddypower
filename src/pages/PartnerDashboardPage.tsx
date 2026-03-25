import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useI18n } from '../i18n'
import { supabase } from '../lib/supabase'
import { trackEvent } from '../lib/tracking'
import LanguageSwitcher from '../components/LanguageSwitcher'
import LicenseStatusCard from '../components/partner/LicenseStatusCard'
import TokenManager from '../components/partner/TokenManager'

interface PartnerNetwork {
  id: string
  user_id: string
  status: string
  level: number
  display_name: string | null
}

interface PartnerChallenge {
  id: string
  title: string
  created_at: string
}

export default function PartnerDashboardPage() {
  const { user, role } = useAuth()
  const { t } = useI18n()

  const [partner, setPartner] = useState<PartnerNetwork | null>(null)
  const [downlineCount, setDownlineCount] = useState(0)
  const [challenges, setChallenges] = useState<PartnerChallenge[]>([])
  const [loading, setLoading] = useState(true)

  const isPartnerOrAdmin = role === 'partner' || role === 'super_admin'

  useEffect(() => {
    trackEvent('partner_dashboard_viewed')
  }, [])

  useEffect(() => {
    if (!user) return

    const fetchPartnerData = async () => {
      // Fetch partner_network entry
      const { data: partnerData } = await supabase
        .from('partner_network')
        .select('id, user_id, status, level, display_name')
        .eq('user_id', user.id)
        .single()

      if (!partnerData) {
        setLoading(false)
        return
      }

      setPartner(partnerData)

      // Fetch downline count
      const { count } = await supabase
        .from('partner_network')
        .select('id', { count: 'exact', head: true })
        .eq('parent_partner_id', partnerData.id)

      setDownlineCount(count || 0)

      // Fetch partner challenges
      const { data: challengeData } = await supabase
        .from('partner_challenges')
        .select('id, title, created_at')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })

      setChallenges(challengeData || [])

      setLoading(false)
    }

    fetchPartnerData()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen bg-kraft-offwhite flex items-center justify-center">
        <div className="animate-pulse text-kraft-muted">...</div>
      </div>
    )
  }

  if (!partner && !isPartnerOrAdmin) {
    return (
      <div className="min-h-screen bg-kraft-offwhite">
        <LanguageSwitcher />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h1 className="text-xl font-bold text-kraft-dark mb-2">{t.partner.notPartnerTitle}</h1>
            <p className="text-kraft-muted">{t.partner.notPartnerMessage}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-kraft-offwhite">
      <LanguageSwitcher />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-kraft-dark mb-1">{t.partner.title}</h1>
        <p className="text-kraft-muted mb-6">{t.partner.subtitle}</p>

        {/* License Status Card */}
        {partner && user && (
          <LicenseStatusCard partnerId={partner.id} userId={user.id} />
        )}

        {/* Partner Info */}
        {partner && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-kraft-muted uppercase tracking-wide">{t.partner.statusLabel}</p>
                <p className="font-semibold text-kraft-dark capitalize">{partner.status}</p>
              </div>
              <div>
                <p className="text-xs text-kraft-muted uppercase tracking-wide">{t.partner.levelLabel}</p>
                <p className="font-semibold text-kraft-dark">{partner.level}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-kraft-muted uppercase tracking-wide">{t.partner.displayNameLabel}</p>
                <p className="font-semibold text-kraft-dark">{partner.display_name || '\u2014'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Downline + Network Link */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-kraft-dark mb-2">{t.partner.downlineTitle}</h2>
          <p className="text-3xl font-bold text-kraft-accent mb-3">
            {t.partner.downlineCount.replace('{count}', downlineCount.toString())}
          </p>
          <Link
            to="/partner/network"
            className="inline-block text-sm text-kraft-accent font-semibold hover:underline"
          >
            {t.network.showNetwork} &rarr;
          </Link>
        </div>

        {/* Token Manager (replaces old simple token list) */}
        {user && (
          <div className="mb-6">
            <TokenManager userId={user.id} />
          </div>
        )}

        {/* Partner Challenges */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-kraft-dark mb-4">{t.partner.challengesTitle}</h2>
          {challenges.length === 0 ? (
            <p className="text-kraft-muted text-sm">{t.partner.noChallenges}</p>
          ) : (
            <div className="space-y-3">
              {challenges.map((ch) => (
                <div
                  key={ch.id}
                  className="border border-kraft-border/50 rounded-xl p-4"
                >
                  <p className="font-semibold text-kraft-dark">{ch.title}</p>
                  <p className="text-xs text-kraft-muted mt-1">
                    {new Date(ch.created_at).toLocaleDateString('de-DE')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
