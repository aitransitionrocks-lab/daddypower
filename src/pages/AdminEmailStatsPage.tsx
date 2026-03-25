import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface OverviewStats {
  totalSent: number
  avgOpenRate: number
  avgClickRate: number
  unsubscribeRate: number
}

interface StepStats {
  step: number
  sent: number
  opened: number
  clicked: number
  unsubscribed: number
}

interface TypePerformance {
  resultType: string
  sent: number
  opened: number
  openRate: number
}

function rateColor(rate: number, good: number, bad: number): string {
  if (rate >= good) return 'text-green-700 bg-green-50'
  if (rate <= bad) return 'text-red-700 bg-red-50'
  return 'text-orange-700 bg-orange-50'
}

export default function AdminEmailStatsPage() {
  const [overview, setOverview] = useState<OverviewStats>({
    totalSent: 0,
    avgOpenRate: 0,
    avgClickRate: 0,
    unsubscribeRate: 0,
  })
  const [stepStats, setStepStats] = useState<StepStats[]>([])
  const [typePerformance, setTypePerformance] = useState<TypePerformance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)

    // Total emails sent
    const { count: totalSent } = await supabase
      .from('email_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'sent')

    // Email opened events
    const { count: totalOpened } = await supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('event_name', 'email_opened')

    // Email clicked events
    const { count: totalClicked } = await supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('event_name', 'email_clicked')

    // Unsubscribes
    const { count: totalUnsubs } = await supabase
      .from('unsubscribes')
      .select('id', { count: 'exact', head: true })

    const sent = totalSent || 0
    const opened = totalOpened || 0
    const clicked = totalClicked || 0
    const unsubs = totalUnsubs || 0

    setOverview({
      totalSent: sent,
      avgOpenRate: sent > 0 ? Math.round((opened / sent) * 100) : 0,
      avgClickRate: sent > 0 ? Math.round((clicked / sent) * 100) : 0,
      unsubscribeRate: sent > 0 ? Math.round((unsubs / sent) * 100 * 10) / 10 : 0,
    })

    // Step-level stats from email_queue metadata
    // We assume template_data has a "step" field
    const { data: sentEmails } = await supabase
      .from('email_queue')
      .select('id, lead_id, template_data, to_email')
      .eq('status', 'sent')
      .limit(2000)

    // Group by step
    const stepMap = new Map<number, { sent: number; emails: Set<string> }>()

    for (const email of sentEmails || []) {
      const step = (email.template_data as Record<string, unknown>)?.step as number || 0
      if (!stepMap.has(step)) {
        stepMap.set(step, { sent: 0, emails: new Set() })
      }
      const entry = stepMap.get(step)!
      entry.sent++
      entry.emails.add(email.to_email)
    }

    // Get open/click events grouped by lead
    const { data: openEvents } = await supabase
      .from('events')
      .select('lead_id, properties')
      .eq('event_name', 'email_opened')
      .limit(5000)

    const { data: clickEvents } = await supabase
      .from('events')
      .select('lead_id, properties')
      .eq('event_name', 'email_clicked')
      .limit(5000)

    // Build step stats
    const steps: StepStats[] = []
    const sortedSteps = Array.from(stepMap.keys()).sort((a, b) => a - b)

    for (const step of sortedSteps) {
      const entry = stepMap.get(step)!
      const stepOpens = (openEvents || []).filter(
        (e) => (e.properties as Record<string, unknown>)?.step === step
      ).length
      const stepClicks = (clickEvents || []).filter(
        (e) => (e.properties as Record<string, unknown>)?.step === step
      ).length

      steps.push({
        step,
        sent: entry.sent,
        opened: stepOpens,
        clicked: stepClicks,
        unsubscribed: 0,
      })
    }

    // If no step data, show a summary row
    if (steps.length === 0 && sent > 0) {
      steps.push({
        step: 1,
        sent,
        opened,
        clicked,
        unsubscribed: unsubs,
      })
    }

    setStepStats(steps)

    // Performance per result type
    // Get leads with result types for sent emails
    const { data: leadsWithType } = await supabase
      .from('leads')
      .select('id, email, result_type')
      .not('result_type', 'is', null)
      .limit(2000)

    const typeMap = new Map<string, { sent: number; opened: number }>()

    for (const lead of leadsWithType || []) {
      const rt = lead.result_type!
      if (!typeMap.has(rt)) {
        typeMap.set(rt, { sent: 0, opened: 0 })
      }

      // Count emails sent to this lead
      const sentToLead = (sentEmails || []).filter((e) => e.to_email === lead.email).length
      const opensForLead = (openEvents || []).filter((e) => e.lead_id === lead.id).length

      const entry = typeMap.get(rt)!
      entry.sent += sentToLead
      entry.opened += opensForLead
    }

    const typePerf: TypePerformance[] = Array.from(typeMap.entries())
      .map(([resultType, data]) => ({
        resultType,
        sent: data.sent,
        opened: data.opened,
        openRate: data.sent > 0 ? Math.round((data.opened / data.sent) * 100) : 0,
      }))
      .sort((a, b) => b.openRate - a.openRate)

    setTypePerformance(typePerf)
    setLoading(false)
  }

  if (loading) {
    return <div className="p-8 text-center text-kraft-muted">E-Mail-Statistiken werden geladen...</div>
  }

  const maxOpenRate = Math.max(...typePerformance.map((t) => t.openRate), 1)

  return (
    <div>
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'E-Mails gesendet', value: overview.totalSent },
          { label: 'Open Rate', value: `${overview.avgOpenRate}%` },
          { label: 'Click Rate', value: `${overview.avgClickRate}%` },
          { label: 'Abmelderate', value: `${overview.unsubscribeRate}%` },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-sm text-kraft-muted mb-1">{card.label}</p>
            <p className="text-3xl font-bold text-kraft-dark">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Step Performance */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h3 className="font-bold text-kraft-dark mb-4">Performance pro Sequenz-Schritt</h3>
        {stepStats.length === 0 ? (
          <p className="text-kraft-muted text-sm">Noch keine E-Mail-Daten vorhanden.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-kraft-offwhite">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-kraft-muted">Schritt</th>
                <th className="text-left px-4 py-3 font-medium text-kraft-muted">Gesendet</th>
                <th className="text-left px-4 py-3 font-medium text-kraft-muted">Geoeffnet</th>
                <th className="text-left px-4 py-3 font-medium text-kraft-muted">Geklickt</th>
                <th className="text-left px-4 py-3 font-medium text-kraft-muted">Abgemeldet</th>
              </tr>
            </thead>
            <tbody>
              {stepStats.map((s) => {
                const openRate = s.sent > 0 ? Math.round((s.opened / s.sent) * 100) : 0
                const clickRate = s.sent > 0 ? Math.round((s.clicked / s.sent) * 100) : 0
                const unsubRate = s.sent > 0 ? Math.round((s.unsubscribed / s.sent) * 100) : 0
                return (
                  <tr key={s.step} className="border-t border-kraft-border/50">
                    <td className="px-4 py-3 font-medium text-kraft-dark">Schritt {s.step}</td>
                    <td className="px-4 py-3 text-kraft-dark">{s.sent}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${rateColor(openRate, 30, 10)}`}>
                        {s.opened} ({openRate}%)
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${rateColor(clickRate, 10, 3)}`}>
                        {s.clicked} ({clickRate}%)
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${rateColor(100 - unsubRate, 98, 95)}`}>
                        {s.unsubscribed} ({unsubRate}%)
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Performance per Result Type — CSS bar chart */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-bold text-kraft-dark mb-4">Open Rate nach Ergebnis-Typ</h3>
        {typePerformance.length === 0 ? (
          <p className="text-kraft-muted text-sm">Noch keine Daten nach Typ vorhanden.</p>
        ) : (
          <div className="space-y-3">
            {typePerformance.map((tp) => (
              <div key={tp.resultType}>
                <div className="flex justify-between text-xs text-kraft-muted mb-1">
                  <span className="font-medium text-kraft-dark">{tp.resultType}</span>
                  <span>{tp.openRate}% ({tp.opened}/{tp.sent})</span>
                </div>
                <div className="w-full bg-kraft-offwhite rounded-full h-5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max((tp.openRate / maxOpenRate) * 100, 2)}%`,
                      backgroundColor: '#BA7517',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
