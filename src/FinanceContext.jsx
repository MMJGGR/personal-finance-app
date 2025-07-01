// src/FinanceContext.jsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react'
import { usePersona } from './PersonaContext.jsx'
import { useProfile } from './ProfileContext.jsx'
import { useSettings } from './SettingsContext.jsx'
import { calculatePV, frequencyToPayments, calculateNSSF, calculatePAYE } from './utils/financeUtils'
import {
  selectAnnualIncome,
  selectAnnualIncomePV,
  selectAnnualOutflow,
  selectDiscountedNet,
  selectCumulativePV
} from './selectors'
import { deriveStrategy } from './utils/strategyUtils'
import { getStreamEndYear } from './utils/incomeProjection'
import { projectPensionGrowth } from './utils/pensionProjection.js'
import storage from './utils/storage'
import { defaultIncomeSources } from './components/Income/defaults.js'

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

const FinanceContext = createContext()

export function FinanceProvider({ children }) {
  const { currentData, currentPersonaId } = usePersona()
  useEffect(() => {
    storage.setPersona(currentPersonaId)
  }, [currentPersonaId])
  // === Core financial state ===
  const [discountRate, setDiscountRate]     = useState(0)
  const [years, setYears] = useState(55);
  const [monthlyExpense, setMonthlyExpense] = useState(() => {
    const s = storage.get('monthlyExpense')
    return s ? parseFloat(s) : 0
  })

  
