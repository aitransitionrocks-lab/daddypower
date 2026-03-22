import { useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { trackEvent } from '../lib/tracking'
import { resultTypes, type ResultTypeId } from '../data/quiz'

export default function ThankYouPage() {
  const location = useLocation()
  const state = location.state as {
    firstName?: string
    resultType?: ResultTypeId
  } | null

  const name = state?.firstName
  const resultLabel = state?.resultType
    ? resultTypes[state.resultType]?.title
    : undefined

  useEffect(() => {
    trackEvent('thankyou_viewed')
  }, [])

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center">
      <div className="px-6 py-12 max-w-lg mx-auto w-full text-center">
        <div className="text-5xl mb-6">💪</div>
        <h1 className="text-3xl md:text-4xl font-bold text-kraft-dark mb-4">
          {name ? `Stark, ${name}!` : 'Du bist drin!'}
        </h1>
        <p className="text-lg text-kraft-muted mb-6">
          Dein Platz ist gesichert. Wir melden uns, sobald es losgeht.
        </p>

        {resultLabel && (
          <div className="bg-gray-50 rounded-xl p-5 mb-6">
            <p className="text-sm text-kraft-muted mb-1">Dein Energie-Typ</p>
            <p className="text-xl font-bold text-kraft-dark">{resultLabel}</p>
          </div>
        )}

        <div className="bg-kraft-dark text-white rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-3">Was passiert jetzt?</h2>
          <ul className="text-left space-y-3 text-gray-300">
            <li className="flex items-start gap-3">
              <span className="text-kraft-warm font-bold">1.</span>
              <span>Du bekommst eine kurze Bestätigung per Mail.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-kraft-warm font-bold">2.</span>
              <span>
                Wir informieren dich, sobald die erste Challenge startet.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-kraft-warm font-bold">3.</span>
              <span>
                Du bist unter den Ersten in der Community – mit Vorteilen für
                Early Members.
              </span>
            </li>
          </ul>
        </div>

        <p className="text-sm text-kraft-muted mt-8">
          Fragen? Schreib uns jederzeit. Wir sind echte Menschen, kein Bot.
        </p>
      </div>
    </div>
  )
}
