import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useI18n } from '../i18n'
import ExercisePicker, { type SelectedExercise } from '../components/admin/ExercisePicker'

type Difficulty = 'easy' | 'medium' | 'hard'
type WorkoutType = 'hiit' | 'kraft' | 'mobility'
type Duration = 10 | 20 | 30

const EQUIPMENT_OPTIONS = [
  'Keine',
  'Kurzhanteln',
  'Kettlebell',
  'Widerstandsband',
  'Klimmzugstange',
  'Matte',
]

const TARGET_TYPE_OPTIONS = [
  'leerer_akku',
  'funktionierer',
  'stiller_kaempfer',
  'performer_auf_reserve',
]

export default function AdminWorkoutCreatorPage() {
  const navigate = useNavigate()
  const { lang } = useI18n()

  const [titleDe, setTitleDe] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [duration, setDuration] = useState<Duration>(20)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [workoutType, setWorkoutType] = useState<WorkoutType>('kraft')
  const [equipment, setEquipment] = useState<string[]>([])
  const [targetTypes, setTargetTypes] = useState<string[]>([])
  const [exercises, setExercises] = useState<SelectedExercise[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleEquipment = (item: string) => {
    setEquipment((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]
    )
  }

  const toggleTargetType = (item: string) => {
    setTargetTypes((prev) =>
      prev.includes(item) ? prev.filter((t) => t !== item) : [...prev, item]
    )
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titleDe.trim()) {
      setError(lang === 'de' ? 'Bitte einen deutschen Titel eingeben.' : 'Please enter a German title.')
      return
    }
    if (exercises.length === 0) {
      setError(lang === 'de' ? 'Bitte mindestens eine Übung hinzufügen.' : 'Please add at least one exercise.')
      return
    }

    setSaving(true)
    setError(null)

    const exercisesData = exercises.map((ex) => ({
      wger_id: ex.wger_id,
      name: ex.name,
      muscles: ex.muscles,
      muscles_secondary: ex.muscles_secondary,
      equipment: ex.equipment,
      image_url: ex.image_url,
      sets: ex.sets,
      reps: ex.reps,
      rest_seconds: ex.rest_seconds,
    }))

    const wgerIds = exercises.map((ex) => ex.wger_id)

    // Build legacy exercises array for backward compatibility
    const legacyExercises = exercises.map((ex) => ({
      name: ex.name,
      sets: ex.sets,
      reps: ex.reps,
      rest_seconds: ex.rest_seconds,
    }))

    const { error: insertError } = await supabase
      .from('workouts')
      .insert({
        title_de: titleDe.trim(),
        title_en: titleEn.trim() || titleDe.trim(),
        duration_minutes: duration,
        difficulty,
        workout_type: workoutType,
        equipment: equipment.filter((e) => e !== 'Keine'),
        target_types: targetTypes,
        exercises: legacyExercises,
        exercises_data: exercisesData,
        wger_exercise_ids: wgerIds,
      })

    setSaving(false)

    if (insertError) {
      console.warn('Failed to create workout:', insertError)
      setError(lang === 'de' ? 'Speichern fehlgeschlagen.' : 'Failed to save.')
      return
    }

    navigate('/admin')
  }

  return (
    <div className="min-h-screen bg-kraft-offwhite">
      <header className="bg-kraft-dark text-white px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">
            {lang === 'de' ? 'Neues Workout erstellen' : 'Create New Workout'}
          </h1>
          <button
            onClick={() => navigate('/admin')}
            className="text-sm text-kraft-border hover:text-white cursor-pointer"
          >
            {lang === 'de' ? 'Abbrechen' : 'Cancel'}
          </button>
        </div>
      </header>

      <form onSubmit={handleSave} className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Titles */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-bold text-kraft-dark">
            {lang === 'de' ? 'Grunddaten' : 'Basic Info'}
          </h2>

          <div>
            <label className="block text-xs font-medium text-kraft-muted mb-1">Titel (DE) *</label>
            <input
              type="text"
              value={titleDe}
              onChange={(e) => setTitleDe(e.target.value)}
              placeholder="z.B. 20-Minuten Kraft-Reserve"
              className="w-full px-4 py-3 border-2 border-kraft-border rounded-xl focus:border-kraft-accent focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-kraft-muted mb-1">Titel (EN)</label>
            <input
              type="text"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="e.g. 20-Minute Strength Reserve"
              className="w-full px-4 py-3 border-2 border-kraft-border rounded-xl focus:border-kraft-accent focus:outline-none"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-medium text-kraft-muted mb-2">
              {lang === 'de' ? 'Dauer' : 'Duration'}
            </label>
            <div className="flex gap-2">
              {([10, 20, 30] as Duration[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    duration === d
                      ? 'bg-kraft-dark text-white'
                      : 'bg-kraft-offwhite text-kraft-dark border border-kraft-border hover:bg-gray-100'
                  }`}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-xs font-medium text-kraft-muted mb-2">
              {lang === 'de' ? 'Schwierigkeit' : 'Difficulty'}
            </label>
            <div className="flex gap-2">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    difficulty === d
                      ? 'bg-kraft-dark text-white'
                      : 'bg-kraft-offwhite text-kraft-dark border border-kraft-border hover:bg-gray-100'
                  }`}
                >
                  {d === 'easy' ? (lang === 'de' ? 'Leicht' : 'Easy') :
                   d === 'medium' ? (lang === 'de' ? 'Mittel' : 'Medium') :
                   (lang === 'de' ? 'Schwer' : 'Hard')}
                </button>
              ))}
            </div>
          </div>

          {/* Workout Type */}
          <div>
            <label className="block text-xs font-medium text-kraft-muted mb-2">
              {lang === 'de' ? 'Workout-Typ' : 'Workout Type'}
            </label>
            <div className="flex gap-2">
              {(['hiit', 'kraft', 'mobility'] as WorkoutType[]).map((wt) => (
                <button
                  key={wt}
                  type="button"
                  onClick={() => setWorkoutType(wt)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    workoutType === wt
                      ? 'bg-kraft-dark text-white'
                      : 'bg-kraft-offwhite text-kraft-dark border border-kraft-border hover:bg-gray-100'
                  }`}
                >
                  {wt === 'hiit' ? 'HIIT' : wt === 'kraft' ? (lang === 'de' ? 'Kraft' : 'Strength') : (lang === 'de' ? 'Mobilität' : 'Mobility')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Equipment */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-kraft-dark mb-3">Equipment</h2>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT_OPTIONS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => toggleEquipment(item)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${
                  equipment.includes(item)
                    ? 'bg-kraft-accent text-white'
                    : 'bg-kraft-offwhite text-kraft-dark border border-kraft-border hover:bg-gray-100'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Target Types */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-kraft-dark mb-3">
            {lang === 'de' ? 'Zielgruppen (Energie-Typen)' : 'Target Types'}
          </h2>
          <div className="flex flex-wrap gap-2">
            {TARGET_TYPE_OPTIONS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => toggleTargetType(item)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${
                  targetTypes.includes(item)
                    ? 'bg-kraft-accent text-white'
                    : 'bg-kraft-offwhite text-kraft-dark border border-kraft-border hover:bg-gray-100'
                }`}
              >
                {item.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise Picker */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-kraft-dark mb-4">
            {lang === 'de' ? 'Übungen' : 'Exercises'}
          </h2>
          <ExercisePicker value={exercises} onChange={setExercises} />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Save button */}
        <div className="pt-2 pb-8">
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-kraft-accent text-white font-bold text-lg py-4 rounded-2xl hover:bg-kraft-accent/90 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving
              ? (lang === 'de' ? 'Wird gespeichert...' : 'Saving...')
              : (lang === 'de' ? 'Workout speichern' : 'Save Workout')}
          </button>
        </div>
      </form>
    </div>
  )
}
