import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const TIME_OPTIONS = [
  { label: '7 Tage', days: 7 },
  { label: '14 Tage', days: 14 },
  { label: '30 Tage', days: 30 },
  { label: '90 Tage', days: 90 },
] as const

interface FunnelStage {
  name: string
  value: number
  conversionFromPrev: number | null
}

export default function AdminFunnelPage() {
  const [days, setDays] = useState(30)
  const [stages, setStages] = useState<FunnelStage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFunnel()
  }, [days])

  async function loadFunnel() {
    setLoading(true)

    const since = new Date()
    since.setDate(since.getDate() - days)
    const sinceISO = since.toISOString()

    // Try v_funnel_daily view first, fall back to direct queries
    let quizStarts = 0
    let quizCompletions = 0
    let waitlistSignups = 0
    let checkoutStarts = 0
    let conversions = 0

    // Try view
    const { data: viewData, error: viewError } = await supabase
      .from('v_funnel_daily')
      .select('quiz_starts, quiz_completions, new_leads, new_subscriptions')
      .gte('day', sinceISO.split('T')[0])

    if (!viewError && viewData && viewData.length > 0) {
      for (const row of viewData) {
        quizStarts += (row.quiz_starts as number) || 0
        quizCompletions += (row.quiz_completions as number) || 0
        waitlistSignups += (row.new_leads as number) || 0
        conversions += (row.new_subscriptions as number) || 0
      }

      // Checkout starts not in the view, query directly
      const { count: checkoutCount } = await supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('event_name', 'checkout_started')
        .gte('created_at', sinceISO)

      checkoutStarts = checkoutCount || 0
    } else {
      // Fallback: direct queries
      const { count: qs } = await supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('event_name', 'quiz_started')
        .gte('created_at', sinceISO)

      const { count: qc } = await supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('event_name', 'quiz_completed')
        .gte('created_at', sinceISO)

      const { count: ws } = await supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('event_name', 'waitlist_submitted')
        .gte('created_at', sinceISO)

      const { count: cs } = await supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('event_name', 'checkout_started')
        .gte('created_at', sinceISO)

      const { count: conv } = await supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('event_name', 'subscription_activated')
        .gte('created_at', sinceISO)

      quizStarts = qs || 0
      quizCompletions = qc || 0
      waitlistSignups = ws || 0
      checkoutStarts = cs || 0
      conversions = conv || 0
    }

    // Build funnel stages
    const raw = [
      { name: 'Quiz Starts', value: quizStarts },
      { name: 'Quiz Completions', value: quizCompletions },
      { name: 'Waitlist Signups', value: waitlistSignups },
      { name: 'Checkout Starts', value: checkoutStarts },
      { name: 'Conversions', value: conversions },
    ]

    const funnelStages: FunnelStage[] = raw.map((stage, i) => ({
      ...stage,
      conversionFromPrev:
        i === 0 || raw[i - 1].value === 0
          ? null
          : Math.round((stage.value / raw[i - 1].value) * 100),
    }))

    setStages(funnelStages)
    setLoading(false)
  }

  const maxValue = Math.max(...stages.map((s) => s.value), 1)

  return (
    <div>
      {/* Time Range Filter */}
      <div className="flex gap-2 mb-6">
        {TIME_OPTIONS.map((opt) => (
          <button
            key={opt.days}
            onClick={() => setDays(opt.days)}
            className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all ${
              days === opt.days
                ? 'bg-kraft-dark text-white'
                : 'bg-white text-kraft-dark border border-kraft-border hover:bg-kraft-offwhite'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center text-kraft-muted">Funnel wird geladen...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-kraft-dark mb-6">
            Funnel der letzten {days} Tage
          </h3>

          <div className="space-y-4">
            {stages.map((stage, i) => {
              const barWidth = maxValue > 0 ? Math.max((stage.value / maxValue) * 100, 3) : 3
              // Gradient from amber to darker amber
              const opacity = 1 - (i * 0.15)

              return (
                <div key={stage.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-kraft-dark w-44">
                        {stage.name}
                      </span>
                      <span className="text-lg font-bold text-kraft-dark">{stage.value}</span>
                    </div>
                    {stage.conversionFromPrev !== null && (
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        stage.conversionFromPrev >= 50
                          ? 'bg-green-50 text-green-700'
                          : stage.conversionFromPrev >= 20
                            ? 'bg-orange-50 text-orange-700'
                            : 'bg-red-50 text-red-700'
                      }`}>
                        {stage.conversionFromPrev}% vom vorherigen Schritt
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-kraft-offwhite rounded-full h-8 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 flex items-center justify-end pr-3"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: `rgba(186, 117, 23, ${opacity})`,
                      }}
                    >
                      {barWidth > 15 && (
                        <span className="text-xs font-bold text-white">
                          {stage.value}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Overall conversion */}
          {stages.length >= 2 && stages[0].value > 0 && (
            <div className="mt-8 pt-6 border-t border-kraft-border/50">
              <div className="flex items-center gap-4">
                <span className="text-sm text-kraft-muted">Gesamte Funnel-Conversion:</span>
                <span className="text-2xl font-bold text-kraft-accent">
                  {Math.round((stages[stages.length - 1].value / stages[0].value) * 100)}%
                </span>
                <span className="text-xs text-kraft-muted">
                  ({stages[stages.length - 1].value} von {stages[0].value})
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
