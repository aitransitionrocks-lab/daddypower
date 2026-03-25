import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useI18n } from '../i18n'

interface Partner {
  id: string
  user_id: string
  display_name: string | null
  level: number
  status: string
  joined_at: string
}

interface PendingChallenge {
  id: string
  challenge_program_id: string
  created_by_partner_id: string
  created_at: string
  program_title: string
  partner_name: string
  duration_days: number
}

export default function AdminPartnersPage() {
  const { lang } = useI18n()
  const [partners, setPartners] = useState<Partner[]>([])
  const [pending, setPending] = useState<PendingChallenge[]>([])
  const [tab, setTab] = useState<'partners' | 'pending' | 'tiers'>('partners')
  const [filterStatus, setFilterStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    // Partners
    let query = supabase
      .from('partner_network')
      .select('id, user_id, display_name, level, status, joined_at')
      .order('joined_at', { ascending: false })
      .limit(100)

    if (filterStatus) query = query.eq('status', filterStatus)

    const { data: pData } = await query
    setPartners(pData || [])

    // Pending challenges
    const { data: pcData } = await supabase
      .from('partner_challenges')
      .select('id, challenge_program_id, created_by_partner_id, created_at')
      .eq('requires_approval', true)
      .is('approved_at', null)
      .eq('is_active', false)

    // Enrich with program titles
    const enriched: PendingChallenge[] = []
    for (const pc of pcData || []) {
      const { data: prog } = await supabase
        .from('challenge_programs')
        .select('title_de, title_en, duration_days')
        .eq('id', pc.challenge_program_id)
        .single()

      const { data: partner } = await supabase
        .from('partner_network')
        .select('display_name')
        .eq('id', pc.created_by_partner_id)
        .single()

      enriched.push({
        ...pc,
        program_title: lang === 'de' ? (prog?.title_de || '') : (prog?.title_en || prog?.title_de || ''),
        partner_name: partner?.display_name || 'Partner',
        duration_days: prog?.duration_days || 0,
      })
    }
    setPending(enriched)
    setLoading(false)
  }, [filterStatus, lang])

  useEffect(() => { loadData() }, [loadData])

  const approveChallenge = async (pc: PendingChallenge) => {
    await supabase
      .from('partner_challenges')
      .update({ is_active: true, approved_at: new Date().toISOString() })
      .eq('id', pc.id)

    await supabase
      .from('challenge_programs')
      .update({ is_published: true })
      .eq('id', pc.challenge_program_id)

    await loadData()
  }

  const rejectChallenge = async (pc: PendingChallenge) => {
    const reason = prompt('Ablehnungsgrund:')
    if (!reason) return

    await supabase.from('partner_challenges').delete().eq('id', pc.id)
    await supabase.from('challenge_programs').delete().eq('id', pc.challenge_program_id)
    await loadData()
  }

  const togglePartnerStatus = async (partner: Partner) => {
    const newStatus = partner.status === 'active' ? 'suspended' : 'active'
    await supabase
      .from('partner_network')
      .update({ status: newStatus })
      .eq('id', partner.id)
    await loadData()
  }

  const triggerBillingCheck = async (partnerId: string) => {
    await supabase.functions.invoke('partner-billing-check', {
      body: { partnerId },
    })
    alert('Billing-Check ausgeführt')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-kraft-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-kraft-offwhite">
      <header className="bg-kraft-dark text-white px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">Partner-Verwaltung</h1>
          <a href="/admin" className="text-sm text-kraft-border hover:text-white underline">
            ← Admin Dashboard
          </a>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['partners', 'pending', 'tiers'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg font-medium text-sm cursor-pointer transition-all ${
                tab === t
                  ? 'bg-kraft-dark text-white'
                  : 'bg-white text-kraft-dark border border-kraft-border hover:bg-kraft-offwhite'
              }`}
            >
              {t === 'partners' ? 'Partner' : t === 'pending' ? `Freigaben (${pending.length})` : 'Lizenz-Tiers'}
            </button>
          ))}
        </div>

        {/* Partners Tab */}
        {tab === 'partners' && (
          <>
            <div className="mb-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-kraft-border rounded-lg text-sm"
              >
                <option value="">Alle Status</option>
                <option value="active">Aktiv</option>
                <option value="suspended">Gesperrt</option>
                <option value="pending">Ausstehend</option>
              </select>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-kraft-offwhite">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-kraft-muted">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-kraft-muted">Level</th>
                    <th className="text-left px-4 py-3 font-medium text-kraft-muted">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-kraft-muted">Beigetreten</th>
                    <th className="text-left px-4 py-3 font-medium text-kraft-muted">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.map((p) => (
                    <tr key={p.id} className="border-t border-kraft-border/50">
                      <td className="px-4 py-3 text-kraft-dark">{p.display_name || p.user_id.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-kraft-muted">{p.level}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          p.status === 'active' ? 'bg-green-100 text-green-800' :
                          p.status === 'suspended' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-kraft-muted">{new Date(p.joined_at).toLocaleDateString('de-DE')}</td>
                      <td className="px-4 py-3 flex gap-2">
                        <button onClick={() => togglePartnerStatus(p)} className="text-xs text-kraft-accent hover:text-kraft-accent-dark cursor-pointer">
                          {p.status === 'active' ? 'Sperren' : 'Aktivieren'}
                        </button>
                        <button onClick={() => triggerBillingCheck(p.id)} className="text-xs text-kraft-muted hover:text-kraft-dark cursor-pointer">
                          Billing prüfen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pending Challenges Tab */}
        {tab === 'pending' && (
          <div className="space-y-4">
            {pending.length === 0 ? (
              <p className="text-kraft-muted text-center py-8">Keine offenen Freigaben.</p>
            ) : (
              pending.map((pc) => (
                <div key={pc.id} className="bg-white rounded-xl shadow-sm p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-kraft-dark">{pc.program_title}</h3>
                      <p className="text-sm text-kraft-muted">
                        Von: {pc.partner_name} · {pc.duration_days} Tage · {new Date(pc.created_at).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveChallenge(pc)}
                        className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer"
                      >
                        Freigeben
                      </button>
                      <button
                        onClick={() => rejectChallenge(pc)}
                        className="bg-kraft-dark hover:bg-kraft-accent text-white text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer"
                      >
                        Ablehnen
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* License Tiers Tab */}
        {tab === 'tiers' && (
          <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-kraft-offwhite">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-kraft-muted">Tier</th>
                  <th className="text-left px-4 py-3 font-medium text-kraft-muted">Ab Partner</th>
                  <th className="text-left px-4 py-3 font-medium text-kraft-muted">Bis Partner</th>
                  <th className="text-left px-4 py-3 font-medium text-kraft-muted">Preis/Monat</th>
                  <th className="text-left px-4 py-3 font-medium text-kraft-muted">Status</th>
                </tr>
              </thead>
              <TierRows />
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function TierRows() {
  const [tiers, setTiers] = useState<Array<{ id: string; name: string; min_partners: number; max_partners: number | null; price_monthly: number; is_active: boolean }>>([])

  useEffect(() => {
    supabase
      .from('partner_license_tiers')
      .select('id, name, min_partners, max_partners, price_monthly, is_active')
      .order('sort_order')
      .then(({ data }) => setTiers(data || []))
  }, [])

  return (
    <tbody>
      {tiers.map((t) => (
        <tr key={t.id} className="border-t border-kraft-border/50">
          <td className="px-4 py-3 font-medium text-kraft-dark">{t.name}</td>
          <td className="px-4 py-3 text-kraft-muted">{t.min_partners}</td>
          <td className="px-4 py-3 text-kraft-muted">{t.max_partners ?? '∞'}</td>
          <td className="px-4 py-3 text-kraft-dark font-medium">{t.price_monthly > 0 ? `${t.price_monthly}€` : 'Kostenlos'}</td>
          <td className="px-4 py-3">
            <span className={`text-xs px-2 py-1 rounded-full ${t.is_active ? 'bg-green-100 text-green-800' : 'bg-kraft-offwhite text-kraft-muted'}`}>
              {t.is_active ? 'Aktiv' : 'Inaktiv'}
            </span>
          </td>
        </tr>
      ))}
    </tbody>
  )
}
