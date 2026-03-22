import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useI18n } from '../i18n'
import { supabase } from '../lib/supabase'
import { trackEvent } from '../lib/tracking'
import LanguageSwitcher from '../components/LanguageSwitcher'
import ChallengeCard from '../components/ChallengeCard'

interface ChallengeProgram {
  id: string
  title_de: string
  title_en: string
  description_de: string | null
  description_en: string | null
  duration_days: number
  difficulty: string | null
  cover_image_url: string | null
}

export default function ChallengesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { lang } = useI18n()

  const [challenges, setChallenges] = useState<ChallengeProgram[]>([])
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    trackEvent('challenges_viewed')
  }, [])

  // Fetch published global challenges
  useEffect(() => {
    supabase
      .from('challenge_programs')
      .select('id, title_de, title_en, description_de, description_en, duration_days, difficulty, cover_image_url')
      .eq('is_published', true)
      .eq('is_global', true)
      .then(({ data }) => {
        setChallenges(data || [])
        setLoading(false)
      })
  }, [])

  // Fetch user enrollment status
  useEffect(() => {
    if (!user) return

    supabase
      .from('user_challenge_progress')
      .select('challenge_program_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) {
          setEnrolledIds(new Set(data.map((row: { challenge_program_id: string }) => row.challenge_program_id)))
        }
      })
  }, [user])

  return (
    <div className="min-h-screen bg-gray-50">
      <LanguageSwitcher />

      {/* Header */}
      <header className="bg-kraft-dark text-white px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">daddypower</h1>
            <p className="text-sm text-gray-400">
              {lang === 'de' ? 'Challenges' : 'Challenges'}
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-gray-300 hover:text-white underline cursor-pointer"
          >
            {lang === 'de' ? 'Dashboard' : 'Dashboard'}
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-kraft-dark mb-2">
            {lang === 'de' ? 'Verfügbare Challenges' : 'Available Challenges'}
          </h2>
          <p className="text-gray-500">
            {lang === 'de'
              ? 'Wähle eine Challenge und starte noch heute.'
              : 'Pick a challenge and start today.'}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-kraft-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : challenges.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <p className="text-gray-500">
              {lang === 'de'
                ? 'Noch keine Challenges verfügbar. Schau bald wieder vorbei!'
                : 'No challenges available yet. Check back soon!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {challenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                isEnrolled={enrolledIds.has(challenge.id)}
                onClick={() => navigate(`/challenges/${challenge.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
