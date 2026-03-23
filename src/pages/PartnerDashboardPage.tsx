import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useI18n } from '../i18n'
import { supabase } from '../lib/supabase'
import { trackEvent } from '../lib/tracking'
import LanguageSwitcher from '../components/LanguageSwitcher'

interface PartnerNetwork {
  id: string
  user_id: string
  status: string
  level: number
  display_name: string | null
}

interface InviteToken {
  id: string
  token: string
  is_used: boolean
  expires_at: string | null
  created_at: string
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
  const [inviteTokens, setInviteTokens] = useState<InviteToken[]>([])
  const [challenges, setChallenges] = useState<PartnerChallenge[]>([])
  const [loading, setLoading] = useState(true)
  const [creatingToken, setCreatingToken] = useState(false)
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null)
  const [error, setError] = useState('')

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

      // Fetch invite tokens
      const { data: tokens } = await supabase
        .from('invite_tokens')
        .select('id, token, is_used, expires_at, created_at')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })

      setInviteTokens(tokens || [])

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

  const handleCreateInviteToken = async () => {
    if (!user) return

    setCreatingToken(true)
    setError('')

    const token = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const { error: insertError } = await supabase
      .from('invite_tokens')
      .insert({
        token,
        created_by: user.id,
        is_used: false,
        expires_at: expiresAt.toISOString(),
      })

    if (insertError) {
      setError(t.partner.errorGeneric)
      setCreatingToken(false)
      return
    }

    trackEvent('invite_link_created')

    // Refresh tokens list
    const { data: tokens } = await supabase
      .from('invite_tokens')
      .select('id, token, is_used, expires_at, created_at')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })

    setInviteTokens(tokens || [])
    setCreatingToken(false)
  }

  const handleCopyLink = async (token: string, tokenId: string) => {
    const link = `${window.location.origin}/invite/${token}`
    try {
      await navigator.clipboard.writeText(link)
      setCopiedTokenId(tokenId)
      setTimeout(() => setCopiedTokenId(null), 2000)
    } catch {
      // Fallback: select text
      const input = document.createElement('input')
      input.value = link
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopiedTokenId(tokenId)
      setTimeout(() => setCopiedTokenId(null), 2000)
    }
  }

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
            <div className="text-4xl mb-4">🤝</div>
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
                <p className="font-semibold text-kraft-dark">{partner.display_name || '—'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Downline */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-kraft-dark mb-2">{t.partner.downlineTitle}</h2>
          <p className="text-3xl font-bold text-kraft-accent">
            {t.partner.downlineCount.replace('{count}', downlineCount.toString())}
          </p>
        </div>

        {/* Invite Tokens */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-kraft-dark">{t.partner.inviteTokensTitle}</h2>
            <button
              onClick={handleCreateInviteToken}
              disabled={creatingToken}
              className="bg-kraft-accent text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-kraft-accent/90 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {creatingToken ? '...' : t.partner.createInviteButton}
            </button>
          </div>

          {error && (
            <div className="bg-kraft-accent-light border border-kraft-accent rounded-xl p-3 mb-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {inviteTokens.length === 0 ? (
            <p className="text-kraft-muted text-sm">{t.partner.noTokens}</p>
          ) : (
            <div className="space-y-3">
              {inviteTokens.map((token) => (
                <div
                  key={token.id}
                  className="flex items-center justify-between border border-kraft-border/50 rounded-xl p-3"
                >
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="text-sm font-mono text-kraft-dark truncate">
                      {window.location.origin}/invite/{token.token}
                    </p>
                    <p className="text-xs text-kraft-muted mt-1">
                      {token.is_used
                        ? t.partner.tokenUsed
                        : token.expires_at
                          ? t.partner.tokenExpires.replace(
                              '{date}',
                              new Date(token.expires_at).toLocaleDateString('de-DE')
                            )
                          : ''}
                    </p>
                  </div>
                  {!token.is_used && (
                    <button
                      onClick={() => handleCopyLink(token.token, token.id)}
                      className="text-sm text-kraft-accent font-semibold whitespace-nowrap cursor-pointer hover:underline"
                    >
                      {copiedTokenId === token.id ? t.partner.copied : t.partner.copyLink}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

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
