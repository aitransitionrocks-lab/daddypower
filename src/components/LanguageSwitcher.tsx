import { useI18n } from '../i18n'

export default function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n()

  return (
    <button
      onClick={() => setLang(lang === 'de' ? 'en' : 'de')}
      className="fixed top-4 right-4 z-50 bg-white border border-gray-200 text-kraft-dark font-semibold text-sm px-3 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
      aria-label="Switch language"
    >
      {t.langSwitch}
    </button>
  )
}
