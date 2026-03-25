import { useState } from 'react'
import { useI18n } from '../../i18n'

export interface ExerciseCardData {
  wger_id?: number
  name: string
  muscles?: string[]
  sets: number
  reps: number
  rest_seconds: number
  image_url?: string
}

interface ExerciseCardProps {
  exercise: ExerciseCardData
  index: number
}

export default function ExerciseCard({ exercise, index }: ExerciseCardProps) {
  const { t } = useI18n()
  const [imgError, setImgError] = useState(false)

  return (
    <div className="flex items-start gap-4 border border-kraft-border/50 rounded-xl p-4 bg-white">
      {/* Image / Placeholder */}
      <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
        {exercise.image_url && !imgError ? (
          <img
            src={exercise.image_url}
            alt={exercise.name}
            loading="lazy"
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <svg className="w-8 h-8 text-kraft-muted/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
          </svg>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-kraft-muted font-mono">#{index + 1}</span>
          <h4 className="font-semibold text-kraft-dark text-sm truncate">{exercise.name}</h4>
        </div>

        {/* Muscle badges */}
        {exercise.muscles && exercise.muscles.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {exercise.muscles.map((muscle) => (
              <span
                key={muscle}
                className="text-[10px] bg-kraft-accent/10 text-kraft-accent px-1.5 py-0.5 rounded-full"
              >
                {muscle}
              </span>
            ))}
          </div>
        )}

        {/* Sets / Reps / Rest */}
        <p className="text-xs text-kraft-muted">
          {exercise.sets} {t.workouts.sets} &middot; {exercise.reps} {t.workouts.reps} &middot; {exercise.rest_seconds}s {t.workouts.rest}
        </p>
      </div>
    </div>
  )
}
