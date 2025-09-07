import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from '../locales/en/common.json'
import th from '../locales/th/common.json'
import zh from '../locales/zh/common.json'

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: en },
      th: { common: th },
      zh: { common: zh },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'th', 'zh'],
    defaultNS: 'common',
    ns: ['common'],
    interpolation: { escapeValue: false },
    detection: {
      // order of detection
      order: ['querystring', 'localStorage', 'navigator', 'htmlTag'],
      lookupQuerystring: 'lng',
      caches: ['localStorage'],
    },
  })

export default i18n
