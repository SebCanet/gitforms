import { useState, useEffect } from 'react'
import { type Locale, getTranslations } from './translations'

export function useLanguage() {
  const [locale, setLocale] = useState<Locale>('en')

  useEffect(() => {
    // 1. Check for manually configured default locale
    const configuredLocale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE as Locale
    if (configuredLocale && (configuredLocale === 'fr' || configuredLocale === 'en')) {
      setLocale(configuredLocale)
      return
    }

    // 2. Auto-detect browser language
    const browserLang = navigator.language.toLowerCase()

    if (browserLang.startsWith('fr')) {
      setLocale('fr')
    } else if (browserLang.startsWith('en')) {
      setLocale('en')
    } else {
      setLocale('en')
    }
  }, [])

  const t = getTranslations(locale)

  return { locale, t }
}
