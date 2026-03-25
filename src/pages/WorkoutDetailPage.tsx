import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useI18n } from '../i18n'
import { supabase } from '../lib/supabase'
import { trackEvent } from '../lib/tracking'
import LanguageSwitcher from '../components/LanguageSwitcher'
import WorkoutExerciseList, { type ExerciseData } from '../components/workouts/WorkoutExerciseList'

interface ExerciseLegacy {
  name: string
  sets: number
  reps: number
  rest_seconds: number
}

interface ExerciseDataRaw {
  wger_id?: number
  name: string
  muscles?: string[]
  sets: number
  reps: number
  rest_seconds: number
  image_url?: string
}

interface ContentAsset {
  id: string
  url: string
  type: string
}

interface WorkoutDetail {
  id: string
  title_de: string
  title_en: string
  description_de: string | null
  description_en: string | null
  duration_minutes: number
  difficulty: 'easy' | 'medium' | 'hard'
  workout_type: 'hiit' | 'kraft' | 'mobility'
  equipment: string[]
  exercises: ExerciseLegacy[]
  exercises_data: ExerciseDataRaw[] | null
  video_asset_id: string | null
}

const difficultyColors: Record<string, string> = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800',
}

const difficultyLabels: Record<string, Record<string, string>> = {
  easy: { de: 'Leicht', en: 'Easy' },
  medium: { de: 'Mittel', en: 'Medium' },
  hard: { de: 'Schwer', en: 'Hard' },
}

const typeLabels: Record<string, Record<string, string>> = {
  hiit: { de: 'HIIT', en: 'HIIT' },
  kraft: { de: 'Kraft', en: 'Strength' },
  mobility: { de: 'Mobilität', en: 'Mobility' },
}

