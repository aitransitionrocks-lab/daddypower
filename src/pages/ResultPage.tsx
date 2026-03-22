import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useMemo } from 'react'
import { calculateResult, resultTypes } from '../data/quiz'
import { trackEvent } from '../lib/tracking'

export default function ResultPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const answers = (location.state as { answers?: Record<string, string> })?.answers

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

  if (!result || !answers) return null

  return (
    <div className="min-h-screen bg-white">
      {/* Result Header */}
      <section className="px-6 pt-16 pb-8 text-center max-w-2xl mx-auto">
        <p className="text-kraft-accent font-semibold text-sm uppercase tracking-wider mb-3">
          Dein Ergebnis
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-kraft-dark mb-3">
          {result.title}
        </h1>
        <p className="text-xl text-kraft-muted">{result.subtitle}</p>
      </section>

      {/* Description */}
      <section className="px-6 pb-8 max-w-2xl mx-auto">
        <div className="bg-gray-50 rounded-2xl p-6 md:p-8">
          <p className="text-kraft-dark text-lg leading-relaxed">
            {result.description}
          </p>
        </div>
      </section>

      {/* Strengths & Risks */}
      <section className="px-6 pb-8 max-w-2xl mx-auto">
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

      {/* Next Step */}
      <section className="px-6 pb-8 max-w-2xl mx-auto">
        <div className="bg-kraft-dark text-white rounded-2xl p-6 md:p-8 text-center">
          <p className="text-lg leading-relaxed mb-6">{result.nextStep}</p>
          <button
            onClick={() => {
              trackEvent('waitlist_cta_clicked', { source: 'result', type: result.id })
              navigate('/warteliste', {
                state: { answers, resultType: result.id },
              })
            }}
            className="bg-kraft-accent hover:bg-red-600 text-white font-semibold text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer"
          >
            Platz in der Community sichern →
          </button>
          <p className="text-sm text-gray-400 mt-4">
            Kostenlos. Kein Abo. Du bekommst als Erster Zugang.
          </p>
        </div>
      </section>
    </div>
  )
}
