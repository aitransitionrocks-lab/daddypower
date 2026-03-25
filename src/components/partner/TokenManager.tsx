import { useEffect, useState, useCallback } from 'react'
import QRCode from 'qrcode'
import { supabase } from '../../lib/supabase'
import { useI18n } from '../../i18n'
import { trackEvent } from '../../lib/tracking'

interface InviteToken {
  id: string
  token: string
  label: string | null
  max_uses: number | null
  use_count: number
  is_active: boolean
  expires_at: string | null
  created_at: string
}

export default function TokenManager({ userId }: { userId: string }) {
  const { t } = useI18n()
  const [tokens, setTokens] = useState<InviteToken[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [error, setError] = useState('')

  // Form state
  const [label, setLabel] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [expiryDate, setExpiryDate] = useState('')

  // QR codes cache
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({})

  const fetchTokens = useCallback(async () => {
    const { data } = await supabase
      .from('invite_tokens')
      .select('id, token, label, max_uses, use_count, is_active, expires_at, created_at')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })

    setTokens(data || [])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchTokens()
  }, [fetchTokens])

  // Generate QR codes for active tokens
  useEffect(() => {
    const generateQRs = async () => {
      const newCodes: Record<string, string> = {}
      for (const token of tokens) {
        if (!token.is_active) continue
        if (qrCodes[token.id]) {
          newCodes[token.id] = qrCodes[token.id]
          continue
        }
        const url = `${window.location.origin}/invite/${token.token}`
        try {
          const dataUrl = await QRCode.toDataURL(url, {
            width: 160,
            margin: 1,
            color: { dark: '#1B1B19', light: '#F5F3ED' },
          })
          newCodes[token.id] = dataUrl
        } catch {
          // QR generation failed silently
        }
      }
      setQrCodes(newCodes)
    }
    if (tokens.length > 0) generateQRs()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens])

  const handleCreate = async () => {
    setCreating(true)
    setError('')

    const token = crypto.randomUUID()
    const insertData: Record<string, unknown> = {
      token,
      created_by: userId,
      is_active: true,
      use_count: 0,
    }

    if (label.trim()) insertData.label = label.trim()
    if (maxUses.trim()) {
      const parsed = parseInt(maxUses, 10)
      if (!isNaN(parsed) && parsed > 0) insertData.max_uses = parsed
    }
    if (expiryDate) insertData.expires_at = new Date(expiryDate).toISOString()

    const { error: insertError } = await supabase
      .from('invite_tokens')
      .insert(insertData)

    if (insertError) {
      setError(t.tokenManager.errorGeneric)
      setCreating(false)
      return
    }

    trackEvent('invite_link_created')

    // Reset form
    setLabel('')
    setMaxUses('')
    setExpiryDate('')
    await fetchTokens()
    setCreating(false)
  }

  const handleCopy = async (token: string, tokenId: string) => {
    const link = `${window.location.origin}/invite/${token}`
    try {
      await navigator.clipboard.writeText(link)
    } catch {
      const input = document.createElement('input')
      input.value = link
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
    setCopiedId(tokenId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleWhatsAppShare = (token: string) => {
    const link = `${window.location.origin}/invite/${token}`
    const text = t.tokenManager.whatsappText.replace('{link}', link)
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const handleDeactivate = async (tokenId: string) => {
    await supabase
      .from('invite_tokens')
      .update({ is_active: false })
      .eq('id', tokenId)
    await fetchTokens()
  }

  const handleDelete = async (tokenId: string) => {
    await supabase
      .from('invite_tokens')
      .delete()
      .eq('id', tokenId)
    await fetchTokens()
  }

  const getTokenStatus = (token: InviteToken): { text: string; color: string } => {
    if (!token.is_active) return { text: t.tokenManager.statusInactive, color: 'text-red-600' }
    if (token.expires_at && new Date(token.expires_at) < new Date()) {
      return { text: t.tokenManager.statusExpired, color: 'text-red-600' }
    }
    if (token.max_uses && token.use_count >= token.max_uses) {
      return { text: t.tokenManager.statusMaxUsed, color: 'text-yellow-600' }
    }
    return { text: t.tokenManager.statusActive, color: 'text-green-600' }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
        <div className="h-6 bg-kraft-border/30 rounded w-1/3 mb-4" />
        <div className="h-32 bg-kraft-border/20 rounded" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-bold text-kraft-dark mb-4">{t.tokenManager.title}</h2>

      {/* Create Token Form */}
      <div className="border border-kraft-border/40 rounded-xl p-4 mb-6 space-y-3">
        <p className="text-sm font-semibold text-kraft-dark">{t.tokenManager.createTitle}</p>

        <div>
          <label className="block text-xs text-kraft-muted mb-1">{t.tokenManager.labelField}</label>
          <input
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder={t.tokenManager.labelPlaceholder}
            className="w-full border border-kraft-border/50 rounded-lg px-3 py-2 text-sm text-kraft-dark bg-kraft-offwhite focus:outline-none focus:border-kraft-accent"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-kraft-muted mb-1">{t.tokenManager.maxUsesField}</label>
            <input
              type="number"
              value={maxUses}
              onChange={e => setMaxUses(e.target.value)}
              placeholder={t.tokenManager.maxUsesPlaceholder}
              min="1"
              className="w-full border border-kraft-border/50 rounded-lg px-3 py-2 text-sm text-kraft-dark bg-kraft-offwhite focus:outline-none focus:border-kraft-accent"
            />
          </div>
          <div>
            <label className="block text-xs text-kraft-muted mb-1">{t.tokenManager.expiryField}</label>
            <input
              type="date"
              value={expiryDate}
              onChange={e => setExpiryDate(e.target.value)}
              className="w-full border border-kraft-border/50 rounded-lg px-3 py-2 text-sm text-kraft-dark bg-kraft-offwhite focus:outline-none focus:border-kraft-accent"
            />
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={creating}
          className="w-full bg-kraft-accent text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-kraft-accent/90 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {creating ? '...' : t.tokenManager.createButton}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Token List */}
      {tokens.length === 0 ? (
        <p className="text-kraft-muted text-sm text-center py-4">{t.tokenManager.noTokens}</p>
      ) : (
        <div className="space-y-4">
          {tokens.map(token => {
            const status = getTokenStatus(token)
            const link = `${window.location.origin}/invite/${token.token}`
            const shortToken = token.token.slice(0, 8) + '...'
            const isActive = token.is_active && !(token.expires_at && new Date(token.expires_at) < new Date())

            return (
              <div key={token.id} className="border border-kraft-border/40 rounded-xl p-4">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    {token.label && (
                      <p className="text-sm font-semibold text-kraft-dark truncate">{token.label}</p>
                    )}
                    <p className="text-xs font-mono text-kraft-muted truncate" title={link}>
                      {shortToken}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold whitespace-nowrap ${status.color}`}>
                    {status.text}
                  </span>
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap gap-3 text-[11px] text-kraft-muted mb-3">
                  <span>{new Date(token.created_at).toLocaleDateString('de-DE')}</span>
                  <span>
                    {t.tokenManager.usesLabel}: {token.use_count}{token.max_uses ? `/${token.max_uses}` : ''}
                  </span>
                  {token.expires_at && (
                    <span>
                      {t.tokenManager.expiresLabel}: {new Date(token.expires_at).toLocaleDateString('de-DE')}
                    </span>
                  )}
                </div>

                {/* QR Code */}
                {isActive && qrCodes[token.id] && (
                  <div className="flex justify-center mb-3">
                    <img
                      src={qrCodes[token.id]}
                      alt={`QR Code ${token.label || shortToken}`}
                      className="w-32 h-32 rounded-lg"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {isActive && (
                    <>
                      <button
                        onClick={() => handleCopy(token.token, token.id)}
                        className="text-xs font-semibold text-kraft-accent hover:underline cursor-pointer"
                      >
                        {copiedId === token.id ? t.tokenManager.copied : t.tokenManager.copyLink}
                      </button>
                      <button
                        onClick={() => handleWhatsAppShare(token.token)}
                        className="text-xs font-semibold text-green-600 hover:underline cursor-pointer"
                      >
                        WhatsApp
                      </button>
                      <button
                        onClick={() => handleDeactivate(token.id)}
                        className="text-xs font-semibold text-yellow-600 hover:underline cursor-pointer"
                      >
                        {t.tokenManager.deactivate}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(token.id)}
                    className="text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                  >
                    {t.tokenManager.deleteToken}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
