import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../i18n'
import { supabase } from '../../lib/supabase'
import { trackEvent } from '../../lib/tracking'

interface DayModule {
  day_number: number
  title_de: string
  task_description_de: string
  is_rest_day: boolean
  workout_id: string | null
}

interface WorkoutOption {
  id: string
  title_de: string
}

type ResultType = 'leerer_akku' | 'funktionierer' | 'stiller_kaempfer' | 'performer_auf_reserve'

const DURATION_OPTIONS = [7, 14, 21, 30] as const
const DIFFICULTY_MAP = { easy: 'beginner', medium: 'intermediate', hard: 'advanced' } as const
type DifficultyKey = keyof typeof DIFFICULTY_MAP

interface ChallengeCreatorFormProps {
  onSaved: () => void
}

export default function ChallengeCreatorForm({ onSaved }: ChallengeCreatorFormProps) {
  const { user } = useAuth()
  const { t } = useI18n()
  const pc = t.partnerChallenges

  // Form state
  const [titleDe, setTitleDe] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [descriptionDe, setDescriptionDe] = useState('')
  const [durationDays, setDurationDays] = useState<number>(21)
  const [difficulty, setDifficulty] = useState<DifficultyKey>('medium')
  const [targetTypes, setTargetTypes] = useState<ResultType[]>([])
  const [visibility, setVisibility] = useState<'direct' | 'downline'>('direct')
  const [days, setDays] = useState<DayModule[]>([])
  const [workouts, setWorkouts] = useState<WorkoutOption[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Fetch available workouts
  useEffect(() => {
    const fetchWorkouts = async () => {
      const { data } = await supabase
        .from('workouts')
        .select('id, title_de')
        .eq('is_active', true)
        .order('title_de')

      if (data) setWorkouts(data)
    }
    fetchWorkouts()
  }, [])

  // Initialize day modules when duration changes
  useEffect(() => {
    setDays((prev) => {
      const newDays: DayModule[] = []
      for (let i = 1; i <= durationDays; i++) {
        const existing = prev.find((d) => d.day_number === i)
        newDays.push(
          existing || {
            day_number: i,
            title_de: '',
            task_description_de: '',
            is_rest_day: false,
            workout_id: null,
          }
        )
      }
      return newDays
    })
  }, [durationDays])

  const handleTargetTypeToggle = (type: ResultType) => {
    setTargetTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const updateDay = (dayNumber: number, field: keyof DayModule, value: string | boolean | null) => {
    setDays((prev) =>
      prev.map((d) => (d.day_number === dayNumber ? { ...d, [field]: value } : d))
    )
  }

  const validate = (): string | null => {
    if (!titleDe.trim()) return pc.errorTitleRequired
    if (titleDe.trim().length < 10) return pc.errorTitleLength

    const filledDays = days.filter((d) => d.is_rest_day || d.title_de.trim().length > 0)
    if (filledDays.length < 3) return pc.errorMinDays

    const nonRestDaysWithoutTitle = days.filter((d) => !d.is_rest_day && !d.title_de.trim())
    if (nonRestDaysWithoutTitle.length > 0) return pc.errorDayTitle

    return null
  }

  const handleSave = async () => {
    if (!user) return

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      // 1. Get partner_id from partner_network
      const { data: partnerData } = await supabase
        .from('partner_network')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!partnerData) {
        setError(pc.errorGeneric)
        setSaving(false)
        return
      }

      const partnerId = partnerData.id

      // 2. INSERT into challenge_programs
      const { data: challenge, error: challengeError } = await supabase
        .from('challenge_programs')
        .insert({
          title_de: titleDe.trim(),
          title_en: titleEn.trim() || null,
          description_de: descriptionDe.trim() || null,
          duration_days: durationDays,
          difficulty: DIFFICULTY_MAP[difficulty],
          is_active: false,
          is_public: false,
          partner_id: partnerId,
          metadata: {
            is_global: false,
            is_published: false,
            target_types: targetTypes,
          },
        })
        .select('id')
        .single()

      if (challengeError || !challenge) {
        setError(pc.errorGeneric)
        setSaving(false)
        return
      }

      // 3. INSERT challenge_days
      const challengeDaysInsert = days.map((d) => ({
        challenge_id: challenge.id,
        day_number: d.day_number,
        title_de: d.is_rest_day ? t.challenges.restDay : d.title_de.trim(),
        description_de: d.is_rest_day ? null : d.task_description_de.trim() || null,
        workout_id: d.workout_id || null,
        content: {
          is_rest_day: d.is_rest_day,
        },
      }))

      const { error: daysError } = await supabase
        .from('challenge_days')
        .insert(challengeDaysInsert)

      if (daysError) {
        setError(pc.errorGeneric)
        setSaving(false)
        return
      }

      // 4. INSERT partner_challenges
      const { error: pcError } = await supabase
        .from('partner_challenges')
        .insert({
          partner_id: partnerId,
          challenge_id: challenge.id,
          is_active: false,
          metadata: {
            visibility,
            requires_approval: true,
          },
        })

      if (pcError) {
        setError(pc.errorGeneric)
        setSaving(false)
        return
      }

      // 5. Track event
      trackEvent('partner_challenge_created', {
        challenge_id: challenge.id,
        duration_days: durationDays,
        difficulty,
        target_types: targetTypes,
        visibility,
      })

      setSuccess(true)
      setSaving(false)

      // Redirect after brief success message
      setTimeout(() => {
        onSaved()
      }, 1200)
    } catch {
      setError(pc.errorGeneric)
      setSaving(false)
    }
  }

  const targetTypeLabels: Record<ResultType, string> = {
    leerer_akku: pc.targetLeererAkku,
    funktionierer: pc.targetFunktionierer,
    stiller_kaempfer: pc.targetStillerKaempfer,
    performer_auf_reserve: pc.targetPerformerAufReserve,
  }

  const difficultyLabels: Record<DifficultyKey, string> = {
    easy: pc.difficultyEasy,
    medium: pc.difficultyMedium,
    hard: pc.difficultyHard,
  }

  return (
    <div className="space-y-6">
      {/* Title DE (required) */}
      <div>
        <label className="block text-sm font-semibold text-kraft-dark mb-1">
          {pc.formTitleDe} *
        </label>
        <input
          type="text"
          value={titleDe}
          onChange={(e) => setTitleDe(e.target.value)}
          className="w-full border border-kraft-border rounded-xl px-4 py-3 text-kraft-dark focus:outline-none focus:ring-2 focus:ring-kraft-accent/50"
          placeholder="z.B. 21-Tage Energie-Reset Challenge"
        />
      </div>

      {/* Title EN (optional) */}
      <div>
        <label className="block text-sm font-semibold text-kraft-dark mb-1">
          {pc.formTitleEn}
        </label>
        <input
          type="text"
          value={titleEn}
          onChange={(e) => setTitleEn(e.target.value)}
          className="w-full border border-kraft-border rounded-xl px-4 py-3 text-kraft-dark focus:outline-none focus:ring-2 focus:ring-kraft-accent/50"
          placeholder="e.g. 21-Day Energy Reset Challenge"
        />
      </div>

      {/* Description DE */}
      <div>
        <label className="block text-sm font-semibold text-kraft-dark mb-1">
          {pc.formDescriptionDe}
        </label>
        <textarea
          value={descriptionDe}
          onChange={(e) => setDescriptionDe(e.target.value)}
          rows={4}
          className="w-full border border-kraft-border rounded-xl px-4 py-3 text-kraft-dark focus:outline-none focus:ring-2 focus:ring-kraft-accent/50 resize-y"
        />
      </div>

      {/* Duration */}
      <div>
        <label className="block text-sm font-semibold text-kraft-dark mb-2">
          {pc.formDuration}
        </label>
        <div className="flex gap-3 flex-wrap">
          {DURATION_OPTIONS.map((d) => (
            <label
              key={d}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-colors ${
                durationDays === d
                  ? 'border-kraft-accent bg-kraft-accent/10 text-kraft-accent font-semibold'
                  : 'border-kraft-border text-kraft-muted hover:border-kraft-accent/50'
              }`}
            >
              <input
                type="radio"
                name="duration"
                value={d}
                checked={durationDays === d}
                onChange={() => setDurationDays(d)}
                className="sr-only"
              />
              {d} {pc.durationDays}
            </label>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div>
        <label className="block text-sm font-semibold text-kraft-dark mb-2">
          {pc.formDifficulty}
        </label>
        <div className="flex gap-3 flex-wrap">
          {(Object.keys(DIFFICULTY_MAP) as DifficultyKey[]).map((key) => (
            <label
              key={key}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-colors ${
                difficulty === key
                  ? 'border-kraft-accent bg-kraft-accent/10 text-kraft-accent font-semibold'
                  : 'border-kraft-border text-kraft-muted hover:border-kraft-accent/50'
              }`}
            >
              <input
                type="radio"
                name="difficulty"
                value={key}
                checked={difficulty === key}
                onChange={() => setDifficulty(key)}
                className="sr-only"
              />
              {difficultyLabels[key]}
            </label>
          ))}
        </div>
      </div>

      {/* Target Types */}
      <div>
        <label className="block text-sm font-semibold text-kraft-dark mb-2">
          {pc.formTargetTypes}
        </label>
        <div className="flex gap-3 flex-wrap">
          {(Object.keys(targetTypeLabels) as ResultType[]).map((type) => (
            <label
              key={type}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-colors ${
                targetTypes.includes(type)
                  ? 'border-kraft-accent bg-kraft-accent/10 text-kraft-accent font-semibold'
                  : 'border-kraft-border text-kraft-muted hover:border-kraft-accent/50'
              }`}
            >
              <input
                type="checkbox"
                checked={targetTypes.includes(type)}
                onChange={() => handleTargetTypeToggle(type)}
                className="sr-only"
              />
              {targetTypeLabels[type]}
            </label>
          ))}
        </div>
      </div>

      {/* Visibility */}
      <div>
        <label className="block text-sm font-semibold text-kraft-dark mb-2">
          {pc.formVisibility}
        </label>
        <div className="flex gap-3 flex-wrap">
          <label
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-colors ${
              visibility === 'direct'
                ? 'border-kraft-accent bg-kraft-accent/10 text-kraft-accent font-semibold'
                : 'border-kraft-border text-kraft-muted hover:border-kraft-accent/50'
            }`}
          >
            <input
              type="radio"
              name="visibility"
              value="direct"
              checked={visibility === 'direct'}
              onChange={() => setVisibility('direct')}
              className="sr-only"
            />
            {pc.visibilityDirect}
          </label>
          <label
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-colors ${
              visibility === 'downline'
                ? 'border-kraft-accent bg-kraft-accent/10 text-kraft-accent font-semibold'
                : 'border-kraft-border text-kraft-muted hover:border-kraft-accent/50'
            }`}
          >
            <input
              type="radio"
              name="visibility"
              value="downline"
              checked={visibility === 'downline'}
              onChange={() => setVisibility('downline')}
              className="sr-only"
            />
            {pc.visibilityDownline}
          </label>
        </div>
      </div>

      {/* Day Module Builder */}
      <div>
        <h3 className="text-lg font-bold text-kraft-dark mb-3">{pc.dayModuleTitle}</h3>
        <div className="space-y-4">
          {days.map((day) => (
            <div
              key={day.day_number}
              className={`border rounded-xl p-4 transition-colors ${
                day.is_rest_day
                  ? 'border-kraft-border/50 bg-kraft-offwhite'
                  : 'border-kraft-border'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-kraft-dark">
                  Tag {day.day_number}
                </span>
                <label className="flex items-center gap-2 text-sm text-kraft-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={day.is_rest_day}
                    onChange={(e) => updateDay(day.day_number, 'is_rest_day', e.target.checked)}
                    className="rounded border-kraft-border text-kraft-accent focus:ring-kraft-accent"
                  />
                  {pc.dayRestToggle}
                </label>
              </div>

              {!day.is_rest_day && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={day.title_de}
                    onChange={(e) => updateDay(day.day_number, 'title_de', e.target.value)}
                    placeholder={pc.dayTitle}
                    className="w-full border border-kraft-border/70 rounded-lg px-3 py-2 text-sm text-kraft-dark focus:outline-none focus:ring-2 focus:ring-kraft-accent/50"
                  />
                  <textarea
                    value={day.task_description_de}
                    onChange={(e) =>
                      updateDay(day.day_number, 'task_description_de', e.target.value)
                    }
                    placeholder={pc.dayTaskDescription}
                    rows={2}
                    className="w-full border border-kraft-border/70 rounded-lg px-3 py-2 text-sm text-kraft-dark focus:outline-none focus:ring-2 focus:ring-kraft-accent/50 resize-y"
                  />
                  {workouts.length > 0 && (
                    <select
                      value={day.workout_id || ''}
                      onChange={(e) =>
                        updateDay(day.day_number, 'workout_id', e.target.value || null)
                      }
                      className="w-full border border-kraft-border/70 rounded-lg px-3 py-2 text-sm text-kraft-dark focus:outline-none focus:ring-2 focus:ring-kraft-accent/50"
                    >
                      <option value="">{pc.dayWorkoutNone}</option>
                      {workouts.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.title_de}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error / Success */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
          <p className="text-green-800 text-sm">{pc.savedSuccess}</p>
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving || success}
        className="w-full bg-kraft-accent text-white font-semibold py-3 rounded-xl hover:bg-kraft-accent/90 transition-colors disabled:opacity-50 cursor-pointer"
      >
        {saving ? pc.saving : pc.saveChallenge}
      </button>
    </div>
  )
}
