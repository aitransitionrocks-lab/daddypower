import { useState, useEffect, useCallback } from 'react'
import {
  searchExercises,
  fetchExercises,
  fetchExerciseImages,
  EXERCISE_CATEGORIES,
  type WgerExercise,
} from '../../services/exercise-api'

export interface SelectedExercise {
  wger_id: number
  name: string
  muscles: string[]
  muscles_secondary: string[]
  equipment: string[]
  image_url: string
  sets: number
  reps: number
  rest_seconds: number
}

interface ExercisePickerProps {
  value: SelectedExercise[]
  onChange: (exercises: SelectedExercise[]) => void
}

export default function ExercisePicker({ value, onChange }: ExercisePickerProps) {
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null)
  const [results, setResults] = useState<WgerExercise[]>([])
  const [loading, setLoading] = useState(false)

  // Debounced search
  const doSearch = useCallback(async () => {
    setLoading(true)
    try {
      let exercises: WgerExercise[]
      if (query.trim()) {
        exercises = await searchExercises(query)
      } else {
        exercises = await fetchExercises({
          limit: 50,
          category: categoryFilter ?? undefined,
        })
      }

      // If category filter active and we searched by text, filter client-side
      if (categoryFilter && query.trim()) {
        const catName = EXERCISE_CATEGORIES.find((c) => c.id === categoryFilter)?.name
        if (catName) {
          exercises = exercises.filter((e) => e.category === catName)
        }
      }

      setResults(exercises)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [query, categoryFilter])

  useEffect(() => {
    const timer = setTimeout(doSearch, 400)
    return () => clearTimeout(timer)
  }, [doSearch])

  const addExercise = async (exercise: WgerExercise) => {
    // Check if already selected
    if (value.some((e) => e.wger_id === exercise.id)) return

    // Fetch images
    let imageUrl = ''
    const existingMain = exercise.images.find((img) => img.is_main)
    if (existingMain) {
      imageUrl = existingMain.image
    } else if (exercise.images.length > 0) {
      imageUrl = exercise.images[0].image
    } else {
      const images = await fetchExerciseImages(exercise.id)
      const main = images.find((img) => img.is_main)
      imageUrl = main?.image || images[0]?.image || ''
    }

    const selected: SelectedExercise = {
      wger_id: exercise.id,
      name: exercise.name,
      muscles: exercise.muscles,
      muscles_secondary: exercise.muscles_secondary,
      equipment: exercise.equipment,
      image_url: imageUrl,
      sets: 3,
      reps: 12,
      rest_seconds: 60,
    }

    onChange([...value, selected])
  }

  const removeExercise = (index: number) => {
    const next = [...value]
    next.splice(index, 1)
    onChange(next)
  }

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= value.length) return
    const next = [...value]
    const temp = next[index]
    next[index] = next[target]
    next[target] = temp
    onChange(next)
  }

  const updateExercise = (index: number, field: 'sets' | 'reps' | 'rest_seconds', val: number) => {
    const next = [...value]
    next[index] = { ...next[index], [field]: val }
    onChange(next)
  }

  return (
    <div className="space-y-6">
      {/* Search + Category Filter */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Übung suchen (z.B. Squat, Bench Press)..."
            className="flex-1 px-4 py-3 border-2 border-kraft-border rounded-xl focus:border-kraft-accent focus:outline-none text-sm"
          />
          <select
            value={categoryFilter ?? ''}
            onChange={(e) => setCategoryFilter(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-2 border-2 border-kraft-border rounded-xl text-sm focus:border-kraft-accent focus:outline-none"
          >
            <option value="">Alle Kategorien</option>
            {EXERCISE_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Results Grid */}
        <div className="border border-kraft-border/50 rounded-xl max-h-64 overflow-y-auto bg-white">
          {loading ? (
            <div className="p-6 text-center">
              <div className="w-5 h-5 border-2 border-kraft-accent border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : results.length === 0 ? (
            <p className="p-4 text-sm text-kraft-muted text-center">Keine Übungen gefunden.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3">
              {results.map((exercise) => {
                const isSelected = value.some((e) => e.wger_id === exercise.id)
                return (
                  <button
                    key={exercise.id}
                    type="button"
                    onClick={() => addExercise(exercise)}
                    disabled={isSelected}
                    className={`flex items-center gap-3 p-2 rounded-lg text-left text-sm transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-kraft-accent/10 text-kraft-muted opacity-60'
                        : 'hover:bg-kraft-offwhite text-kraft-dark'
                    }`}
                  >
                    {/* Image thumbnail */}
                    <div className="w-10 h-10 rounded bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {exercise.images.length > 0 ? (
                        <img
                          src={exercise.images[0].image}
                          alt={exercise.name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className="w-5 h-5 text-kraft-muted/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{exercise.name}</p>
                      <p className="text-[10px] text-kraft-muted truncate">
                        {exercise.category}{exercise.muscles.length > 0 ? ` · ${exercise.muscles.join(', ')}` : ''}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] text-kraft-accent font-semibold">Hinzugefügt</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Selected Exercises */}
      {value.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-kraft-dark">
            Ausgewählte Übungen ({value.length})
          </h4>

          {value.map((exercise, index) => (
            <div
              key={`${exercise.wger_id}-${index}`}
              className="flex items-start gap-3 border border-kraft-border/50 rounded-xl p-3 bg-white"
            >
              {/* Reorder buttons */}
              <div className="flex flex-col gap-1 pt-1">
                <button
                  type="button"
                  onClick={() => moveExercise(index, 'up')}
                  disabled={index === 0}
                  className="w-6 h-6 flex items-center justify-center rounded text-kraft-muted hover:bg-kraft-offwhite disabled:opacity-30 cursor-pointer"
                  title="Nach oben"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => moveExercise(index, 'down')}
                  disabled={index === value.length - 1}
                  className="w-6 h-6 flex items-center justify-center rounded text-kraft-muted hover:bg-kraft-offwhite disabled:opacity-30 cursor-pointer"
                  title="Nach unten"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Image */}
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                {exercise.image_url ? (
                  <img src={exercise.image_url} alt={exercise.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-kraft-muted/30">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Info + inputs */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-kraft-dark text-sm truncate mb-2">
                  #{index + 1} {exercise.name}
                </p>

                <div className="flex flex-wrap gap-2">
                  <label className="flex items-center gap-1 text-xs text-kraft-muted">
                    Sets
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={exercise.sets}
                      onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value) || 1)}
                      className="w-14 px-2 py-1 border border-kraft-border rounded text-sm text-kraft-dark"
                    />
                  </label>
                  <label className="flex items-center gap-1 text-xs text-kraft-muted">
                    Reps
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={exercise.reps}
                      onChange={(e) => updateExercise(index, 'reps', parseInt(e.target.value) || 1)}
                      className="w-14 px-2 py-1 border border-kraft-border rounded text-sm text-kraft-dark"
                    />
                  </label>
                  <label className="flex items-center gap-1 text-xs text-kraft-muted">
                    Pause (s)
                    <input
                      type="number"
                      min={0}
                      max={300}
                      step={5}
                      value={exercise.rest_seconds}
                      onChange={(e) => updateExercise(index, 'rest_seconds', parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-1 border border-kraft-border rounded text-sm text-kraft-dark"
                    />
                  </label>
                </div>
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeExercise(index)}
                className="text-kraft-muted hover:text-red-500 p-1 cursor-pointer"
                title="Entfernen"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
