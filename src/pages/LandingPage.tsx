import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { trackEvent } from '../lib/tracking'
import { useI18n } from '../i18n'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function LandingPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const l = t.landing

  useEffect(() => {
    trackEvent('page_view', { page: 'landing' })
  }, [])

  const startQuiz = () => {
    trackEvent('quiz_cta_clicked', { source: 'landing' })
    navigate('/quiz')
  }

  return (
    <div className="min-h-screen bg-white">
      <LanguageSwitcher />

      {/* Hero */}
      <section className="px-6 pt-16 pb-12 md:pt-24 md:pb-16 text-center max-w-3xl mx-auto">
        <p className="text-kraft-accent font-semibold text-sm uppercase tracking-wider mb-4">
          {l.badge}
        </p>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-kraft-dark leading-tight mb-6">
          {l.headline}
          <br />
          <span className="text-kraft-accent">{l.headlineAccent}</span>
        </h1>
        <p className="text-lg md:text-xl text-kraft-muted max-w-2xl mx-auto mb-8">
          {l.subheadline}
        </p>
        <button
          onClick={startQuiz}
          className="bg-kraft-accent hover:bg-red-600 text-white font-semibold text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer"
        >
          {l.ctaPrimary}
        </button>
      </section>

      {/* Problem Mirroring */}
      <section className="bg-gray-50 px-6 py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-kraft-dark text-center mb-10">
            {l.problemTitle}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {l.problems.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-white rounded-lg p-4 shadow-sm"
              >
                <span className="text-kraft-accent text-xl mt-0.5">✗</span>
                <p className="text-kraft-dark">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Identifikation */}
      <section className="px-6 py-12 md:py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-kraft-dark mb-6">
            {l.identTitle}
          </h2>
          <p className="text-kraft-muted text-lg mb-4">{l.identText1}</p>
          <p className="text-kraft-dark text-lg font-medium">{l.identText2}</p>
        </div>
      </section>

      {/* Vertrauensblock */}
      <section className="bg-kraft-dark text-white px-6 py-12 md:py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">{l.trustTitle}</h2>
          <p className="text-gray-300 text-lg mb-4">{l.trustText}</p>
          <p className="text-kraft-warm font-semibold text-lg">{l.trustHighlight}</p>
        </div>
      </section>

      {/* Quiz Einführung + CTA */}
      <section className="px-6 py-12 md:py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-kraft-dark mb-4">
            {l.quizIntroTitle}
          </h2>
          <p className="text-kraft-muted text-lg mb-3">{l.quizIntroSub}</p>
          <p className="text-kraft-muted mb-8">{l.quizIntroText}</p>
          <button
            onClick={startQuiz}
            className="bg-kraft-accent hover:bg-red-600 text-white font-semibold text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer"
          >
            {l.ctaSecondary}
          </button>
          <p className="text-sm text-kraft-muted mt-4">{l.ctaNote}</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-gray-100 text-center">
        <p className="text-sm text-kraft-muted">{t.footer}</p>
      </footer>
    </div>
  )
}
