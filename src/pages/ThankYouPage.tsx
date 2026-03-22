import { useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { trackEvent } from '../lib/tracking'
import { type ResultTypeId } from '../data/quiz'
import { useI18n } from '../i18n'
import LanguageSwitcher from '../components/LanguageSwitcher'

const WHATSAPP_GROUP_LINK = 'https://whatsapp.com/channel/0029VbCHGtX60eBgfdGLzT12'

export default function ThankYouPage() {
  const location = useLocation()
  const { t } = useI18n()
  const state = location.state as {
    firstName?: string
    resultType?: ResultTypeId
  } | null

  const name = state?.firstName
  const resultLabel = state?.resultType
    ? t.results.types[state.resultType]?.title
    : undefined

  useEffect(() => {
    trackEvent('welcome_viewed', { resultType: state?.resultType })
  }, [state?.resultType])

  const handleWhatsAppClick = () => {
    trackEvent('whatsapp_clicked', { resultType: state?.resultType })
  }

  const title = name
    ? t.welcome.titleWithName.replace('{name}', name)
    : t.welcome.title

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center">
      <LanguageSwitcher />

      <div className="px-6 py-12 max-w-lg mx-auto w-full text-center">
        <div className="text-5xl mb-6">💪</div>
        <h1 className="text-3xl md:text-4xl font-bold text-kraft-dark mb-4">
          {title}
        </h1>
        <p className="text-lg text-kraft-muted mb-8">{t.welcome.subtitle}</p>

        {resultLabel && (
          <div className="bg-gray-50 rounded-xl p-5 mb-8">
            <p className="text-sm text-kraft-muted mb-1">{t.welcome.energyType}</p>
            <p className="text-xl font-bold text-kraft-dark">{resultLabel}</p>
          </div>
        )}

        {/* WhatsApp CTA */}
        <div className="bg-kraft-dark text-white rounded-2xl p-6 md:p-8 mb-8">
          <h2 className="text-xl font-bold mb-3">{t.welcome.whatsappTitle}</h2>
          <p className="text-gray-300 mb-6">{t.welcome.whatsappText}</p>
          <a
            href={WHATSAPP_GROUP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWhatsAppClick}
            className="inline-flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white font-semibold text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            {t.welcome.whatsappButton}
          </a>
        </div>

        {/* Steps */}
        <div className="text-left bg-gray-50 rounded-2xl p-6">
          <h3 className="font-bold text-kraft-dark mb-3 text-center">{t.welcome.stepsTitle}</h3>
          <ul className="space-y-3 text-kraft-dark">
            {t.welcome.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-kraft-warm font-bold">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-kraft-muted mt-8">{t.welcome.footer}</p>
      </div>
    </div>
  )
}
