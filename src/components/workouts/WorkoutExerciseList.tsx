import { useState, useEffect } from 'react'
import { useI18n } from '../../i18n'
import { fetchExerciseImages } from '../../services/exercise-api'
import ExerciseCard, { type ExerciseCardData } from './ExerciseCard'

export interface ExerciseData {
  wger_id?: number
  name: string
  muscles?: string[]
  sets: number
  reps: number
  rest_seconds: number
  image_url?: string
}

interface WorkoutExerciseListProps {
  exercises: ExerciseData[]
}

export default function WorkoutExerciseList({ exercises }: WorkoutExerciseListProps) {
  const { lang } = useI18n()
  const [completedSet, setCompletedSet] = useState<Set<number>>(new Set())
  const [enrichedExercises, setEnrichedExercises] = useState<ExerciseCardData[]>([])

  // Enrich exercises with images from wger API
  useEffect(() => {
    let cancelled = false

    async function enrichImages() {
      const enriched = await Promise.all(
        exercises.map(async (ex) => {
          if (ex.image_url) return ex as ExerciseCardData

          if (ex.wger_id) {
            try {
              const images = await fetchExerciseImages(ex.wger_id)
              const mainImg = images.find((img) => img.is_main)
              const imageUrl = mainImg?.image || images[0]?.image || ''
              return { ...ex, image_url: imageUrl } as ExerciseCardData
            } catch {
              return ex as ExerciseCardData
            }
          }

          return ex as ExerciseCardData
        })
      )

      if (!cancelled) {
        setEnrichedExercises(enriched)
      }
    }

    enrichImages()
    return () => { cancelled = true }
  }, [exercises])

  const toggleDone = (index: number) => {
    setCompletedSet((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const doneCount = completedSet.size
  const totalCount = exercises.length
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  const exercisesLabel = lang === 'de' ? 'Übungen' : 'Exercises'
  const doneLabel = lang === 'de' ? 'erledigt' : 'done'

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-kraft-dark">{exercisesLabel}</h3>
          <span className="text-xs text-kraft-muted">
            {doneCount} / {totalCount} {doneLabel}
          </span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-kraft-accent rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Exercise cards */}
      <div className="space-y-3">
        {enrichedExercises.map((exercise, index) => (
          <div key={index} className="relative">
            {/* Checkbox overlay */}
            <button
              type="button"
              onClick={() => toggleDone(index)}
              className={`absolute top-3 right-3 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer ${
                completedSet.has(index)
                  ? 'bg-kraft-accent border-kraft-accent text-white'
                  : 'border-kraft-border bg-white hover:border-kraft-accent'
              }`}
            >
              {completedSet.has(index) && (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            <div className={completedSet.has(index) ? 'opacity-50' : ''}>
              <ExerciseCard exercise={exercise} index={index} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
