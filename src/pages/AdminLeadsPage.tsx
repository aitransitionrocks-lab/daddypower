import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { calculateLeadScore } from '../services/lead-scoring'
import type { ResultTypeId } from '../data/quiz'

const RESULT_TYPES: ResultTypeId[] = ['leerer_akku', 'funktionierer', 'stiller_kaempfer', 'performer_auf_reserve']
const STATUSES = ['waitlist', 'email_sequence', 'converted', 'unsubscribed'] as const
const LANGUAGES = ['de', 'en'] as const
const TIME_RANGES = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: 'Alle', days: 0 },
] as const

type Segment = 'cold' | 'warm' | 'hot' | ''

interface EnrichedLead {
  id: string
  email: string
  name: string | null
  result_type: string | null
  status: string | null
  utm_source: string | null
  language: string | null
  created_at: string
  score: number
  segment: string
}

interface LeadStats {
  total: number
  today: number
  hot: number
  conversionRate: number
}

const SEGMENT_COLORS: Record<string, { bg: string; text: string }> = {
  hot: { bg: 'bg-red-100', text: 'text-red-700' },
  warm: { bg: 'bg-orange-100', text: 'text-orange-700' },
  cold: { bg: 'bg-blue-100', text: 'text-blue-700' },
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<EnrichedLead[]>([])
  const [stats, setStats] = useState<LeadStats>({ total: 0, today: 0, hot: 0, conversionRate: 0 })
  const [loading, setLoading] = useState(true)

  // Filters
  const [segmentFilter, setSegmentFilter] = useState<Segment>('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [langFilter, setLangFilter] = useState('')
  const [timeRange, setTimeRange] = useState(0)
  const [searchText, setSearchText] = useState('')

  // Note modal
  const [noteModalLeadId, setNoteModalLeadId] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  // Status change
  const [statusChangeId, setStatusChangeId] = useState<string | null>(null)

  const loadLeads = useCallback(async () => {
    setLoading(true)

    // Fetch leads
    let query = supabase
      .from('leads')
      .select('id, email, name, result_type, status, utm_source, language, created_at')
      .order('created_at', { ascending: false })
      .limit(500)

    if (typeFilter) {
      query = query.eq('result_type', typeFilter)
    }
    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }
    if (langFilter) {
      query = query.eq('language', langFilter)
    }
    if (timeRange > 0) {
      const since = new Date()
      since.setDate(since.getDate() - timeRange)
      query = query.gte('created_at', since.toISOString())
    }

    const { data: leadsData } = await query
    const rawLeads = leadsData || []

    // Fetch events for scoring
    const leadIds = rawLeads.map((l) => l.id)
    let eventsMap: Record<string, { event_name: string }[]> = {}

    if (leadIds.length > 0) {
      const { data: eventsData } = await supabase
        .from('events')
        .select('lead_id, event_name')
        .in('lead_id', leadIds)

      if (eventsData) {
        for (const ev of eventsData) {
          const lid = ev.lead_id as string
          if (!eventsMap[lid]) eventsMap[lid] = []
          eventsMap[lid].push({ event_name: ev.event_name })
        }
      }
    }

    // Check unsubscribes
    const { data: unsubData } = await supabase
      .from('unsubscribes')
      .select('email')

    const unsubEmails = new Set((unsubData || []).map((u: { email: string }) => u.email))

    // Enrich leads with scores
    const enriched: EnrichedLead[] = rawLeads.map((lead) => {
      const events = eventsMap[lead.id] || []
      if (unsubEmails.has(lead.email)) {
        events.push({ event_name: 'unsubscribed' })
      }
      const { score, segment } = calculateLeadScore(events)
      return { ...lead, score, segment }
    })

    // Apply segment filter
    let filtered = enriched
    if (segmentFilter) {
      filtered = filtered.filter((l) => l.segment === segmentFilter)
    }

    // Apply search filter
    if (searchText.trim()) {
      const s = searchText.toLowerCase()
      filtered = filtered.filter(
        (l) =>
          l.email.toLowerCase().includes(s) ||
          (l.name && l.name.toLowerCase().includes(s))
      )
    }

    setLeads(filtered)

    // Compute stats
    const today = new Date().toISOString().split('T')[0]
    const todayCount = enriched.filter((l) => l.created_at.startsWith(today)).length
    const hotCount = enriched.filter((l) => l.segment === 'hot').length
    const convertedCount = enriched.filter((l) => l.status === 'converted').length
    const rate = enriched.length > 0 ? Math.round((convertedCount / enriched.length) * 100) : 0

    setStats({
      total: enriched.length,
      today: todayCount,
      hot: hotCount,
      conversionRate: rate,
    })

    setLoading(false)
  }, [typeFilter, statusFilter, langFilter, timeRange, segmentFilter, searchText])

  useEffect(() => {
    loadLeads()
  }, [loadLeads])

  // CSV Export
  const exportCSV = () => {
    const headers = ['email', 'name', 'result_type', 'status', 'score', 'segment', 'utm_source', 'created_at']
    const rows = leads.map((l) =>
      [l.email, l.name || '', l.result_type || '', l.status || '', l.score, l.segment, l.utm_source || '', l.created_at].join(',')
    )
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Save note
  const saveNote = async () => {
    if (!noteModalLeadId || !noteText.trim()) return
    setSavingNote(true)

    const { data: sessionData } = await supabase.auth.getSession()
    const authorId = sessionData?.session?.user?.id

    await supabase.from('admin_notes').insert({
      lead_id: noteModalLeadId,
      author_id: authorId || '00000000-0000-0000-0000-000000000000',
      note: noteText.trim(),
      note_type: 'internal',
    })

    setSavingNote(false)
    setNoteText('')
    setNoteModalLeadId(null)
  }

  // Change status
  const changeStatus = async (leadId: string, newStatus: string) => {
    await supabase.from('leads').update({ status: newStatus }).eq('id', leadId)
    setStatusChangeId(null)
    loadLeads()
  }

  return (
    <div>
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Leads gesamt', value: stats.total },
          { label: 'Heute', value: stats.today },
          { label: 'Hot Leads', value: stats.hot },
          { label: 'Conversion Rate', value: `${stats.conversionRate}%` },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-sm text-kraft-muted mb-1">{card.label}</p>
            <p className="text-3xl font-bold text-kraft-dark">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Segment */}
          <div className="flex gap-1">
            {[
              { value: '' as Segment, label: 'Alle' },
              { value: 'hot' as Segment, label: 'Hot' },
              { value: 'warm' as Segment, label: 'Warm' },
              { value: 'cold' as Segment, label: 'Cold' },
            ].map((s) => (
              <button
                key={s.value}
                onClick={() => setSegmentFilter(s.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-all ${
                  segmentFilter === s.value
                    ? s.value === 'hot'
                      ? 'bg-red-600 text-white'
                      : s.value === 'warm'
                        ? 'bg-orange-500 text-white'
                        : s.value === 'cold'
                          ? 'bg-blue-600 text-white'
                          : 'bg-kraft-dark text-white'
                    : 'bg-kraft-offwhite text-kraft-muted hover:bg-kraft-border/30'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Result Type */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 border border-kraft-border rounded-lg text-xs"
          >
            <option value="">Alle Typen</option>
            {RESULT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-kraft-border rounded-lg text-xs"
          >
            <option value="">Alle Status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Language */}
          <select
            value={langFilter}
            onChange={(e) => setLangFilter(e.target.value)}
            className="px-3 py-1.5 border border-kraft-border rounded-lg text-xs"
          >
            <option value="">Alle Sprachen</option>
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>{l.toUpperCase()}</option>
            ))}
          </select>

          {/* Time Range */}
          <div className="flex gap-1">
            {TIME_RANGES.map((tr) => (
              <button
                key={tr.label}
                onClick={() => setTimeRange(tr.days)}
                className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                  timeRange === tr.days
                    ? 'bg-kraft-dark text-white'
                    : 'bg-kraft-offwhite text-kraft-muted hover:bg-kraft-border/30'
                }`}
              >
                {tr.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Suche (E-Mail / Name)"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="px-3 py-1.5 border border-kraft-border rounded-lg text-xs flex-1 min-w-[160px]"
          />

          {/* CSV Export */}
          <button
            onClick={exportCSV}
            className="px-4 py-1.5 bg-kraft-accent text-white rounded-lg text-xs font-medium cursor-pointer hover:bg-kraft-accent-dark transition-all"
          >
            CSV Export
          </button>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-kraft-muted">Laden...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-kraft-offwhite">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-kraft-muted">Name</th>
                <th className="text-left px-4 py-3 font-medium text-kraft-muted">E-Mail</th>
                <th className="text-left px-4 py-3 font-medium text-kraft-muted">Typ</th>
                <th className="text-left px-4 py-3 font-medium text-kraft-muted">Segment</th>
                <th className="text-left px-4 py-3 font-medium text-kraft-muted">Score</th>
                <th className="text-left px-4 py-3 font-medium text-kraft-muted">Status</th>
                <th className="text-left px-4 py-3 font-medium text-kraft-muted">Quelle</th>
                <th className="text-left px-4 py-3 font-medium text-kraft-muted">Datum</th>
                <th className="text-left px-4 py-3 font-medium text-kraft-muted">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const seg = SEGMENT_COLORS[lead.segment] || SEGMENT_COLORS.cold
                return (
                  <tr key={lead.id} className="border-t border-kraft-border/50">
                    <td className="px-4 py-3 text-kraft-dark">{lead.name || '--'}</td>
                    <td className="px-4 py-3 text-kraft-dark text-xs">{lead.email}</td>
                    <td className="px-4 py-3">
                      {lead.result_type ? (
                        <span className="bg-kraft-accent/10 text-kraft-accent text-xs px-2 py-1 rounded-full">
                          {lead.result_type}
                        </span>
                      ) : '--'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`${seg.bg} ${seg.text} text-xs px-2 py-1 rounded-full font-medium`}>
                        {lead.segment}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-kraft-dark">{lead.score}</td>
                    <td className="px-4 py-3">
                      {statusChangeId === lead.id ? (
                        <select
                          defaultValue={lead.status || 'waitlist'}
                          onChange={(e) => changeStatus(lead.id, e.target.value)}
                          onBlur={() => setStatusChangeId(null)}
                          autoFocus
                          className="px-2 py-1 border border-kraft-border rounded text-xs"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      ) : (
                        <span
                          onClick={() => setStatusChangeId(lead.id)}
                          className="text-xs text-kraft-muted cursor-pointer hover:text-kraft-dark"
                        >
                          {lead.status || 'waitlist'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-kraft-muted text-xs">{lead.utm_source || '--'}</td>
                    <td className="px-4 py-3 text-kraft-muted text-xs">
                      {new Date(lead.created_at).toLocaleDateString('de-DE')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setNoteModalLeadId(lead.id); setNoteText('') }}
                        className="text-xs text-kraft-accent hover:text-kraft-accent-dark cursor-pointer"
                      >
                        + Notiz
                      </button>
                    </td>
                  </tr>
                )
              })}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-kraft-muted">
                    Keine Leads gefunden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Note Modal */}
      {noteModalLeadId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md mx-4">
            <h3 className="font-bold text-kraft-dark mb-3">Interne Notiz</h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Notiz eingeben..."
              rows={4}
              className="w-full px-3 py-2 border border-kraft-border rounded-lg text-sm resize-none focus:border-kraft-accent focus:outline-none"
            />
            <div className="flex gap-2 mt-4 justify-end">
              <button
                onClick={() => setNoteModalLeadId(null)}
                className="px-4 py-2 text-sm text-kraft-muted hover:text-kraft-dark cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                onClick={saveNote}
                disabled={savingNote || !noteText.trim()}
                className="px-4 py-2 bg-kraft-dark text-white rounded-lg text-sm font-medium cursor-pointer disabled:bg-gray-300 hover:bg-kraft-navy transition-all"
              >
                {savingNote ? 'Speichern...' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
