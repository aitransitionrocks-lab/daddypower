import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n'
import { supabase } from '../lib/supabase'
import { trackEvent } from '../lib/tracking'
import LanguageSwitcher from '../components/LanguageSwitcher'

interface InviteInfo {
  partner_name: string
  is_valid: boolean
}

export default function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { t } = useI18n()

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!token) {
      setError(true)
      setLoading(false)
      return
    }

    const validateToken = async () => {
      try {
        const { data, error: rpcError } = await supabase.rpc('validate_invite_token', {
          invite_token: token,
        })

        if (rpcError || !data) {
          setError(true)
          setLoading(false)
          return
        }

        // RPC returns validation result
        const result = Array.isArray(data) ? data[0] : data

        if (result && result.is_valid) {
          setInviteInfo({
            partner_name: result.partner_name || result.display_name || '',
            is_valid: true,
          })
          trackEvent('invite_link_used', { token })
        } else {
          setError(true)
        }
      } catch {
        setError(true)
      }

      setLoading(false)
    }

    validateToken()
  }, [token])

  const handleSignup = () => {
    // Store token in sessionStorage so it can be used after signup
    if (token) {
      sessionStorage.setItem('dp_invite_token', token)
    }
    navigate('/login?signup=true')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-kraft-offwhite flex items-center justify-center">
        <LanguageSwitcher />
        <div className="text-center">
          <div className="animate-pulse text-kraft-muted text-lg">{t.invite.loadingMessage}</div>
        </div>
      </div>
    )
  }

  if (error || !inviteInfo) {
    return (
      <div className="min-h-screen bg-kraft-offwhite">
        <LanguageSwitcher />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="text-4xl mb-4">😕</div>
            <h1 className="text-xl font-bold text-kraft-dark mb-2">{t.invite.invalidTitle}</h1>
            <p className="text-kraft-muted">{t.invite.invalidMessage}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-kraft-offwhite">
      <LanguageSwitcher />

      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <div className="text-4xl mb-4">💪</div>
          <h1 className="text-2xl font-bold text-kraft-dark mb-2">{t.invite.title}</h1>
          <p className="text-kraft-muted mb-4">{t.invite.subtitle}</p>

          {inviteInfo.partner_name && (
            <div className="bg-kraft-accent/10 text-kraft-accent text-sm font-medium px-4 py-2 rounded-full inline-block mb-6">
              {t.invite.invitedBy.replace('{name}', inviteInfo.partner_name)}
            </div>
          )}

          <button
            onClick={handleSignup}
            className="w-full bg-kraft-accent text-white font-semibold py-3 px-6 rounded-xl hover:bg-kraft-accent/90 transition-colors cursor-pointer"
          >
            {t.invite.ctaSignup}
          </button>
        </div>
      </div>
    </div>
  )
}
