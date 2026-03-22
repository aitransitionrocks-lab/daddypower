import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n'

export interface WorkoutCardData {
  id: string
  title_de: string
  title_en: string
  duration_minutes: number
  difficulty: 'easy' | 'medium' | 'hard'
  workout_type: 'hiit' | 'kraft' | 'mobility'
  equipment: string[]
}

interface WorkoutCardProps {
  workout: WorkoutCardData
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

export default function WorkoutCard({ workout }: WorkoutCardProps) {
  const navigate = useNavigate()
  const { lang } = useI18n()

  const title = lang === 'de' ? workout.title_de : workout.title_en

  return (
    <button
      onClick={() => navigate(`/workouts/${workout.id}`)}
      className="bg-white rounded-2xl shadow-sm p-5 text-left hover:shadow-md transition-shadow cursor-pointer w-full"
    >
      {/* Type badge */}
      <span className="inline-block text-xs font-semibold text-kraft-muted uppercase tracking-wide mb-2">
        {typeLabels[workout.workout_type]?.[lang] ?? workout.workout_type}
      </span>

      {/* Title */}
      <h3 className="text-lg font-bold text-kraft-dark mb-3 line-clamp-2">
        {title}
      </h3>

      {/* Duration + Difficulty */}
      <div className="flex items-center gap-3 mb-3">
        <span className="flex items-center gap-1 text-sm text-kraft-muted">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {workout.duration_minutes} min
        </span>

        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${difficultyColors[workout.difficulty]}`}>
          {difficultyLabels[workout.difficulty]?.[lang] ?? workout.difficulty}
        </span>
      </div>

      {/* Equipment tags */}
      {workout.equipment && workout.equipment.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {workout.equipment.map((item) => (
            <span
              key={item}
              className="text-xs bg-gray-100 text-kraft-muted px-2 py-0.5 rounded-md"
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </button>
  )
}