export default function WorkoutDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { lang } = useI18n()

  const [workout, setWorkout] = useState<WorkoutDetail | null>(null)
  const [videoAsset, setVideoAsset] = useState<ContentAsset | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [started, setStarted] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    if (!id) return

    async function fetchWorkout() {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('workouts')
        .select('id, title_de, title_en, description_de, description_en, duration_minutes, difficulty, workout_type, equipment, exercises, exercises_data, video_asset_id')
        .eq('id', id)
        .single()

      if (fetchError || !data) {
        setError(lang === 'de' ? 'Workout nicht gefunden.' : 'Workout not found.')
        setLoading(false)
        return
      }

      const workoutData = data as WorkoutDetail
      setWorkout(workoutData)

      // Fetch video asset if linked
      if (workoutData.video_asset_id) {
        const { data: asset } = await supabase
          .from('content_assets')
          .select('id, url, type')
          .eq('id', workoutData.video_asset_id)
          .single()

        if (asset) {
          setVideoAsset(asset as ContentAsset)
        }
      }

      setLoading(false)
    }

    fetchWorkout()
  }, [id, lang])

  const handleStart = () => {
    setStarted(true)
    trackEvent('workout_started', { workout_id: id })
  }

  const handleComplete = async () => {
    if (!user || !workout || completing) return

    setCompleting(true)

    const { error: insertError } = await supabase
      .from('progress_logs')
      .insert({
        user_id: user.id,
        workout_id: workout.id,
        completed_at: new Date().toISOString(),
      })

    if (insertError) {
      console.warn('Failed to log workout completion:', insertError)
    }

    trackEvent('workout_completed', { workout_id: workout.id })
    setCompleted(true)
    setCompleting(false)
  }

  // Build exercise list from exercises_data (preferred) or legacy exercises
  const exerciseList: ExerciseData[] = (() => {
    if (workout?.exercises_data && Array.isArray(workout.exercises_data) && workout.exercises_data.length > 0) {
      return workout.exercises_data.map((ex) => ({
        wger_id: ex.wger_id,
        name: ex.name,
        muscles: ex.muscles,
        sets: ex.sets,
        reps: ex.reps,
        rest_seconds: ex.rest_seconds,
        image_url: ex.image_url,
      }))
    }
    if (workout?.exercises && Array.isArray(workout.exercises)) {
      return workout.exercises.map((ex) => ({
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        rest_seconds: ex.rest_seconds,
      }))
    }
    return []
  })()

  const title = workout ? (lang === 'de' ? workout.title_de : workout.title_en) : ''
  const description = workout
    ? (lang === 'de' ? workout.description_de : workout.description_en)
    : null

  const backLabel = lang === 'de' ? 'Zurück zur Bibliothek' : 'Back to Library'
  const equipmentLabel = lang === 'de' ? 'Equipment' : 'Equipment'
  const startLabel = lang === 'de' ? 'Workout starten' : 'Start Workout'
  const completeLabel = lang === 'de' ? 'Workout abschließen' : 'Complete Workout'
  const completingLabel = lang === 'de' ? 'Wird gespeichert...' : 'Saving...'
  const completedLabel = lang === 'de' ? 'Erledigt!' : 'Done!'
  const errorLabel = lang === 'de' ? 'Fehler beim Laden.' : 'Failed to load.'

  if (loading) {
    return (
      <div className="min-h-screen bg-kraft-offwhite flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-kraft-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !workout) {
    return (
      <div className="min-h-screen bg-kraft-offwhite">
        <LanguageSwitcher />
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <p className="text-kraft-muted mb-4">{error || errorLabel}</p>
          <button
            onClick={() => navigate('/workouts')}
            className="text-kraft-accent font-semibold hover:underline cursor-pointer"
          >
            {backLabel}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-kraft-offwhite">
      <LanguageSwitcher />

      {/* Header */}
      <header className="bg-kraft-dark text-white px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate('/workouts')}
            className="text-sm text-kraft-muted hover:text-white mb-3 inline-flex items-center gap-1 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {backLabel}
          </button>

          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-kraft-muted">
              {typeLabels[workout.workout_type]?.[lang] ?? workout.workout_type}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${difficultyColors[workout.difficulty]}`}>
              {difficultyLabels[workout.difficulty]?.[lang] ?? workout.difficulty}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>

          <div className="flex items-center gap-1 mt-2 text-kraft-muted text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {workout.duration_minutes} min
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Video */}
        {videoAsset?.url && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <video
              src={videoAsset.url}
              controls
              className="w-full aspect-video bg-black"
              preload="metadata"
            />
          </div>
        )}

        {/* Description */}
        {description && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <p className="text-kraft-dark leading-relaxed">{description}</p>
          </div>
        )}

        {/* Equipment */}
        {workout.equipment && workout.equipment.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-kraft-dark mb-3">{equipmentLabel}</h2>
            <div className="flex flex-wrap gap-2">
              {workout.equipment.map((item) => (
                <span
                  key={item}
                  className="bg-gray-100 text-kraft-muted text-sm px-3 py-1 rounded-lg"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Start Workout / Exercises */}
        {!started && exerciseList.length > 0 ? (
          <div className="pt-4">
            <button
              onClick={handleStart}
              className="w-full bg-kraft-accent text-white font-bold text-lg py-4 rounded-2xl hover:bg-kraft-accent/90 transition-colors cursor-pointer"
            >
              {startLabel}
            </button>
          </div>
        ) : exerciseList.length > 0 ? (
          <WorkoutExerciseList exercises={exerciseList} />
        ) : null}

        {/* Complete button */}
        {started && (
          <div className="pt-4 pb-8">
            {completed ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-green-800 font-semibold text-lg">{completedLabel}</p>
              </div>
            ) : (
              <button
                onClick={handleComplete}
                disabled={completing}
                className="w-full bg-kraft-dark text-white font-bold text-lg py-4 rounded-2xl hover:bg-kraft-dark/90 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {completing ? completingLabel : completeLabel}
              </button>
            )}
          </div>
        )}

        {/* If not started and no exercises, show complete directly */}
        {!started && exerciseList.length === 0 && (
          <div className="pt-4 pb-8">
            {completed ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-green-800 font-semibold text-lg">{completedLabel}</p>
              </div>
            ) : (
              <button
                onClick={handleComplete}
                disabled={completing}
                className="w-full bg-kraft-accent text-white font-bold text-lg py-4 rounded-2xl hover:bg-kraft-accent/90 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {completing ? completingLabel : completeLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
