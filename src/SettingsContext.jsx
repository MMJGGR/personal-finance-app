// src/SettingsContext.jsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import storage from './utils/storage'
import { useProfile } from './ProfileContext'

const DEFAULT_CURRENCY_MAP = {
  Kenyan: 'KES',
  American: 'USD',
  French: 'EUR'
}

function safeParse(str, fallback) {
  try {
    return JSON.parse(str)
  } catch {
    return fallback
  }
}

const SettingsContext = createContext()

export function SettingsProvider({ children }) {
  const { profile } = useProfile()

  const [settings, setSettings] = useState(() => {
    const s = storage.get('settings')
    const incomeStartYearFromStorage = storage.get('incomeStartYear')
    const defaults = {
      startYear: incomeStartYearFromStorage ? Number(incomeStartYearFromStorage) : new Date().getFullYear(),
      projectionYears: (profile?.lifeExpectancy ?? 85) - (profile?.age ?? 30),
      chartView: 'nominal',
      discountRate: 0,
      inflationRate: 5,
      expectedReturn: 8,
      currency: '',
      locale: 'en-KE',
      apiEndpoint: '',
      discretionaryCutThreshold: 0,
      survivalThresholdMonths: 0,
      bufferPct: 0,
      retirementAge: 65,
      riskCapacityScore: 0,
      riskWillingnessScore: 0,
      liquidityBucketDays: 0,
      taxBrackets: [],
      nssfRates: { employee: 0.06, employer: 0.06 },
      nssfCaps: { employee: 1080, employer: 1080 },
      pensionContributionReliefPct: 0,
    }
    const loaded = s ? { ...defaults, ...safeParse(s, {}) } : defaults
    if (!loaded.currency) {
      const nat = profile.nationality
      loaded.currency = DEFAULT_CURRENCY_MAP[nat] || 'KES'
    }
    return loaded
  })

  const updateSettings = useCallback(updated => {
    setSettings(prevSettings => {
      if (JSON.stringify(updated) !== JSON.stringify(prevSettings)) {
        storage.set('settings', JSON.stringify(updated))
        return updated
      }
      return prevSettings
    })
  }, [])

  // Derive default currency when none chosen
  useEffect(() => {
    if (!settings.currency) {
      const cur = DEFAULT_CURRENCY_MAP[profile.nationality] || 'KES'
      if (settings.currency !== cur) {
        updateSettings({ ...settings, currency: cur })
      }
    }
  }, [profile.nationality, settings.currency, updateSettings])

  // Auto-load persisted state on mount
  useEffect(() => {
    const sSet = storage.get('settings')
    if (sSet) {
      const parsed = safeParse(sSet, null)
      if (parsed) {
        setSettings({
          discretionaryCutThreshold: 0,
          survivalThresholdMonths: 0,
          bufferPct: 0,
          retirementAge: 65,
          ...parsed,
        })
      }
    }
    const sSY = storage.get('incomeStartYear')
    if (sSY) setSettings(prevSettings => ({ ...prevSettings, startYear: +sSY }));
  }, [])

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSettings,
    }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => useContext(SettingsContext)
