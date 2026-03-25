import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useI18n } from '../i18n'
import { supabase } from '../lib/supabase'
import { trackEvent } from '../lib/tracking'
import LanguageSwitcher from '../components/LanguageSwitcher'

interface PartnerChallenge {
  id: string
  challenge_id: string
  is_active: boolean
  metadata: {
    visibility?: string
    requires_approval?: boolean
  } | null
  challenge_programs: {
    id: string
    title_de: string
    title_en: string | null
    duration_days: number
    difficulty: string | null
    is_active: boolean
    metadata: {
      is_published?: boolean
    } | null
  }
}

interface EnrollmentCount {
  challenge_id: string
  count: number
}

export default function PartnerChallengesPage() {
  const { user } = useAuth()
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const pc = t.partnerChallenges

  const [challenges, setChallenges] = useState<PartnerChallenge[]>([])
  const [enrollments, setEnrollments] = useState<EnrollmentCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    trackEvent('partner_challenges_viewed')
  }, [])

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      // Get partner ID
      const { data: partnerData } = await supabase
        .from('partner_network')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!partnerData) {
        setLoading(false)
        return
      }

      // Fetch partner challenges with joined challenge_programs
      const { data: challengeData } = await supabase
        .from('partner_challenges')
        .select('id, challenge_id, is_active, metadata, challenge_programs(id, title_de, title_en, duration_days, difficulty, is_active, metadata)')
        .eq('partner_id', partnerData.id)
        .order('created_at', { ascending: false })

      if (challengeData) {
        setChallenges(challengeData as unknown as PartnerChallenge[])

        // Fetch enrollment counts for these challenges
        const challengeIds = challengeData.map((c) => (c as unknown as PartnerChallenge).challenge_id)
        if (challengeIds.length > 0) {
          const { data: progressData } = await supabase
            .from('user_challenge_progress')
            .select('challenge_id')
            .in('challenge_id', challengeIds)

          if (progressData) {
            const counts: Record<string, number> = {}
            for (const row of progressData) {
              const cid = (row as { challenge_id: string }).challenge_id
              counts[cid] = (counts[cid] || 0) + 1
            }
            setEnrollments(
              Object.entries(counts).map(([challenge_id, count]) => ({
                challenge_id,
                count,
              }))
            )
          }
        }
      }

      setLoading(false)
    }

    fetchData()
  }, [user])

  const getStatusBadge = (ch: PartnerChallenge) => {
    if (ch.is_active && ch.challenge_programs.is_active) {
      return { label: pc.statusActive, className: 'bg-green-100 text-green-800' }
    }
    const isPublished = ch.challenge_programs.metadata?.is_published
    if (!isPublished) {
      return { label: pc.statusWaiting, className: 'bg-yellow-100 text-yellow-800' }
    }
    return { label: pc.statusPaused, className: 'bg-gray-100 text-gray-600' }
  }

  const getEnrollmentCount = (challengeId: string) => {
    return enrollments.find((e) => e.challenge_id === challengeId)?.count || 0
  }

  const handleDelete = async (partnerChallengeId: string, challengeId: string) => {
    if (!confirm(pc.deleteConfirm)) return

    // Delete the partner_challenge entry and the challenge_program
    await supabase.from('partner_challenges').delete().eq('id', partnerChallengeId)
    await supabase.from('challenge_programs').delete().eq('id', challengeId)

    setChallenges((prev) => prev.filter((c) => c.id !== partnerChallengeId))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-kraft-offwhite flex items-center justify-center">
        <div className="animate-pulse text-kraft-muted">...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-kraft-offwhite">
      <LanguageSwitcher />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-kraft-dark">{pc.pageTitle}</h1>
            <p className="text-kraft-muted text-sm">{pc.pageSubtitle}</p>
          </div>
          <button
            onClick={() => navigate('/partner/challenges/new')}
            className="bg-kraft-accent text-white font-semibold text-sm px-4 py-2 rounded-xl hover:bg-kraft-accent/90 transition-colors cursor-pointer"
          >
            {pc.newChallenge}
          </button>
        </div>

        {challenges.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <p className="text-kraft-muted">{pc.noChallenges}</p>
            <button
              onClick={() => navigate('/partner/challenges/new')}
              className="mt-4 bg-kraft-accent text-white font-semibold text-sm px-6 py-2 rounded-xl hover:bg-kraft-accent/90 transition-colors cursor-pointer"
            >
              {pc.newChallenge}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {challenges.map((ch) => {
              const status = getStatusBadge(ch)
              const title =
                lang === 'en' && ch.challenge_programs.title_en
                  ? ch.challenge_programs.title_en
                  : ch.challenge_programs.title_de
              const count = getEnrollmentCount(ch.challenge_id)

              return (
                <div
                  key={ch.id}
                  className="bg-white rounded-2xl p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-kraft-dark truncate">{title}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span
                          className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${status.className}`}
                        >
                          {status.label}
                        </span>
                        <span className="text-xs text-kraft-muted">
                          {ch.challenge_programs.duration_days} {t.challenges.days}
                        </span>
                        {ch.challenge_programs.difficulty && (
                          <span className="text-xs text-kraft-muted capitalize">
                            {ch.challenge_programs.difficulty}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-kraft-muted">
                      {count} {pc.enrollments}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/partner/challenges/${ch.challenge_id}/stats`)}
                        className="text-sm text-kraft-accent font-semibold hover:underline cursor-pointer"
                      >
                        {pc.statsButton}
                      </button>
                      <button
                        onClick={() => handleDelete(ch.id, ch.challenge_id)}
                        className="text-sm text-red-600 font-semibold hover:underline cursor-pointer"
                      >
                        {pc.deleteButton}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
