import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useI18n } from '../../i18n'

interface LicenseTier {
  id: string
  name: string
  min_partners: number
  price_monthly: number
}

interface BillingInfo {
  id: string
  tier_id: string | null
  stripe_subscription_id: string | null
}

export default function LicenseStatusCard({ partnerId, userId }: { partnerId: string; userId: string }) {
  const { t } = useI18n()
  const [currentTier, setCurrentTier] = useState<LicenseTier | null>(null)
  const [nextTier, setNextTier] = useState<LicenseTier | null>(null)
  const [activeDownline, setActiveDownline] = useState(0)
  const [billing, setBilling] = useState<BillingInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLicenseData = async () => {
      // Fetch all license tiers
      const { data: tiers } = await supabase
        .from('partner_license_tiers')
        .select('id, name, min_partners, price_monthly')
        .order('min_partners', { ascending: true })

      // Fetch active downline count via RPC
      const { data: downlineData } = await supabase.rpc('get_full_downline', {
        root_partner_id: partnerId,
        include_status: 'active',
      })

      const activeCount = Array.isArray(downlineData) ? downlineData.length : 0
      setActiveDownline(activeCount)

      // Fetch partner billing
      const { data: billingData } = await supabase
        .from('partner_billing')
        .select('id, tier_id, stripe_subscription_id')
        .eq('partner_id', partnerId)
        .single()

      setBilling(billingData || null)

      // Determine current and next tier
      if (tiers && tiers.length > 0) {
        const sortedTiers = [...tiers].sort((a, b) => a.min_partners - b.min_partners)

        // Current tier: highest tier where min_partners <= activeCount
        let current: LicenseTier | null = null
        let next: LicenseTier | null = null

        for (let i = 0; i < sortedTiers.length; i++) {
          if (activeCount >= sortedTiers[i].min_partners) {
            current = sortedTiers[i]
            next = sortedTiers[i + 1] || null
          }
        }

        // If no tier matched, next is the first tier
        if (!current && sortedTiers.length > 0) {
          next = sortedTiers[0]
        }

        setCurrentTier(current)
        setNextTier(next)
      }

      setLoading(false)
    }

    fetchLicenseData()
  }, [partnerId, userId])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm animate-pulse mb-6">
        <div className="h-6 bg-kraft-border/30 rounded w-1/3 mb-3" />
        <div className="h-16 bg-kraft-border/20 rounded" />
      </div>
    )
  }

  // Calculate progress
  const nextThreshold = nextTier ? nextTier.min_partners : (currentTier ? currentTier.min_partners : 0)
  const currentThreshold = currentTier ? currentTier.min_partners : 0
  const range = nextTier ? nextThreshold - currentThreshold : 1
  const progress = nextTier
    ? Math.min(100, Math.round(((activeDownline - currentThreshold) / range) * 100))
    : 100
  const remaining = nextTier ? nextThreshold - activeDownline : 0

  const handleManageSubscription = () => {
    // This would link to Stripe Customer Portal
    // For now, open a placeholder URL that would be replaced with the real portal link
    window.open('/api/stripe/portal', '_blank')
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
      <h2 className="text-lg font-bold text-kraft-dark mb-3">{t.license.title}</h2>

      {/* Current Tier */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-kraft-muted uppercase tracking-wide">{t.license.currentTier}</p>
          <p className="text-base font-semibold text-kraft-dark">
            {currentTier ? currentTier.name : t.license.freeTier}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-kraft-muted uppercase tracking-wide">{t.license.activeDownline}</p>
          <p className="text-base font-semibold text-kraft-accent">{activeDownline}</p>
        </div>
      </div>

      {/* Progress Bar */}
      {nextTier && (
        <div className="mb-3">
          <div className="w-full bg-kraft-border/20 rounded-full h-2.5 mb-2">
            <div
              className="bg-kraft-accent rounded-full h-2.5 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-kraft-muted">
            {t.license.progressText
              .replace('{count}', remaining.toString())
              .replace('{tier}', nextTier.name)
              .replace('{price}', nextTier.price_monthly.toString())}
          </p>
        </div>
      )}

      {/* Manage Subscription Button */}
      {billing?.stripe_subscription_id && (
        <button
          onClick={handleManageSubscription}
          className="w-full mt-2 border border-kraft-accent text-kraft-accent text-sm font-semibold px-4 py-2 rounded-xl hover:bg-kraft-accent/5 transition-colors cursor-pointer"
        >
          {t.license.manageSubscription}
        </button>
      )}
    </div>
  )
}
