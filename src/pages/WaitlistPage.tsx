import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { trackEvent, submitLead } from '../lib/tracking'
import { resultTypes, type ResultTypeId } from '../data/quiz'

export default function WaitlistPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as {
    answers?: Record<string, string>
    resultType?: ResultTypeId
  } | null

  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [challenge, setChallenge] = useState('')
  const [consent, setConsent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const resultLabel = state?.resultType
    ? resultTypes[state.resultType]?.title
    : undefined

  useEffect(() => {
    trackEvent('waitlist_viewed', { has_quiz_result: !!state?.resultType })
  }, [state?.resultType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !consent) {
      setError('Bitte gib deine E-Mail ein und bestätige die Datenschutzerklärung.')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await submitLead({
        email,
        first_name: firstName || undefined,
        quiz_result_type: state?.resultType,
        quiz_answers: state?.answers,
        biggest_challenge: challenge || undefined,
        interest: ['community', 'challenge'],
        consent,
      })

      trackEvent('waitlist_submitted', {
        lead_id: result.id,
        quiz_type: state?.resultType,
      })

      navigate('/danke', {
        state: { firstName, resultType: state?.resultType },
      })
    } catch (err) {
      console.error('Submit error:', err)
      setError('Etwas ist schiefgelaufen. Bitte versuche es erneut.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center">
      <div className="px-6 py-12 max-w-lg mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8">
          {resultLabel && (
            <p className="text-kraft-accent font-semibold text-sm mb-2">
              Dein Typ: {resultLabel}
            </p>
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-kraft-dark mb-3">
            Sichere dir deinen Platz
          </h1>
          <p className="text-kraft-muted text-lg">
            Wir starten bald mit der ersten Challenge und Community-Phase.
            Trag dich ein und sei von Anfang an dabei.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-kraft-dark mb-1">
              Vorname <span className="text-kraft-muted">(optional)</span>
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Dein Vorname"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-kraft-accent focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-kraft-dark mb-1">
              E-Mail *
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="deine@email.de"
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-kraft-accent focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="challenge" className="block text-sm font-medium text-kraft-dark mb-1">
              Was ist gerade deine größte Herausforderung?{' '}
              <span className="text-kraft-muted">(optional)</span>
            </label>
            <textarea
              id="challenge"
              value={challenge}
              onChange={(e) => setChallenge(e.target.value)}
              placeholder="z. B. zu wenig Schlaf, kein Sport, keine Energie nach der Arbeit..."
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-kraft-accent focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Consent */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 h-4 w-4 accent-kraft-accent"
            />
            <span className="text-sm text-kraft-muted">
              Ich bin einverstanden, dass meine Daten gespeichert werden, um mich
              über den Start der Community und Challenge zu informieren. Kein Spam,
              jederzeit abmeldbar.
            </span>
          </label>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-kraft-accent hover:bg-red-600 disabled:bg-gray-300 text-white font-semibold text-lg py-4 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer"
          >
            {isSubmitting ? 'Wird eingetragen...' : 'Jetzt Platz sichern →'}
          </button>
        </form>

        <p className="text-center text-sm text-kraft-muted mt-6">
          Du bist unter den Ersten. Kein Abo, keine Kosten.
        </p>
      </div>
    </div>
  )
}
