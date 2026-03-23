import { useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useMemo, useRef } from 'react'
import { calculateResult } from '../data/quiz'
import { trackEvent, submitLead } from '../lib/tracking'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useI18n } from '../i18n'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function ResultPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const formRef = useRef<HTMLDivElement>(null)
  const { lang, t } = useI18n()
  const answers = (location.state as { answers?: Record<string, string> })?.answers

  // Form State
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Video aus DB
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoType, setVideoType] = useState<string>('upload')

  useEffect(() => {
    if (!answers) {
      navigate('/')
    }
  }, [answers, navigate])

  const resultTypeId = useMemo(
    () => (answers ? calculateResult(answers) : null),
    [answers]
  )

  const resultText = resultTypeId ? t.results.types[resultTypeId] : null

  // Video laden aus Supabase
  useEffect(() => {
    if (!resultTypeId || !isSupabaseConfigured()) return

    supabase
      .from('content_assets')
      .select('url, metadata')
      .eq('asset_type', 'video')
      .eq('result_type', resultTypeId)
      .eq('language', lang)
      .eq('is_public', true)
      .single()
      .then(({ data }) => {
        if (data) {
          setVideoUrl(data.url)
          // YouTube-URL erkennen
          const isYt = data.url?.includes('youtube') || data.url?.includes('youtu.be')
          setVideoType(isYt ? 'youtube' : 'upload')
        } else {
          setVideoUrl(null)
        }
      })
  }, [resultTypeId, lang])

  useEffect(() => {
    if (resultTypeId) {
      trackEvent('result_assigned', { type: resultTypeId, lang })
    }
  }, [resultTypeId, lang])

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !consent) {
      setError(t.results.errorRequired)
      return
    }

    setIsSubmitting(true)

    try {
      const res = await submitLead({
        email,
        first_name: firstName || undefined,
        result_type: resultTypeId || undefined,
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
      setError(t.results.errorGeneric)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!resultText || !answers || !resultTypeId) return null

  // Video rendern
  const renderVideo = () => {
    if (videoUrl && videoType === 'youtube') {
      // YouTube embed: videoUrl kann eine Video-ID oder volle URL sein
      const videoId = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')
        ? videoUrl.split('v=')[1]?.split('&')[0] || videoUrl.split('/').pop()
        : videoUrl
      return (
        <div className="relative w-full rounded-2xl overflow-hidden shadow-lg" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?rel=0`}
            title={`Video: ${resultText.title}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )
    }

    if (videoUrl && videoType === 'upload') {
      return (
        <video
          controls
          className="w-full rounded-2xl shadow-lg"
          preload="metadata"
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      )
    }

    return (
      <div className="w-full rounded-2xl bg-gray-100 flex items-center justify-center py-16">
        <div className="text-center">
          <div className="text-4xl mb-3">🎬</div>
          <p className="text-kraft-muted">{t.results.videoPlaceholder}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <LanguageSwitcher />

      {/* Result Header */}
      <section className="px-6 pt-16 pb-6 text-center max-w-2xl mx-auto">
        <p className="text-kraft-accent font-semibold text-sm uppercase tracking-wider mb-3">
          {t.results.badge}
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-kraft-dark mb-3">
          {resultText.title}
        </h1>
        <p className="text-xl text-kraft-muted">{resultText.subtitle}</p>
      </section>

      {/* Video */}
      <section className="px-6 pb-8 max-w-2xl mx-auto">
        {renderVideo()}
      </section>

      {/* Description */}
      <section className="px-6 pb-6 max-w-2xl mx-auto">
        <div className="bg-gray-50 rounded-2xl p-6 md:p-8">
          <p className="text-kraft-dark text-lg leading-relaxed">
            {resultText.description}
          </p>
        </div>
      </section>

      {/* Strengths & Risks */}
      <section className="px-6 pb-6 max-w-2xl mx-auto">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-xl p-5">
            <h3 className="font-bold text-kraft-dark mb-3">{t.results.strengthsTitle}</h3>
            <ul className="space-y-2">
              {resultText.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-kraft-dark">
                  <span className="text-green-600 mt-0.5">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-kraft-accent-light rounded-xl p-5">
            <h3 className="font-bold text-kraft-dark mb-3">{t.results.risksTitle}</h3>
            <ul className="space-y-2">
              {resultText.risks.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-kraft-dark">
                  <span className="text-kraft-accent mt-0.5">!</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Next Step + CTA */}
      <section className="px-6 pb-8 max-w-2xl mx-auto">
        <div className="bg-kraft-dark text-white rounded-2xl p-6 md:p-8 text-center">
          <p className="text-lg leading-relaxed mb-6">{resultText.nextStep}</p>
          <button
            onClick={scrollToForm}
            className="bg-kraft-accent hover:bg-amber-700 text-white font-semibold text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer"
          >
            {t.results.ctaCommunity}
          </button>
        </div>
      </section>

      {/* Formular */}
      <section ref={formRef} className="px-6 pb-16 max-w-lg mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-kraft-dark mb-2">
            {t.results.formTitle}
          </h2>
          <p className="text-kraft-muted">{t.results.formText}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-kraft-dark mb-1">
              {t.results.labelFirstName} <span className="text-kraft-muted">{t.results.optional}</span>
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder={t.results.placeholderName}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-kraft-accent focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-kraft-dark mb-1">
              {t.results.labelEmail} *
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.results.placeholderEmail}
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
            <span className="text-sm text-kraft-muted">{t.results.consent}</span>
          </label>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-kraft-accent hover:bg-amber-700 disabled:bg-gray-300 text-white font-semibold text-lg py-4 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer"
          >
            {isSubmitting ? t.results.submitting : t.results.submit}
          </button>

          <p className="text-center text-xs text-kraft-muted">{t.results.note}</p>
        </form>
      </section>
    </div>
  )
}
