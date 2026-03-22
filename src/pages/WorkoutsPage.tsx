import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useI18n } from '../i18n'
import { supabase } from '../lib/supabase'
import { trackEvent } from '../lib/tracking'
import LanguageSwitcher from '../components/LanguageSwitcher'
import WorkoutCard, { type WorkoutCardData } from '../components/WorkoutCard'

type WorkoutType = 'hiit' | 'kraft' | 'mobility'
type Difficulty = 'easy' | 'medium' | 'hard'
type Duration = 10 | 20 | 30

const workoutTypes: WorkoutType[] = ['hiit', 'kraft', 'mobility']
const difficulties: Difficulty[] = ['easy', 'medium', 'hard']
const durations: Duration[] = [10, 20, 30]

const typeLabels: Record<WorkoutType, Record<string, string>> = {
  hiit: { de: 'HIIT', en: 'HIIT' },
  kraft: { de: 'Kraft', en: 'Strength' },
  mobility: { de: 'Mobilität', en: 'Mobility' },
}

const difficultyLabels: Record<Difficulty, Record<string, string>> = {
  easy: { de: 'Leicht', en: 'Easy' },
  medium: { de: 'Mittel', en: 'Medium' },
  hard: { de: 'Schwer', en: 'Hard' },
}

export default function WorkoutsPage() {
  useAuth()
  const { lang } = useI18n()

  const [workouts, setWorkouts] = useState<WorkoutCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [filterType, setFilterType] = useState<WorkoutType | ''>('')
  const [filterDuration, setFilterDuration] = useState<Duration | ''>('')
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | ''>('')

  useEffect(() => {
    trackEvent('workout_library_viewed')
  }, [])

  useEffect(() => {
    async function fetchWorkouts() {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('workouts')
        .select('id, title_de, title_en, duration_minutes, difficulty, workout_type, equipment')
        .eq('is_published', true)

      if (filterType) {
        query = query.eq('workout_type', filterType)
      }
      if (filterDuration) {
        query = query.eq('duration_minutes', filterDuration)
      }
      if (filterDifficulty) {
        query = query.eq('difficulty', filterDifficulty)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        setError(lang === 'de' ? 'Fehler beim Laden der Workouts.' : 'Failed to load workouts.')
        setLoading(false)
        return
      }

      setWorkouts((data as WorkoutCardData[]) || [])
      setLoading(false)
    }

    fetchWorkouts()
  }, [filterType, filterDuration, filterDifficulty, lang])

  const allLabel = lang === 'de' ? 'Alle' : 'All'
  const pageTitle = lang === 'de' ? 'Workout-Bibliothek' : 'Workout Library'
  const pageSubtitle = lang === 'de'
    ? 'Kurze, effektive Einheiten für deinen Alltag.'
    : 'Short, effective sessions for your everyday life.'
  const noResults = lang === 'de'
    ? 'Keine Workouts gefunden. Ändere deine Filter.'
    : 'No workouts found. Try changing your filters.'
  const filterTypeLabel = lang === 'de' ? 'Typ' : 'Type'
  const filterDurationLabel = lang === 'de' ? 'Dauer' : 'Duration'
  const filterDifficultyLabel = lang === 'de' ? 'Schwierigkeit' : 'Difficulty'

  return (
    <div className="min-h-screen bg-gray-50">
      <LanguageSwitcher />

      {/* Header */}
      <header className="bg-kraft-dark text-white px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold">{pageTitle}</h1>
          <p className="text-gray-400 mt-1">{pageSubtitle}</p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Type filter */}
            <div>
              <label className="block text-sm font-medium text-kraft-dark mb-1">
                {filterTypeLabel}
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as WorkoutType | '')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-kraft-dark bg-white focus:outline-none focus:ring-2 focus:ring-kraft-accent/30"
              >
                <option value="">{allLabel}</option>
                {workoutTypes.map((type) => (
                  <option key={type} value={type}>
                    {typeLabels[type][lang]}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration filter */}
            <div>
              <label className="block text-sm font-medium text-kraft-dark mb-1">
                {filterDurationLabel}
              </label>
              <select
                value={filterDuration}
                onChange={(e) => setFilterDuration(e.target.value ? Number(e.target.value) as Duration : '')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-kraft-dark bg-white focus:outline-none focus:ring-2 focus:ring-kraft-accent/30"
              >
                <option value="">{allLabel}</option>
                {durations.map((d) => (
                  <option key={d} value={d}>
                    {d} min
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty filter */}
            <div>
              <label className="block text-sm font-medium text-kraft-dark mb-1">
                {filterDifficultyLabel}
              </label>
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value as Difficulty | '')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-kraft-dark bg-white focus:outline-none focus:ring-2 focus:ring-kraft-accent/30"
              >
                <option value="">{allLabel}</option>
                {difficulties.map((d) => (
                  <option key={d} value={d}>
                    {difficultyLabels[d][lang]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-kraft-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && workouts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-kraft-muted">{noResults}</p>
          </div>
        )}

        {/* Workout grid */}
        {!loading && !error && workouts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {workouts.map((workout) => (
              <WorkoutCard key={workout.id} workout={workout} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
