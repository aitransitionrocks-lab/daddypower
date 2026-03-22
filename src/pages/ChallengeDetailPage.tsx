import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useI18n } from '../i18n'
import { supabase } from '../lib/supabase'
import { trackEvent } from '../lib/tracking'
import LanguageSwitcher from '../components/LanguageSwitcher'

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

interface ChallengeDay {
  id: string
  day_number: number
  title_de: string
  title_en: string
  task_description_de: string | null
  task_description_en: string | null
  workout_id: string | null
  is_rest_day: boolean
}

interface UserProgress {
  id: string
  status: string
  current_day: number
  completed_days: number[]
  enrolled_at: string
  completed_at: string | null
}

export default function ChallengeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { lang } = useI18n()

  const [challenge, setChallenge] = useState<ChallengeProgram | null>(null)
  const [days, setDays] = useState<ChallengeDay[]>([])
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [completingDay, setCompletingDay] = useState(false)

  // Fetch challenge program
  useEffect(() => {
    if (!id) return

    supabase
      .from('challenge_programs')
      .select('id, title_de, title_en, description_de, description_en, duration_days, difficulty, cover_image_url')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setChallenge(data || null)
        setLoading(false)
      })
  }, [id])

  // Fetch challenge days
  useEffect(() => {
    if (!id) return

    supabase
      .from('challenge_days')
      .select('id, day_number, title_de, title_en, task_description_de, task_description_en, workout_id, is_rest_day')
      .eq('challenge_program_id', id)
      .order('day_number', { ascending: true })
      .then(({ data }) => {
        setDays(data || [])
      })
  }, [id])

  // Fetch user progress
  const fetchProgress = useCallback(() => {
    if (!user || !id) return

    supabase
      .from('user_challenge_progress')
      .select('id, status, current_day, completed_days, enrolled_at, completed_at')
      .eq('user_id', user.id)
      .eq('challenge_program_id', id)
      .single()
      .then(({ data }) => {
        setProgress(data || null)
      })
  }, [user, id])

  useEffect(() => {
    fetchProgress()
  }, [fetchProgress])

  const handleEnroll = async () => {
    if (!user || !id) return
    setEnrolling(true)

    const { error } = await supabase
      .from('user_challenge_progress')
      .insert({
        user_id: user.id,
        challenge_program_id: id,
        status: 'enrolled',
        current_day: 1,
        completed_days: [],
      })

    if (!error) {
      trackEvent('challenge_enrolled', { challenge_id: id })
      fetchProgress()
    }

    setEnrolling(false)
  }

  const handleCompleteDay = async (dayNumber: number) => {
    if (!user || !id || !progress) return
    setCompletingDay(true)

    const newCompletedDays = [...(progress.completed_days || []), dayNumber]
    const allDone = challenge ? newCompletedDays.length >= challenge.duration_days : false

    const updatePayload: Record<string, unknown> = {
      completed_days: newCompletedDays,
      current_day: dayNumber + 1,
    }

    if (allDone) {
      updatePayload.status = 'completed'
      updatePayload.completed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('user_challenge_progress')
      .update(updatePayload)
      .eq('id', progress.id)

    if (!error) {
      trackEvent('challenge_day_completed', { challenge_id: id, day_number: dayNumber })
      fetchProgress()
    }

    setCompletingDay(false)
  }

  const title = challenge ? (lang === 'de' ? challenge.title_de : challenge.title_en) : ''
  const description = challenge ? (lang === 'de' ? challenge.description_de : challenge.description_en) : ''
  const completedSet = new Set(progress?.completed_days || [])
  const isEnrolled = !!progress
  const isCompleted = progress?.status === 'completed'
  const progressPercent = challenge
    ? Math.round(((progress?.completed_days?.length || 0) / challenge.duration_days) * 100)
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-kraft-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LanguageSwitcher />
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <p className="text-gray-500 mb-4">
            {lang === 'de' ? 'Challenge nicht gefunden.' : 'Challenge not found.'}
          </p>
          <button
            onClick={() => navigate('/challenges')}
            className="text-kraft-accent underline cursor-pointer"
          >
            {lang === 'de' ? 'Zurück zu den Challenges' : 'Back to challenges'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LanguageSwitcher />

      {/* Header */}
      <header className="bg-kraft-dark text-white px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">daddypower</h1>
            <p className="text-sm text-gray-400">{title}</p>
          </div>
          <button
            onClick={() => navigate('/challenges')}
            className="text-sm text-gray-300 hover:text-white underline cursor-pointer"
          >
            {lang === 'de' ? 'Alle Challenges' : 'All Challenges'}
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Challenge overview card */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm mb-6">
          <h2 className="text-2xl font-bold text-kraft-dark mb-2">{title}</h2>

          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-block bg-kraft-accent/10 text-kraft-accent text-sm font-medium px-3 py-1 rounded-full">
              {challenge.duration_days} {lang === 'de' ? 'Tage' : 'Days'}
            </span>
            {challenge.difficulty && (
              <span className="inline-block bg-gray-100 text-gray-700 text-sm font-medium px-3 py-1 rounded-full">
                {challenge.difficulty}
              </span>
            )}
            {isCompleted && (
              <span className="inline-block bg-green-100 text-green-700 text-sm font-medium px-3 py-1 rounded-full">
                {lang === 'de' ? 'Abgeschlossen' : 'Completed'}
              </span>
            )}
          </div>

          {description && (
            <p className="text-gray-500 mb-6">{description}</p>
          )}

          {/* Progress bar (visible when enrolled) */}
          {isEnrolled && (
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                <span>{lang === 'de' ? 'Fortschritt' : 'Progress'}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-kraft-accent rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {progress?.completed_days?.length || 0} / {challenge.duration_days}{' '}
                {lang === 'de' ? 'Tage abgeschlossen' : 'days completed'}
              </p>
            </div>
          )}

          {/* Enroll button */}
          {!isEnrolled && (
            <button
              onClick={handleEnroll}
              disabled={enrolling}
              className="w-full md:w-auto bg-kraft-accent text-white font-semibold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
            >
              {enrolling
                ? (lang === 'de' ? 'Wird gestartet...' : 'Starting...')
                : (lang === 'de' ? 'Challenge starten' : 'Start Challenge')}
            </button>
          )}
        </div>

        {/* Day-by-day list (visible when enrolled) */}
        {isEnrolled && days.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-kraft-dark">
              {lang === 'de' ? 'Tagesplan' : 'Daily Plan'}
            </h3>

            {days.map((day) => {
              const isDayCompleted = completedSet.has(day.day_number)
              const isCurrent = day.day_number === (progress?.current_day || 1)
              const dayTitle = lang === 'de' ? day.title_de : day.title_en
              const dayTask = lang === 'de' ? day.task_description_de : day.task_description_en

              return (
                <div
                  key={day.id}
                  className={`bg-white rounded-2xl p-5 shadow-sm border-2 transition-colors ${
                    isCurrent && !isDayCompleted
                      ? 'border-kraft-accent'
                      : isDayCompleted
                        ? 'border-green-200'
                        : 'border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {/* Checkmark or day number */}
                        {isDayCompleted ? (
                          <span className="flex items-center justify-center w-7 h-7 bg-green-100 text-green-600 rounded-full text-sm font-bold">
                            &#10003;
                          </span>
                        ) : (
                          <span className="flex items-center justify-center w-7 h-7 bg-gray-100 text-kraft-dark rounded-full text-sm font-bold">
                            {day.day_number}
                          </span>
                        )}

                        <h4 className="font-semibold text-kraft-dark">
                          {lang === 'de' ? 'Tag' : 'Day'} {day.day_number}
                          {dayTitle ? ` — ${dayTitle}` : ''}
                        </h4>

                        {day.is_rest_day && (
                          <span className="text-xs bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded-full">
                            {lang === 'de' ? 'Ruhetag' : 'Rest Day'}
                          </span>
                        )}
                      </div>

                      {dayTask && (
                        <p className="text-sm text-gray-500 ml-9">{dayTask}</p>
                      )}

                      {day.workout_id && !day.is_rest_day && (
                        <p className="text-xs text-kraft-accent ml-9 mt-1">
                          {lang === 'de' ? 'Workout verknüpft' : 'Workout linked'}
                        </p>
                      )}
                    </div>

                    {/* Complete day button */}
                    {isCurrent && !isDayCompleted && !isCompleted && (
                      <button
                        onClick={() => handleCompleteDay(day.day_number)}
                        disabled={completingDay}
                        className="shrink-0 bg-kraft-accent text-white text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                      >
                        {completingDay
                          ? '...'
                          : (lang === 'de' ? 'Tag abschließen' : 'Complete Day')}
                      </button>
                    )}
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
