import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useI18n } from '../i18n'
import { supabase } from '../lib/supabase'
import { trackEvent } from '../lib/tracking'
import LanguageSwitcher from '../components/LanguageSwitcher'

interface ChallengeInfo {
  title_de: string
  title_en: string | null
  duration_days: number
}

interface StatsData {
  enrollmentCount: number
  avgProgress: number
  completionRate: number
  dropouts: number
}

export default function PartnerChallengeStatsPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const pc = t.partnerChallenges

  const [challenge, setChallenge] = useState<ChallengeInfo | null>(null)
  const [stats, setStats] = useState<StatsData>({
    enrollmentCount: 0,
    avgProgress: 0,
    completionRate: 0,
    dropouts: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    trackEvent('partner_challenge_stats_viewed', { challenge_id: id })
  }, [id])

  useEffect(() => {
    if (!user || !id) return

    const fetchStats = async () => {
      // Fetch challenge info
      const { data: challengeData } = await supabase
        .from('challenge_programs')
        .select('title_de, title_en, duration_days')
        .eq('id', id)
        .single()

      if (!challengeData) {
        setLoading(false)
        return
      }

      setChallenge(challengeData)

      // Fetch all progress entries for this challenge
      const { data: progressData } = await supabase
        .from('user_challenge_progress')
        .select('current_day, status')
        .eq('challenge_id', id)

      if (progressData && progressData.length > 0) {
        const total = progressData.length
        const completed = progressData.filter(
          (p) => (p as { status: string }).status === 'completed'
        ).length
        const dropped = progressData.filter(
          (p) => (p as { status: string }).status === 'abandoned'
        ).length

        const sumProgress = progressData.reduce((acc, p) => {
          const day = (p as { current_day: number }).current_day
          return acc + day / challengeData.duration_days
        }, 0)

        setStats({
          enrollmentCount: total,
          avgProgress: Math.round((sumProgress / total) * 100),
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
          dropouts: dropped,
        })
      }

      setLoading(false)
    }

    fetchStats()
  }, [user, id])

  if (loading) {
    return (
      <div className="min-h-screen bg-kraft-offwhite flex items-center justify-center">
        <div className="animate-pulse text-kraft-muted">...</div>
      </div>
    )
  }

  const title =
    challenge && lang === 'en' && challenge.title_en
      ? challenge.title_en
      : challenge?.title_de || ''

  return (
    <div className="min-h-screen bg-kraft-offwhite">
      <LanguageSwitcher />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/partner/challenges')}
          className="text-sm text-kraft-muted hover:text-kraft-dark mb-4 cursor-pointer"
        >
          {pc.backToList}
        </button>

        <h1 className="text-2xl font-bold text-kraft-dark mb-1">{pc.statsTitle}</h1>
        <p className="text-kraft-muted text-sm mb-6">{title}</p>

        <div className="grid grid-cols-2 gap-4">
          {/* Enrollments */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-kraft-muted uppercase tracking-wide mb-1">
              {pc.statsEnrollments}
            </p>
            <p className="text-3xl font-bold text-kraft-accent">{stats.enrollmentCount}</p>
          </div>

          {/* Average Progress */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-kraft-muted uppercase tracking-wide mb-1">
              {pc.statsAvgProgress}
            </p>
            <p className="text-3xl font-bold text-kraft-dark">{stats.avgProgress}%</p>
          </div>

          {/* Completion Rate */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-kraft-muted uppercase tracking-wide mb-1">
              {pc.statsCompletionRate}
            </p>
            <p className="text-3xl font-bold text-green-700">{stats.completionRate}%</p>
          </div>

          {/* Dropouts */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-kraft-muted uppercase tracking-wide mb-1">
              {pc.statsDropouts}
            </p>
            <p className="text-3xl font-bold text-red-600">{stats.dropouts}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
