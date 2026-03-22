import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { de } from './de'
import { en } from './en'
import type { Translations } from './types'

export type Language = 'de' | 'en'

interface I18nContextType {
  lang: Language
  setLang: (lang: Language) => void
  t: Translations
}

const translations: Record<Language, Translations> = { de, en }

const I18nContext = createContext<I18nContextType>({
  lang: 'de',
  setLang: () => {},
  t: de,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('dp_lang') as Language
    if (saved === 'de' || saved === 'en') return saved
    // Browser-Sprache prüfen
    const browserLang = navigator.language.slice(0, 2)
    return browserLang === 'de' ? 'de' : 'en'
  })

  const setLang = (newLang: Language) => {
    setLangState(newLang)
    localStorage.setItem('dp_lang', newLang)
  }

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return (
    <I18nContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </I18nContext.Provider>
  )
}

export const useI18n = () => useContext(I18nContext)
