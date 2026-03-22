import { useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useMemo, useRef } from 'react'
import { calculateResult, resultTypes } from '../data/quiz'
import { trackEvent, submitLead } from '../lib/tracking'

export default function ResultPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const formRef = useRef<HTMLDivElement>(null)
  const answers = (location.state as { answers?: Record<string, string> })?.answers

  // Form State
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Falls jemand direkt auf /ergebnis navigiert ohne Quiz
  useEffect(() => {
    if (!answers) {
      navigate('/')
    }
  }, [answers, navigate])

  const resultTypeId = useMemo(
    () => (answers ? calculateResult(answers) : null),
    [answers]
  )

  const result = resultTypeId ? resultTypes[resultTypeId] : null

  useEffect(() => {
    if (result) {
      trackEvent('result_assigned', { type: result.id })
    }
  }, [result])

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !consent) {
      setError('Bitte gib deine E-Mail ein und bestätige die Datenschutzerklärung.')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await submitLead({
        email,
        first_name: firstName || undefined,
        quiz_result_type: resultTypeId || undefined,
        quiz_answers: answers,
        interest: ['community', 'challenge'],
        consent,
      })

      trackEvent('waitlist_submitted', {
        lead_id: res.id,
        quiz_type: resultTypeId,
      })

      navigate('/willkommen', {
        state: { firstName, resultType: resultTypeId },
      })
    } catch (err) {
      console.error('Submit error:', err)
      setError('Etwas ist schiefgelaufen. Bitte versuche es erneut.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!result || !answers) return null

  const hasVideo = result.videoId && !result.videoId.startsWith('PLATZHALTER')

  return (
    <div className="min-h-screen bg-white">
      {/* Result Header */}
      <section className="px-6 pt-16 pb-6 text-center max-w-2xl mx-auto">
        <p className="text-kraft-accent font-semibold text-sm uppercase tracking-wider mb-3">
          Dein Ergebnis
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-kraft-dark mb-3">
          {result.title}
        </h1>
        <p className="text-xl text-kraft-muted">{result.subtitle}</p>
      </section>

      {/* Video */}
      <section className="px-6 pb-8 max-w-2xl mx-auto">
        {hasVideo ? (
          <div className="relative w-full rounded-2xl overflow-hidden shadow-lg" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src={`https://www.youtube.com/embed/${result.videoId}?rel=0`}
              title={`Video: ${result.title}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="w-full rounded-2xl bg-gray-100 flex items-center justify-center py-16">
            <div className="text-center">
              <div className="text-4xl mb-3">🎬</div>
              <p className="text-kraft-muted">Video kommt bald – speziell für deinen Typ.</p>
            </div>
          </div>
        )}
      </section>

      {/* Description */}
      <section className="px-6 pb-6 max-w-2xl mx-auto">
        <div className="bg-gray-50 rounded-2xl p-6 md:p-8">
          <p className="text-kraft-dark text-lg leading-relaxed">
            {result.description}
          </p>
        </div>
      </section>

      {/* Strengths & Risks */}
      <section className="px-6 pb-6 max-w-2xl mx-auto">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-xl p-5">
            <h3 className="font-bold text-kraft-dark mb-3">Deine Stärken</h3>
            <ul className="space-y-2">
              {result.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-kraft-dark">
                  <span className="text-green-600 mt-0.5">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-red-50 rounded-xl p-5">
            <h3 className="font-bold text-kraft-dark mb-3">Deine Risiken</h3>
            <ul className="space-y-2">
              {result.risks.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-kraft-dark">
                  <span className="text-kraft-accent mt-0.5">!</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Next Step + CTA to Form */}
      <section className="px-6 pb-8 max-w-2xl mx-auto">
        <div className="bg-kraft-dark text-white rounded-2xl p-6 md:p-8 text-center">
          <p className="text-lg leading-relaxed mb-6">{result.nextStep}</p>
          <button
            onClick={scrollToForm}
            className="bg-kraft-accent hover:bg-red-600 text-white font-semibold text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer"
          >
            Jetzt Community beitreten →
          </button>
        </div>
      </section>

      {/* Integriertes Kurzformular */}
      <section ref={formRef} className="px-6 pb-16 max-w-lg mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-kraft-dark mb-2">
            Dein Platz in der Community
          </h2>
          <p className="text-kraft-muted">
            Trag dich ein – du bekommst sofort Zugang zu unserer WhatsApp-Gruppe
            und bist von Anfang an dabei, wenn die erste Challenge startet.
          </p>
        </div>

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
            {isSubmitting ? 'Wird eingetragen...' : 'Eintragen & Community beitreten →'}
          </button>

          <p className="text-center text-xs text-kraft-muted">
            Kostenlos. Kein Abo. Kein Spam.
          </p>
        </form>
      </section>
    </div>
  )
}
