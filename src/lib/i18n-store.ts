
"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { translations, type Language } from './translations'

interface I18nState {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: keyof typeof translations['en']) => string
}

export const useI18n = create<I18nState>()(
  persist(
    (set, get) => ({
      language: 'en',
      setLanguage: (lang) => set({ language: lang }),
      t: (key) => {
        const lang = get().language
        return translations[lang][key] || translations['en'][key]
      }
    }),
    {
      name: 'studynest-i18n'
    }
  )
)
