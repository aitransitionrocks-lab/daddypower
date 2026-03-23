import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useI18n } from '../i18n'
import { supabase } from '../lib/supabase'
import { trackEvent } from '../lib/tracking'
import LanguageSwitcher from '../components/LanguageSwitcher'

const ENERGY_EMOJIS = ['😴', '😪', '😐', '🙂', '😊', '💪', '🔥', '⚡', '🚀', '🏆']
const MOOD_EMOJIS = ['😞', '😟', '😕', '😐', '🙂', '😊', '😄', '😁', '🤩', '😎']
const STRESS_EMOJIS = ['😌', '🧘', '😊', '🙂', '😐', '😕', '😣', '😤', '🤯', '💥']

function getTodayDateString(): string {
  const now = new Date()
  return now.toISOString().split('T')[0]
}

export default function CheckInPage() {
  const { user } = useAuth()
  const { t } = useI18n()

  const [energyLevel, setEnergyLevel] = useState(5)
  const [moodScore, setMoodScore] = useState(5)
  const [sleepHours, setSleepHours] = useState('')
  const [stressLevel, setStressLevel] = useState(5)
  const [notes, setNotes] = useState('')

  const [existingCheckIn, setExistingCheckIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [streak, setStreak] = useState(0)
  const [error, setError] = useState('')

  // Fetch today's check-in on mount
  useEffect(() => {
    if (!user) return

    const fetchTodayCheckIn = async () => {
      const today = getTodayDateString()

      const { data, error: fetchError } = await supabase
        .from('check_ins')
        .select('energy_level, mood_score, sleep_hours, stress_level, notes')
        .eq('user_id', user.id)
        .eq('check_in_date', today)
        .single()

      if (data && !fetchError) {
        setEnergyLevel(data.energy_level)
        setMoodScore(data.mood_score)
        setSleepHours(data.sleep_hours?.toString() || '')
        setStressLevel(data.stress_level)
        setNotes(data.notes || '')
        setExistingCheckIn(true)
      }

      setLoading(false)
    }

    fetchTodayCheckIn()
  }, [user])

  // Calculate streak
  const calculateStreak = async () => {
    if (!user) return 0

    const { data, error: streakError } = await supabase
      .from('check_ins')
      .select('check_in_date')
      .eq('user_id', user.id)
      .order('check_in_date', { ascending: false })
      .limit(365)

    if (streakError || !data || data.length === 0) return 0

    let count = 0
    const today = new Date(getTodayDateString())

    for (let i = 0; i < data.length; i++) {
      const expected = new Date(today)
      expected.setDate(expected.getDate() - i)
      const expectedStr = expected.toISOString().split('T')[0]

      if (data[i].check_in_date === expectedStr) {
        count++
      } else {
        break
      }
    }

    return count
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSubmitting(true)
    setError('')

    const today = getTodayDateString()
    const payload = {
      user_id: user.id,
      check_in_date: today,
      energy_level: energyLevel,
      mood_score: moodScore,
      sleep_hours: sleepHours ? parseFloat(sleepHours) : null,
      stress_level: stressLevel,
      notes: notes || null,
    }

    let result

    if (existingCheckIn) {
      result = await supabase
        .from('check_ins')
        .update({
          energy_level: energyLevel,
          mood_score: moodScore,
          sleep_hours: sleepHours ? parseFloat(sleepHours) : null,
          stress_level: stressLevel,
          notes: notes || null,
        })
        .eq('user_id', user.id)
        .eq('check_in_date', today)
    } else {
      result = await supabase
        .from('check_ins')
        .insert(payload)
    }

    if (result.error) {
      setError(t.checkIn.errorGeneric)
      setSubmitting(false)
      return
    }

    trackEvent('checkin_submitted', {
      energy_level: energyLevel,
      mood_score: moodScore,
      stress_level: stressLevel,
    })

    const streakCount = await calculateStreak()
    setStreak(streakCount)
    setExistingCheckIn(true)
    setSuccess(true)
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-kraft-offwhite flex items-center justify-center">
        <div className="animate-pulse text-kraft-muted">...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-kraft-offwhite">
      <LanguageSwitcher />

      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-kraft-dark mb-1">{t.checkIn.title}</h1>
        <p className="text-kraft-muted mb-6">{t.checkIn.subtitle}</p>

        {existingCheckIn && !success && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-blue-800 text-sm">{t.checkIn.alreadyCheckedIn}</p>
          </div>
        )}

        {success ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h2 className="text-xl font-bold text-kraft-dark mb-2">{t.checkIn.successTitle}</h2>
            <p className="text-kraft-muted mb-4">{t.checkIn.successMessage}</p>

            {streak > 0 && (
              <div className="bg-kraft-accent/10 rounded-xl p-4 inline-block">
                <p className="text-sm text-kraft-muted">{t.checkIn.streakLabel}</p>
                <p className="text-2xl font-bold text-kraft-accent">
                  🔥 {t.checkIn.streakDays.replace('{count}', streak.toString())}
                </p>
              </div>
            )}

            <button
              onClick={() => setSuccess(false)}
              className="mt-6 block w-full text-center text-sm text-kraft-muted underline cursor-pointer"
            >
              {t.checkIn.updateButton}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Energy Level */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <label className="block text-sm font-semibold text-kraft-dark mb-1">
                {t.checkIn.energyLevel}
              </label>
              <div className="flex items-center justify-between text-xs text-kraft-muted mb-2">
                <span>{t.checkIn.energyLow} 😴</span>
                <span>⚡ {t.checkIn.energyHigh}</span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setEnergyLevel(val)}
                    className={`flex-1 py-2 rounded-lg text-center text-lg transition-all cursor-pointer ${
                      val === energyLevel
                        ? 'bg-kraft-accent text-white scale-110 shadow-md'
                        : val <= energyLevel
                          ? 'bg-kraft-accent/20'
                          : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {ENERGY_EMOJIS[val - 1]}
                  </button>
                ))}
              </div>
              <p className="text-center text-sm font-medium text-kraft-dark mt-2">{energyLevel}/10</p>
            </div>

            {/* Mood Score */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <label className="block text-sm font-semibold text-kraft-dark mb-1">
                {t.checkIn.moodScore}
              </label>
              <div className="flex items-center justify-between text-xs text-kraft-muted mb-2">
                <span>{t.checkIn.moodLow} 😞</span>
                <span>😊 {t.checkIn.moodHigh}</span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setMoodScore(val)}
                    className={`flex-1 py-2 rounded-lg text-center text-lg transition-all cursor-pointer ${
                      val === moodScore
                        ? 'bg-kraft-accent text-white scale-110 shadow-md'
                        : val <= moodScore
                          ? 'bg-kraft-accent/20'
                          : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {MOOD_EMOJIS[val - 1]}
                  </button>
                ))}
              </div>
              <p className="text-center text-sm font-medium text-kraft-dark mt-2">{moodScore}/10</p>
            </div>

            {/* Sleep Hours */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <label className="block text-sm font-semibold text-kraft-dark mb-1">
                {t.checkIn.sleepHours}
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                placeholder={t.checkIn.sleepPlaceholder}
                className="w-full border border-kraft-border rounded-xl px-4 py-3 text-kraft-dark focus:outline-none focus:ring-2 focus:ring-kraft-accent/50"
              />
            </div>

            {/* Stress Level */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <label className="block text-sm font-semibold text-kraft-dark mb-1">
                {t.checkIn.stressLevel}
              </label>
              <div className="flex items-center justify-between text-xs text-kraft-muted mb-2">
                <span>{t.checkIn.stressLow} 😌</span>
                <span>🤯 {t.checkIn.stressHigh}</span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setStressLevel(val)}
                    className={`flex-1 py-2 rounded-lg text-center text-lg transition-all cursor-pointer ${
                      val === stressLevel
                        ? 'bg-red-500 text-white scale-110 shadow-md'
                        : val <= stressLevel
                          ? 'bg-red-100'
                          : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {STRESS_EMOJIS[val - 1]}
                  </button>
                ))}
              </div>
              <p className="text-center text-sm font-medium text-kraft-dark mt-2">{stressLevel}/10</p>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <label className="block text-sm font-semibold text-kraft-dark mb-1">
                {t.checkIn.notes}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t.checkIn.notesPlaceholder}
                rows={3}
                className="w-full border border-kraft-border rounded-xl px-4 py-3 text-kraft-dark focus:outline-none focus:ring-2 focus:ring-kraft-accent/50 resize-none"
              />
            </div>

            {error && (
              <div className="bg-kraft-accent-light border border-kraft-accent rounded-xl p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-kraft-accent text-white font-semibold py-3 px-6 rounded-xl hover:bg-kraft-accent/90 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submitting
                ? t.checkIn.submitting
                : existingCheckIn
                  ? t.checkIn.updateButton
                  : t.checkIn.submit}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
