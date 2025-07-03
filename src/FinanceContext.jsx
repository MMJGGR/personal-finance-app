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
import { calculatePV, frequencyToPayments, calculateNSSF, calculatePAYE } from './utils/financeUtils'
import {
  selectAnnualIncome,
  selectAnnualIncomePV,
  selectAnnualOutflow,
  selectDiscountedNet,
  selectCumulativePV
} from './selectors'
import { calculateRiskScore, deriveCategory } from './utils/riskUtils'
import { deriveStrategy } from './utils/strategyUtils'
import { getStreamEndYear } from './utils/incomeProjection'
import { projectPensionGrowth } from './utils/pensionProjection.js'
import storage from './utils/storage'
import hadiSeed from './data/hadiSeed.json'
import { defaultIncomeSources } from './components/Income/defaults.js'
import { readVersions } from './utils/versionHistory'
import {
  readEvents,
  addEvent as storeAddEvent,
  updateEvent as storeUpdateEvent,
  removeEvent as storeRemoveEvent,
} from './utils/eventTimeline'

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

const defaultProfile = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  country: '',
  taxCountry: '',
  taxId: '',
  employmentStatus: '',
  employerName: '',
  birthDate: '',
  age: 30,
  maritalStatus: '', // FIXME: unused - pending integration
  numDependents: 0, // FIXME: unused - pending integration
  residentialAddress: '', // FIXME: unused - pending integration
  nationality: '', // FIXME: unused - pending integration
  education: '', // FIXME: unused - pending integration
  location: '', // FIXME: unused - pending integration
  citizenship: '', // FIXME: unused - pending integration
  taxJurisdiction: '', // FIXME: unused - pending integration
  idNumber: '', // FIXME: unused - pending integration
  taxResidence: '', // FIXME: unused - pending integration
  annualIncome: 0,
  netWorth: 0,
  liquidNetWorth: 0,
  sourceOfFunds: '', // FIXME: unused - pending integration
  behaviouralProfile: {}, // FIXME: unused - pending integration
  financialChallenge: '', // FIXME: unused - pending integration
  investmentKnowledge: '',
  lossResponse: '',
  investmentHorizon: '',
  investmentGoal: '',
  lifeExpectancy: 85,
  riskSurveyAnswers: Array(10).fill(0),
  riskScore: 0,
  riskCategory: '',
}

function mapPersonaProfile(seed = {}) {
  const out = { ...defaultProfile, ...seed }
  if (seed.name && !seed.firstName && !seed.lastName) {
    const parts = String(seed.name).split(' ')
    out.firstName = parts.shift() || ''
    out.lastName = parts.join(' ')
  }
  if (seed.residentialAddress && !seed.address) {
    out.address = seed.residentialAddress
    const segments = seed.residentialAddress.split(',').map(s => s.trim())
    if (!seed.city && segments.length > 1) out.city = segments[0]
    if (!seed.country && segments.length > 1) out.country = segments[1]
  }
  if (seed.nationality && !seed.country) {
    out.country = seed.nationality
  }
  if (seed.taxResidence && !seed.taxCountry) {
    out.taxCountry = seed.taxResidence
  }
  if (seed.birthDate && typeof seed.age !== 'number') {
    const dob = new Date(seed.birthDate)
    const diff = Date.now() - dob.getTime()
    const ageDt = new Date(diff)
    out.age = Math.abs(ageDt.getUTCFullYear() - 1970)
  }
  if (typeof seed.netWorth === 'number' && typeof seed.liquidNetWorth !== 'number') {
    out.liquidNetWorth = seed.netWorth
  }
  if (Array.isArray(seed.riskSurveyAnswers)) {
    out.riskSurveyAnswers = [...seed.riskSurveyAnswers]
  } else if (Array.isArray(seed.riskSurvey)) {
    out.riskSurveyAnswers = [...seed.riskSurvey]
  } else if (typeof seed.riskScore === 'number') {
    // approximate evenly distributed responses if only total provided
    const avg = Math.round(seed.riskScore / 10)
    out.riskSurveyAnswers = Array(10).fill(avg)
  }
  if (typeof seed.riskScore === 'number') {
    out.riskScore = seed.riskScore
  }
  if (typeof seed.riskCategory === 'string') {
    out.riskCategory = seed.riskCategory
  } else if (typeof out.riskScore === 'number') {
    out.riskCategory = deriveCategory(out.riskScore)
  }
  return out
}

const FinanceContext = createContext()

export function FinanceProvider({ children }) {
  const { currentData, currentPersonaId } = usePersona()
  // ensure persona prefix is set before any storage reads
  storage.setPersona(currentPersonaId)
  useEffect(() => {
    storage.setPersona(currentPersonaId)
    setEvents(readEvents(storage))
  }, [currentPersonaId])
  // === Core financial state ===
  const [discountRate, setDiscountRate]     = useState(0)
  const [years, setYears] = useState(() => {
    try {
      const s = storage.get('settings')
      if (s) {
        const parsed = JSON.parse(s)
        if (typeof parsed.projectionYears === 'number') {
          return parsed.projectionYears
        }
      }
    } catch { /* ignore parse error */ }
    try {
      const pStr = storage.get('profile')
      if (pStr) {
        const p = JSON.parse(pStr)
        if (typeof p.lifeExpectancy === 'number' && typeof p.age === 'number') {
          return Math.max(1, p.lifeExpectancy - p.age)
        }
      }
    } catch { /* ignore parse error */ }
    return 85 - 30
  })
  const [monthlyExpense, setMonthlyExpense] = useState(() => {
    const s = storage.get('monthlyExpense')
    return s ? parseFloat(s) : 0
  })
  const [incomePV, setIncomePV]             = useState(0)
  const [expensesPV, setExpensesPV]         = useState(0)
  const [goalsPV, setGoalsPV]               = useState(() => {
    const s = storage.get('goalsPV')
    return s ? parseFloat(s) : 0
  })
  const [pvExpenses, setPvExpenses]         = useState(0)
  const [monthlyPVExpense, setMonthlyPVExpense] = useState(0)
  const [monthlySurplusNominal, setMonthlySurplusNominal] = useState(() => {
    const s = storage.get('monthlySurplusNominal')
    return s ? parseFloat(s) : 0
  })
  const [monthlyIncomeNominal, setMonthlyIncomeNominal] = useState(() => {
    const s = storage.get('monthlyIncomeNominal')
    return s ? parseFloat(s) : 0
  })

  const [pvHigh, setPvHigh] = useState(() => {
    const s = storage.get('pvHigh')
    return s ? parseFloat(s) : 0
  })
  const [pvMedium, setPvMedium] = useState(() => {
    const s = storage.get('pvMedium')
    return s ? parseFloat(s) : 0
  })
  const [pvLow, setPvLow] = useState(() => {
    const s = storage.get('pvLow')
    return s ? parseFloat(s) : 0
  })
  const [monthlyPVHigh, setMonthlyPVHigh] = useState(() => {
    const s = storage.get('monthlyPVHigh')
    return s ? parseFloat(s) : 0
  })
  const [monthlyPVMedium, setMonthlyPVMedium] = useState(() => {
    const s = storage.get('monthlyPVMedium')
    return s ? parseFloat(s) : 0
  })
  const [monthlyPVLow, setMonthlyPVLow] = useState(() => {
    const s = storage.get('monthlyPVLow')
    return s ? parseFloat(s) : 0
  })

  const [includeMediumPV, setIncludeMediumPV] = useState(() => {
    const s = storage.get('includeMediumPV')
    return s ? safeParse(s, true) : true
  })
  const [includeLowPV, setIncludeLowPV] = useState(() => {
    const s = storage.get('includeLowPV')
    return s ? safeParse(s, true) : true
  })
  const [includeGoalsPV, setIncludeGoalsPV] = useState(() => {
    const s = storage.get('includeGoalsPV')
    return s ? safeParse(s, false) : false
  })
  const [includeLiabilitiesNPV, setIncludeLiabilitiesNPV] = useState(() => {
    const s = storage.get('includeLiabilitiesNPV')
    return s ? safeParse(s, false) : false
  })

  // === Derived balance sheet metrics ===
  const [netWorth, setNetWorth] = useState(() => {
    const s = storage.get('netWorth')
    return s ? parseFloat(s) : 0
  })
  const [debtToAssetRatio, setDebtToAssetRatio] = useState(() => {
    const s = storage.get('debtToAssetRatio')
    return s ? parseFloat(s) : 0
  })
  const [humanCapitalShare, setHumanCapitalShare] = useState(() => {
    const s = storage.get('humanCapitalShare')
    return s ? parseFloat(s) : 0
  })

  // === IncomeTab state ===
  const [incomeSources, setIncomeSources] = useState(() => {
    const s = storage.get('incomeSources')
    const now = new Date().getFullYear()
    const defaults = defaultIncomeSources(now)
    if (s) {
      try {
        const parsed = JSON.parse(s)
        const migrated = parsed.map(src => ({
          id: src.id || crypto.randomUUID(),
          startYear: src.startYear ?? now,
          startAge: src.startAge ?? null,
          endYear: src.endYear ?? null,
          linkedAssetId: src.linkedAssetId ?? '',
          active: src.active !== false,
          taxed: src.taxed ?? true,
          ...src,
        }))
        storage.set('incomeSources', JSON.stringify(migrated))
        return migrated
      } catch {
        // ignore malformed stored data
      }
    }
    return defaults
  })
  const [privatePensionContributions, setPrivatePensionContributions] = useState(() => {
    const s = storage.get('privatePensionContributions')
    if (s) {
      try {
        const parsed = JSON.parse(s)
        return parsed.map(ppc => ({ id: ppc.id || crypto.randomUUID(), ...ppc }))
      } catch {
        // ignore malformed stored data
      }
    }
    return []
  })
  

  // === Expenses & Goals state ===
  const [expensesList, setExpensesList] = useState(() => {
    const s = storage.get('expensesList')
    const now = new Date().getFullYear()
    if (!s) return []
    try {
      const parsed = JSON.parse(s)
      const migrated = parsed.map(exp => {
        let paymentsPerYear = exp.paymentsPerYear
        if (typeof paymentsPerYear !== 'number') {
          paymentsPerYear = frequencyToPayments(exp.frequency) || 1
        }
        return {
          id: exp.id || crypto.randomUUID(),
          startYear: exp.startYear ?? now,
          endYear: exp.endYear ?? null,
          include: exp.include !== false,
          monthDue: exp.monthDue ?? 1,
          ...exp,
          paymentsPerYear,
          priority: exp.priority ?? 2,
        }
      })
      storage.set('expensesList', JSON.stringify(migrated))
      return migrated
    } catch {
      // ignore malformed stored data
      return []
    }
  })
  const [goalsList, setGoalsList] = useState(() => {
    const s = storage.get('goalsList')
    const now = new Date().getFullYear()
    if (!s) return []
    try {
      const parsed = JSON.parse(s)
      const migrated = parsed.map(g => ({
        id: g.id || crypto.randomUUID(),
        startYear: g.startYear ?? g.targetYear ?? now,
        endYear: g.endYear ?? g.targetYear ?? now,
        type: g.type ?? '',
        daysCover: g.daysCover ?? 0,
        ...g,
      }))
      storage.set('goalsList', JSON.stringify(migrated))
      return migrated
    } catch {
      return []
    }
  })

  const [investmentContributions, setInvestmentContributions] = useState(() => {
    const s = storage.get('investmentContributions')
    const now = new Date().getFullYear()
    if (s) {
      try {
        const parsed = JSON.parse(s)
        return parsed.map(i => ({ id: i.id || crypto.randomUUID(), ...i }))
      } catch {
        // ignore malformed stored data
      }
    }
    return [
      {
        id: crypto.randomUUID(),
        name: 'ETF Savings',
        amount: 500,
        frequency: 12,
        growth: 0,
        startYear: now,
        endYear: now + 4,
      },
    ]
  })

  const [pensionStreams, setPensionStreams] = useState(() => {
    const s = storage.get('pensionStreams')
    const now = new Date().getFullYear()
    if (s) {
      try {
        const parsed = JSON.parse(s)
        return parsed.map(p => ({ id: p.id || crypto.randomUUID(), ...p }))
      } catch {
        // ignore malformed stored data
      }
    }
    return [
      {
        id: crypto.randomUUID(),
        name: 'Pension',
        amount: 20000,
        frequency: 12,
        growth: 0,
        startYear: now + 30,
        endYear: now + 50,
      },
    ]
  })

  // === Balance Sheet assets state ===
  const [assetsList, setAssetsList] = useState(() => {
    const s = storage.get('assetsList')
    if (s) {
      try {
        const parsed = JSON.parse(s)
        return parsed.map(a => ({
          id: a.id || crypto.randomUUID(),
          type: a.type || '',
          expectedReturn: a.expectedReturn ?? 0,
          volatility: a.volatility ?? 0,
          horizonYears: a.horizonYears ?? 0,
          purchaseYear: a.purchaseYear ?? new Date().getFullYear(),
          saleYear: a.saleYear ?? null,
          principal: a.principal ?? (a.amount || 0),
          ...a,
        }))
      } catch {
        // ignore malformed stored data
      }
    }
    return [
      {
        id: crypto.randomUUID(),
        name: 'Cash',
        amount: 500000,
        type: 'Cash',
        expectedReturn: 2,
        volatility: 1,
        horizonYears: 0,
        purchaseYear: new Date().getFullYear(),
        saleYear: null,
        principal: 500000,
      },
      {
        id: crypto.randomUUID(),
        name: 'Investments',
        amount: 1000000,
        type: 'Portfolio',
        expectedReturn: 8,
        volatility: 15,
        horizonYears: 5,
        purchaseYear: new Date().getFullYear(),
        saleYear: null,
        principal: 1000000,
      },
      {
        id: 'pv-income',
        name: 'PV of Lifetime Income',
        amount: 0,
        type: 'Income',
        expectedReturn: 0,
        volatility: 0,
        horizonYears: 0,
        purchaseYear: new Date().getFullYear(),
        saleYear: null,
        principal: 0,
      },
    ]
  })

  // === Liabilities (Loans) state ===
  const [liabilitiesList, setLiabilitiesList] = useState(() => {
    const s = storage.get('liabilitiesList')
    if (s) {
      try {
        const parsed = JSON.parse(s)
        return parsed.map(l => ({
          id: l.id || crypto.randomUUID(),
          name: l.name || '',
          principal: l.principal ?? 0,
          interestRate: l.interestRate ?? 0,
          termYears: l.termYears ?? 1,
          paymentsPerYear: l.paymentsPerYear ?? 12,
          extraPayment: l.extraPayment ?? 0,
          startYear: l.startYear ?? new Date().getFullYear(),
          endYear: l.endYear ?? null,
          include: l.include !== false,
          ...l,
        }))
      } catch {
        // ignore malformed stored data
      }
    }
    return []
  })

  const createLiability = () => ({
    id: crypto.randomUUID(),
    name: '',
    principal: 0,
    interestRate: 0,
    termYears: 1,
    paymentsPerYear: 12,
    extraPayment: 0,
    startYear: new Date().getFullYear(),
    endYear: null,
    include: true,
  })

  // === Profile & KYC fields (with lifeExpectancy) ===
  const initialProfile = mapPersonaProfile(hadiSeed.profile)
  const [profile, setProfile] = useState(() => {
    const s = storage.get('profile')
    return s ? safeParse(s, initialProfile) : initialProfile
  })

  const [profileComplete, setProfileComplete] = useState(() => {
    return storage.get('profileComplete') === 'true'
  })

  // Utility to create a new asset with defaults
  const createAsset = () => ({
    id: crypto.randomUUID(),
    name: '',
    amount: 0,
    expectedReturn: 0,
    volatility: 0,
    horizonYears: profile.lifeExpectancy - profile.age,
    purchaseYear: new Date().getFullYear(),
    saleYear: null,
    principal: 0,
  })

  // === Life events timeline ===
  const [events, setEvents] = useState(() => readEvents(storage))

  const addEvent = useCallback(event => {
    const list = storeAddEvent(storage, event)
    setEvents(list)
  }, [])

  const updateEventEntry = useCallback((id, updates) => {
    const list = storeUpdateEvent(storage, id, updates)
    setEvents(list)
  }, [])

  const removeEvent = useCallback(id => {
    const list = storeRemoveEvent(storage, id)
    setEvents(list)
  }, [])

  // === Settings state ===
  const [settings, setSettings] = useState(() => {
    const s = storage.get('settings')
    const incomeStartYearFromStorage = storage.get('incomeStartYear')
    const defaults = {
      startYear: incomeStartYearFromStorage ? Number(incomeStartYearFromStorage) : new Date().getFullYear(),
      projectionYears: profile.lifeExpectancy - profile.age,
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
      pensionContributionReliefPct: 0,
    }
    const loaded = s ? { ...defaults, ...safeParse(s, {}) } : defaults
    if (!loaded.currency) {
      const nat = profile.nationality
      loaded.currency = DEFAULT_CURRENCY_MAP[nat] || 'KES'
    }
    return loaded
  })

  const startYear = useMemo(() => {
    return settings.startYear
  }, [settings.startYear])

  // === Risk scoring ===
  const [riskScore, setRiskScore] = useState(0)
  const [riskCategory, setRiskCategory] = useState(() => deriveCategory(0))

  useEffect(() => {
    setRiskCategory(deriveCategory(riskScore))
  }, [riskScore])

  // === Derived strategy ===
  const [strategy, setStrategy] = useState(() =>
    storage.get('strategy') || ''
  )

  useEffect(() => {
    if (!storage.get('strategy')) {
      setStrategy(deriveStrategy(riskScore, profile.investmentHorizon))
    }
  }, [riskScore, profile.investmentHorizon])

  useEffect(() => {
    if (strategy) storage.set('strategy', strategy)
  }, [strategy])

  // Re-evaluate risk when market shocks occur
  useEffect(() => {
    const handler = e => {
      const delta = Number(e.detail?.delta) || 0
      setRiskScore(prev => {
        const next = Math.max(0, Math.min(prev + delta, 100))
        storage.set('riskScore', next)
        setRiskCategory(deriveCategory(next))
        return next
      })
    }
    window.addEventListener('marketShock', handler)
    return () => window.removeEventListener('marketShock', handler)
  }, [])

  // === Updaters that persist to localStorage ===
  const updateSettings = useCallback(updated => {
    setSettings(prevSettings => {
      if (JSON.stringify(updated) !== JSON.stringify(prevSettings)) {
        storage.set('settings', JSON.stringify(updated))
        return updated
      }
      return prevSettings
    })
  }, [])

  const updateProfile = useCallback(updated => {
    const score = typeof updated.riskScore === 'number'
      ? updated.riskScore
      : calculateRiskScore(updated)
    const category = deriveCategory(score)
    const nextProfile = { ...updated, riskScore: score, riskCategory: category }
    setProfile(nextProfile)
    storage.set('profile', JSON.stringify(nextProfile))
    setRiskScore(score)
    setRiskCategory(category)
    storage.set('riskScore', score)
    if (!settings.currency) {
      const cur = DEFAULT_CURRENCY_MAP[updated.nationality]
      if (cur) updateSettings({ ...settings, currency: cur })
    }
  }, [settings, updateSettings, setProfile, setRiskScore, setRiskCategory])

  const clearProfile = useCallback(() => {
    updateProfile(defaultProfile)
  }, [updateProfile])

  const resetProfile = useCallback(() => {
    if (currentData?.profile) {
      updateProfile(mapPersonaProfile(currentData.profile))
    }
  }, [currentData, updateProfile])

  const revertProfile = useCallback(index => {
    const versions = readVersions(storage)
    const snap =
      versions.length === 0
        ? null
        : typeof index === 'number'
          ? versions[index]
          : versions[versions.length - 1]
    if (snap && snap.profile) {
      updateProfile(snap.profile)
    }
  }, [updateProfile])

  // Derive default currency when none chosen
  useEffect(() => {
    if (!settings.currency) {
      const cur = DEFAULT_CURRENCY_MAP[profile.nationality] || 'KES'
      if (settings.currency !== cur) {
        updateSettings({ ...settings, currency: cur })
      }
    }
  }, [profile.nationality, settings.currency, updateSettings, settings])

  // === Load default seed data if no saved profile ===
  useEffect(() => {
    if (storage.get('profile')) return
    const seed = hadiSeed
    if (!seed) return
    if (seed.profile) updateProfile(mapPersonaProfile(seed.profile))
    if (Array.isArray(seed.incomeSources)) setIncomeSources(seed.incomeSources)
    if (Array.isArray(seed.expensesList)) {
      const now = new Date().getFullYear()
      const list = seed.expensesList.map(e => ({
        paymentsPerYear: typeof e.frequency === 'number'
          ? e.frequency
          : frequencyToPayments(e.frequency) || 1,
        startYear: e.startYear ?? now,
        endYear: e.endYear ?? null,
        priority: e.priority ?? 2,
        include: e.include !== false,
        ...e,
      }))
      setExpensesList(list)
    }
    if (Array.isArray(seed.goalsList)) {
      const now = new Date().getFullYear()
      const goals = seed.goalsList.map(g => ({
        startYear: g.startYear ?? g.targetYear ?? now,
        endYear: g.endYear ?? g.targetYear ?? now,
        ...g,
      }))
      setGoalsList(goals)
    }
    if (Array.isArray(seed.assetsList)) {
      const assets = seed.assetsList.map(a => ({
        id: a.id || crypto.randomUUID(),
        name: a.name,
        amount: a.value,
        type: a.type || '',
        expectedReturn: a.return ?? 0,
        volatility: a.volatility ?? 0,
        horizonYears: a.horizonYears ?? 0,
      }))
      setAssetsList(assets)
    }
    if (Array.isArray(seed.liabilitiesList)) {
      const liabs = seed.liabilitiesList.map(l => ({
        id: l.id || crypto.randomUUID(),
        name: l.name,
        principal: l.principal,
        interestRate: l.interestRate,
        termYears: Math.ceil((l.termMonths || 0) / 12),
        remainingMonths: l.termMonths,
        paymentsPerYear: 12,
        payment: l.monthlyPayment,
        include: l.include !== false,
      }))
      setLiabilitiesList(liabs)
    }
    if (seed.settings) updateSettings({
      discretionaryCutThreshold: 0,
      survivalThresholdMonths: 0,
      bufferPct: 0,
      ...seed.settings,
    })
    if ('includeMediumPV' in seed) setIncludeMediumPV(seed.includeMediumPV)
    if ('includeLowPV' in seed) setIncludeLowPV(seed.includeLowPV)
    if ('includeGoalsPV' in seed) setIncludeGoalsPV(seed.includeGoalsPV)
    if ('includeLiabilitiesNPV' in seed) setIncludeLiabilitiesNPV(seed.includeLiabilitiesNPV)
  }, [
    updateProfile,
    setIncomeSources,
    setExpensesList,
    setGoalsList,
    setAssetsList,
    setLiabilitiesList,
    updateSettings,
    setIncludeMediumPV,
    setIncludeLowPV,
    setIncludeGoalsPV,
    setIncludeLiabilitiesNPV,
  ])

  // Auto-populate salary end year using retirement age
  useEffect(() => {
    setIncomeSources(prev => {
      const diff = (settings.retirementAge ?? 65) - (profile.age ?? 0)
      let changed = false
      const next = prev.map(src => {
        const t = String(src.type || '').toLowerCase()
        const isSalary = t === 'salary' || t === 'employment'
        if (isSalary && src.endYear == null) {
          const base = src.startYear ?? startYear
          const end = base + diff - 1
          if (src.endYear !== end) {
            changed = true
            return { ...src, endYear: end }
          }
        }
        return src
      })
      return changed ? next : prev
    })
  }, [profile.age, settings.retirementAge, startYear])

  // === Persist state slices ===
  useEffect(() => {
    const storedIncomeSources = storage.get('incomeSources');
    if (JSON.stringify(incomeSources) !== storedIncomeSources) {
      storage.set('incomeSources', JSON.stringify(incomeSources));
    }
  }, [incomeSources]);
  
  
  useEffect(() => {
    const storedGoalsList = storage.get('goalsList');
    if (JSON.stringify(goalsList) !== storedGoalsList) {
      storage.set('goalsList', JSON.stringify(goalsList));
    }
  }, [goalsList]);
  useEffect(() => {
    const storedAssetsList = storage.get('assetsList');
    if (JSON.stringify(assetsList) !== storedAssetsList) {
      storage.set('assetsList', JSON.stringify(assetsList));
    }
  }, [assetsList]);
  useEffect(() => {
    const storedLiabilitiesList = storage.get('liabilitiesList');
    if (JSON.stringify(liabilitiesList) !== storedLiabilitiesList) {
      storage.set('liabilitiesList', JSON.stringify(liabilitiesList));
    }
  }, [liabilitiesList]);
  useEffect(() => {
    const storedInvestmentContributions = storage.get('investmentContributions');
    if (JSON.stringify(investmentContributions) !== storedInvestmentContributions) {
      storage.set('investmentContributions', JSON.stringify(investmentContributions));
    }
  }, [investmentContributions]);
  useEffect(() => {
    const storedPensionStreams = storage.get('pensionStreams');
    if (JSON.stringify(pensionStreams) !== storedPensionStreams) {
      storage.set('pensionStreams', JSON.stringify(pensionStreams));
    }
  }, [pensionStreams]);

  useEffect(() => {
    const newMonthlyTotal = expensesList.reduce((sum, e) => {
      const amt = parseFloat(e.amount) || 0
      return sum + amt * (e.paymentsPerYear / 12)
    }, 0)
    if (newMonthlyTotal !== monthlyExpense) {
      setMonthlyExpense(newMonthlyTotal)
      storage.set('monthlyExpense', newMonthlyTotal.toString())
    }
  }, [expensesList, monthlyExpense])

  useEffect(() => {
    const newMonthlyIncome = incomeSources.reduce((sum, src) => {
      if (src.active === false) return sum
      let monthlyGross = src.amount / (src.frequency / 12)
      let monthlyNSSF = 0
      let monthlyPAYE = 0

      if (src.type === 'Kenyan Salary') {
        const nssf = calculateNSSF(src.grossSalary)
        monthlyNSSF = nssf.employeeContribution
        const taxableIncome = src.grossSalary - monthlyNSSF
        const totalPensionContribution = monthlyNSSF + privatePensionContributions.reduce((s, ppc) => s + ppc.amount / (ppc.frequency / 12), 0)
        monthlyPAYE = calculatePAYE(taxableIncome, totalPensionContribution)
        monthlyGross = src.grossSalary
      }

      const netIncome = monthlyGross - monthlyNSSF - monthlyPAYE
      return sum + netIncome
    }, 0)

    if (newMonthlyIncome !== monthlyIncomeNominal) {
      setMonthlyIncomeNominal(newMonthlyIncome)
      storage.set('monthlyIncomeNominal', newMonthlyIncome.toString())
    }

    const newSurplus = newMonthlyIncome - monthlyExpense
    if (newSurplus !== monthlySurplusNominal) {
      setMonthlySurplusNominal(newSurplus)
      storage.set('monthlySurplusNominal', newSurplus.toString())
    }
  }, [incomeSources, monthlyExpense, monthlyIncomeNominal, monthlySurplusNominal, privatePensionContributions])

  const annualIncome = useMemo(
    () =>
      selectAnnualIncome({
        incomeSources,
        startYear,
        years,
        settings
      }),
    [incomeSources, startYear, years, settings]
  )

  const annualIncomePV = useMemo(
    () =>
      selectAnnualIncomePV({
        incomeSources,
        startYear,
        years,
        settings
      }),
    [incomeSources, startYear, years, settings]
  )

  const annualOutflow = useMemo(
    () =>
      selectAnnualOutflow({
        expensesList,
        goalsList,
        startYear,
        years,
        settings
      }),
    [expensesList, goalsList, startYear, years, settings]
  )

  const discountedNetSeries = useMemo(
    () => {
      const incomePVSeries = selectAnnualIncomePV({
        incomeSources,
        startYear,
        years,
        settings
      })
      const out = selectAnnualOutflow({
        expensesList,
        goalsList,
        startYear,
        years,
        settings
      })
      return incomePVSeries.map((pv, idx) => pv - out[idx])
    },
    [incomeSources, expensesList, goalsList, startYear, years, settings]
  )

  const discountedNet = useMemo(
    () =>
      selectDiscountedNet({
        incomeSources,
        expensesList,
        goalsList,
        startYear,
        years,
        settings
      }),
    [incomeSources, expensesList, goalsList, startYear, years, settings]
  )

  const cumulativePV = useMemo(
    () =>
      selectCumulativePV({
        incomeSources,
        expensesList,
        goalsList,
        startYear,
        years,
        settings
      }),
    [incomeSources, expensesList, goalsList, startYear, years, settings]
  )

  const incomePvValue = useMemo(() => {
    const rate = settings.discountRate ?? discountRate
    const planStart = startYear
    const planEnd = startYear + years - 1
    const assumptions = {
      retirementAge: startYear + (settings.retirementAge - profile.age) - 1,
      deathAge: startYear + (profile.lifeExpectancy - profile.age) - 1,
    }
    return incomeSources.reduce((sum, src) => {
      if (src.active === false) return sum
      let incomeAmount = src.amount
      if (src.type === 'Kenyan Salary') {
        const nssf = calculateNSSF(src.grossSalary)
        incomeAmount = (src.grossSalary * 12) - nssf.employeeContribution // Annualized gross salary minus annual employee NSSF
      }
      const afterTaxAmt = incomeAmount * (1 - (src.taxRate || 0) / 100)
      const growth = src.growth || 0
      // Removed dependency on assetsList here to break circular dependency
      // const linked = assetsList.find(a => a.id === src.linkedAssetId)
      const srcStart = Math.max(src.startYear ?? planStart, planStart)
      let srcEnd = getStreamEndYear(src, assumptions, null) // Pass null for linked asset
      srcEnd = Math.min(srcEnd, planEnd)
      if (srcEnd < srcStart) return sum
      const activeYears = srcEnd - srcStart + 1
      const pvImmediate = calculatePV(
        afterTaxAmt,
        src.frequency,
        growth,
        rate,
        activeYears
      )
      const offsetYears = srcStart - planStart
      const discounted = pvImmediate / Math.pow(1 + rate / 100, offsetYears)
      return sum + discounted
    }, 0)
  }, [
    incomeSources,
    settings.discountRate,
    settings.inflationRate,
    settings.retirementAge,
    settings.taxBrackets,
    settings.pensionContributionReliefPct,
    profile.age,
    profile.lifeExpectancy,
    discountRate,
    years,
    startYear
  ])

  const recalcIncomePV = useCallback(() => {
    if (incomePvValue !== incomePV) {
      setIncomePV(incomePvValue)
      storage.set('incomePV', incomePvValue.toString())
    }
  }, [incomePvValue, incomePV])

  useEffect(() => {
    recalcIncomePV()
  }, [recalcIncomePV])

  const expensesPvData = useMemo(() => {
    let high = 0
    let medium = 0
    let low = 0
    const rate = settings.discountRate ?? discountRate
    const horizonEnd = startYear + years - 1
    const totalPv = expensesList.reduce((sum, exp) => {
      const growth = exp.growth ?? settings.inflationRate
      const s = exp.startYear ?? startYear
      const e = exp.endYear ?? horizonEnd
      const first = Math.max(s, startYear)
      const last = Math.min(e, horizonEnd)
      if (last < first) return sum
      let pv = 0
      for (let yr = first; yr <= last; yr++) {
        const idx = yr - s
        const cash =
          (exp.amount * exp.paymentsPerYear) *
          Math.pow(1 + growth / 100, idx)
        const disc = yr - startYear + 1
        pv += cash / Math.pow(1 + rate / 100, disc)
      }
      if (exp.priority === 1) high += pv
      else if (exp.priority === 2) medium += pv
      else low += pv
      return sum + pv
    }, 0)
    const months = years * 12
    const avgMonthly = months > 0 ? totalPv / months : 0
    const mHigh = months > 0 ? high / months : 0
    const mMedium = months > 0 ? medium / months : 0
    const mLow = months > 0 ? low / months : 0
    return {
      high,
      medium,
      low,
      totalPv,
      avgMonthly,
      mHigh,
      mMedium,
      mLow,
    }
  }, [expensesList, settings.discountRate, settings.inflationRate, discountRate, years, startYear])

  const recalcExpensesPV = useCallback(() => {
    const { high, medium, low, totalPv, avgMonthly, mHigh, mMedium, mLow } = expensesPvData
    if (high !== pvHigh) {
      setPvHigh(high)
      storage.set('pvHigh', high.toString())
    }
    if (medium !== pvMedium) {
      setPvMedium(medium)
      storage.set('pvMedium', medium.toString())
    }
    if (low !== pvLow) {
      setPvLow(low)
      storage.set('pvLow', low.toString())
    }
    if (totalPv !== expensesPV) {
      setExpensesPV(totalPv)
      storage.set('expensesPV', totalPv.toString())
    }
    if (totalPv !== pvExpenses) {
      setPvExpenses(totalPv)
      storage.set('pvExpenses', totalPv.toString())
    }
    if (avgMonthly !== monthlyPVExpense) {
      setMonthlyPVExpense(avgMonthly)
      storage.set('monthlyPVExpense', avgMonthly.toString())
    }
    if (mHigh !== monthlyPVHigh) {
      setMonthlyPVHigh(mHigh)
      storage.set('monthlyPVHigh', mHigh.toString())
    }
    if (mMedium !== monthlyPVMedium) {
      setMonthlyPVMedium(mMedium)
      storage.set('monthlyPVMedium', mMedium.toString())
    }
    if (mLow !== monthlyPVLow) {
      setMonthlyPVLow(mLow)
      storage.set('monthlyPVLow', mLow.toString())
    }
  }, [expensesPvData, pvHigh, pvMedium, pvLow, expensesPV, pvExpenses, monthlyPVExpense, monthlyPVHigh, monthlyPVMedium, monthlyPVLow])

  useEffect(() => {
    recalcExpensesPV()
  }, [recalcExpensesPV])

  useEffect(() => {
    recalcIncomePV()
    recalcExpensesPV()
  }, [recalcIncomePV, recalcExpensesPV, settings.discountRate, settings.inflationRate])

  useEffect(() => {
    recalcIncomePV()
    recalcExpensesPV()
  }, [
    settings.retirementAge,
    settings.taxBrackets,
    settings.pensionContributionReliefPct,
    recalcIncomePV,
    recalcExpensesPV
  ])

  useEffect(() => {
    const storedIncludeMediumPV = storage.get('includeMediumPV');
    if (JSON.stringify(includeMediumPV) !== storedIncludeMediumPV) {
      storage.set('includeMediumPV', JSON.stringify(includeMediumPV));
    }
  }, [includeMediumPV]);
  useEffect(() => {
    const storedIncludeLowPV = storage.get('includeLowPV');
    if (JSON.stringify(includeLowPV) !== storedIncludeLowPV) {
      storage.set('includeLowPV', JSON.stringify(includeLowPV));
    }
  }, [includeLowPV]);
  useEffect(() => {
    const storedIncludeGoalsPV = storage.get('includeGoalsPV');
    if (JSON.stringify(includeGoalsPV) !== storedIncludeGoalsPV) {
      storage.set('includeGoalsPV', JSON.stringify(includeGoalsPV));
    }
  }, [includeGoalsPV]);
  useEffect(() => {
    const storedIncludeLiabilitiesNPV = storage.get('includeLiabilitiesNPV');
    if (JSON.stringify(includeLiabilitiesNPV) !== storedIncludeLiabilitiesNPV) {
      storage.set('includeLiabilitiesNPV', JSON.stringify(includeLiabilitiesNPV));
    }
  }, [includeLiabilitiesNPV]);

  useEffect(() => {
    const assetTotal = assetsList.reduce(
      (sum, a) => sum + Number(a.amount || 0),
      0
    )
    const liabilityTotal = liabilitiesList.reduce(
      (sum, l) => sum + Number(l.amount || l.principal || 0),
      0
    )

    const currentYear = new Date().getFullYear()
    const pvGoals = goalsList.reduce((sum, g) => {
      const yrs = Math.max(0, g.targetYear - currentYear)
      return sum + g.amount / Math.pow(1 + discountRate / 100, yrs)
    }, 0)

    const nw = assetTotal - liabilityTotal + incomePV - expensesPV - pvGoals
    const dar = assetTotal > 0 ? liabilityTotal / assetTotal : 0
    const hcs = assetTotal > 0 ? incomePV / assetTotal : 0

    if (nw !== netWorth) {
      setNetWorth(nw)
      storage.set('netWorth', nw.toString())
    }
    if (dar !== debtToAssetRatio) {
      setDebtToAssetRatio(dar)
      storage.set('debtToAssetRatio', dar.toString())
    }
    if (hcs !== humanCapitalShare) {
      setHumanCapitalShare(hcs)
      storage.set('humanCapitalShare', hcs.toString())
    }
  }, [assetsList, liabilitiesList, goalsList, incomePV, expensesPV, discountRate, netWorth, debtToAssetRatio, humanCapitalShare])

  // Update PV of Lifetime Income asset when incomePV changes
  useEffect(() => {
    setAssetsList(prevAssets => {
      const pvIncomeAsset = prevAssets.find(a => a.id === 'pv-income')
      if (pvIncomeAsset && pvIncomeAsset.amount !== incomePV) {
        return prevAssets.map(a =>
          a.id === 'pv-income' ? { ...a, amount: incomePV, principal: incomePV } : a
        )
      }
      return prevAssets
    })
  }, [incomePV, setAssetsList])

  // Project Pension Growth and update assetsList
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const yearsToRetirement = (settings.retirementAge ?? 65) - (profile.age ?? 0);

    const totalAnnualNSSFContributions = incomeSources.reduce((sum, src) => {
      if (src.type === 'Kenyan Salary') {
        const nssf = calculateNSSF(src.grossSalary);
        return sum + nssf.employeeContribution * 12;
      }
      return sum;
    }, 0);

    const totalAnnualPrivatePensionContributions = privatePensionContributions.reduce((sum, ppc) => {
      return sum + ppc.amount * ppc.frequency;
    }, 0);

    const totalAnnualPensionContributions = totalAnnualNSSFContributions + totalAnnualPrivatePensionContributions;

    // Assuming initial pension value is 0 for simplicity, or could be added as a new input
    const initialPensionValue = 0; 

    const projectedPensionValue = projectPensionGrowth(
      initialPensionValue,
      totalAnnualPensionContributions,
      settings.expectedReturn, // Using expectedReturn for pension growth
      yearsToRetirement
    );

    setAssetsList(prevAssets => {
      const existingPensionAsset = prevAssets.find(a => a.id === 'projected-pension-value');
      if (existingPensionAsset) {
        return prevAssets.map(a =>
          a.id === 'projected-pension-value' ? { ...a, amount: projectedPensionValue, principal: projectedPensionValue } : a
        );
      } else {
        return [
          ...prevAssets,
          {
            id: 'projected-pension-value',
            name: 'Projected Pension Value',
            amount: projectedPensionValue,
            type: 'Pension',
            expectedReturn: settings.expectedReturn,
            volatility: 0, // Pension growth is often less volatile
            horizonYears: yearsToRetirement,
            purchaseYear: currentYear,
            saleYear: null,
            principal: projectedPensionValue,
          },
        ];
      }
    });
  }, [incomeSources, privatePensionContributions, profile.age, settings.retirementAge, settings.expectedReturn, setAssetsList]);

  // === Auto-load persisted state on mount ===
  useEffect(() => {
    const ip = storage.get('incomePV')
    if (ip) setIncomePV(+ip)
    const ep = storage.get('expensesPV')
    if (ep) setExpensesPV(+ep)

    const rs = storage.get('riskScore')

    const sProf = storage.get('profile')
    let loadedProfile = null
    if (sProf) {
      const p = safeParse(sProf, null)
      if (p) {
        loadedProfile = p
        setProfile(p)
      }
    }

    if (rs) {
      const num = +rs
      if (num <= 12) {
        const score = loadedProfile
          ? calculateRiskScore(loadedProfile)
          : Math.round((num / 12) * 100)
        setRiskScore(score)
        setRiskCategory(deriveCategory(score))
        storage.set('riskScore', score)
      } else {
        setRiskScore(num)
        setRiskCategory(deriveCategory(num))
      }
    } else if (loadedProfile) {
      const score = calculateRiskScore(loadedProfile)
      setRiskScore(score)
      setRiskCategory(deriveCategory(score))
      storage.set('riskScore', score)
    }

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

    const sInc = storage.get('incomeSources')
    if (sInc) {
      try {
        const parsed = JSON.parse(sInc)
        const now = new Date().getFullYear()
        setIncomeSources(
          parsed.map(src => ({
            id: src.id || crypto.randomUUID(),
            startYear: src.startYear ?? now,
            startAge: src.startAge ?? null,
            endYear: src.endYear ?? null,
            linkedAssetId: src.linkedAssetId ?? '',
            active: src.active !== false,
            taxed: src.taxed ?? true,
            grossSalary: src.grossSalary ?? 0,
            contractedOutTier2: src.contractedOutTier2 ?? false,
            ...src,
          }))
        )
      } catch {
        // ignore malformed stored data
      }
    }
    const sSY = storage.get('incomeStartYear')
    if (sSY) setSettings(prevSettings => ({ ...prevSettings, startYear: +sSY }));

    const sExp = storage.get('expensesList')
    if (sExp) {
      try {
        const parsed = JSON.parse(sExp)
        const now = new Date().getFullYear()
        setExpensesList(
          parsed.map(exp => {
            const ppy = typeof exp.paymentsPerYear === 'number'
              ? exp.paymentsPerYear
              : frequencyToPayments(exp.frequency) || 1
            return {
              startYear: exp.startYear ?? now,
              endYear: exp.endYear ?? null,
              priority: exp.priority ?? 2,
              ...exp,
              paymentsPerYear: ppy,
            }
          })
        )
      } catch {
        // ignore malformed stored data
      }
    }
    const sG = storage.get('goalsList')
    if (sG) {
      try {
        const parsed = JSON.parse(sG)
        const now = new Date().getFullYear()
        setGoalsList(
          parsed.map(g => ({
            startYear: g.startYear ?? g.targetYear ?? now,
            endYear: g.endYear ?? g.targetYear ?? now,
            ...g,
          }))
        )
      } catch {
        // ignore malformed stored data
      }
    }

    const sA = storage.get('assetsList')
    if (sA) {
      try {
        const parsed = JSON.parse(sA)
        setAssetsList(
          parsed.map(a => ({
            id: a.id || crypto.randomUUID(),
            type: a.type || '',
            expectedReturn: a.expectedReturn ?? 0,
            volatility: a.volatility ?? 0,
            horizonYears: a.horizonYears ?? 0,
            ...a,
          }))
        )
      } catch {
        // ignore malformed stored data
      }
    }

    const sL = storage.get('liabilitiesList')
    if (sL) {
      try {
        const parsed = JSON.parse(sL)
        setLiabilitiesList(parsed.map(l => ({ id: l.id || crypto.randomUUID(), ...l })))
      } catch {
        // ignore malformed stored data
      }
    }

    const me = storage.get('monthlyExpense')
    if (me) setMonthlyExpense(+me)

    const pvE = storage.get('pvExpenses')
    if (pvE) setPvExpenses(+pvE)
    const gpv = storage.get('goalsPV')
    if (gpv) setGoalsPV(+gpv)
    const mpvE = storage.get('monthlyPVExpense')
    if (mpvE) setMonthlyPVExpense(+mpvE)
    const ms = storage.get('monthlySurplusNominal')
    if (ms) setMonthlySurplusNominal(+ms)
    const mi = storage.get('monthlyIncomeNominal')
    if (mi) setMonthlyIncomeNominal(+mi)
    const ph = storage.get('pvHigh')
    if (ph) setPvHigh(+ph)
    const pm = storage.get('pvMedium')
    if (pm) setPvMedium(+pm)
    const pl = storage.get('pvLow')
    if (pl) setPvLow(+pl)
    const mph = storage.get('monthlyPVHigh')
    if (mph) setMonthlyPVHigh(+mph)
    const mpm = storage.get('monthlyPVMedium')
    if (mpm) setMonthlyPVMedium(+mpm)
    const mpl = storage.get('monthlyPVLow')
    if (mpl) setMonthlyPVLow(+mpl)
    const nw = storage.get('netWorth')
    if (nw) setNetWorth(+nw)
    const dar = storage.get('debtToAssetRatio')
    if (dar) setDebtToAssetRatio(+dar)
    const hcs = storage.get('humanCapitalShare')
    if (hcs) setHumanCapitalShare(+hcs)

    const incMed = storage.get('includeMediumPV')
    if (incMed) setIncludeMediumPV(safeParse(incMed, true))
    const incLow = storage.get('includeLowPV')
    if (incLow) setIncludeLowPV(safeParse(incLow, true))
    const incGoals = storage.get('includeGoalsPV')
    if (incGoals) setIncludeGoalsPV(safeParse(incGoals, false))
    const incLiab = storage.get('includeLiabilitiesNPV')
    if (incLiab) setIncludeLiabilitiesNPV(safeParse(incLiab, false))
  }, [])

  return (
    <FinanceContext.Provider value={{
      // Core
      discountRate, setDiscountRate,
      years,        setYears,
      monthlyExpense, setMonthlyExpense,
      incomePV,     setIncomePV,
      expensesPV,   setExpensesPV,
      goalsPV,      setGoalsPV,
      pvExpenses,
      monthlyPVExpense,
      pvHigh,
      pvMedium,
      pvLow,
      monthlyPVHigh,
      monthlyPVMedium,
      monthlyPVLow,
      monthlySurplusNominal,
      monthlyIncomeNominal,
      annualIncome,
      annualIncomePV,
      annualOutflow,
      discountedNetSeries,
      discountedNet,
      cumulativePV,
      netWorth,
      debtToAssetRatio,
      humanCapitalShare,
      includeMediumPV, setIncludeMediumPV,
      includeLowPV, setIncludeLowPV,
      includeGoalsPV, setIncludeGoalsPV,
      includeLiabilitiesNPV, setIncludeLiabilitiesNPV,

      // IncomeTab
      incomeSources, setIncomeSources,
      startYear,

      // Expenses & Goals
      expensesList,  setExpensesList,
      goalsList,     setGoalsList,
      investmentContributions, setInvestmentContributions,
      pensionStreams, setPensionStreams,
      privatePensionContributions, setPrivatePensionContributions,
      assetsList,    setAssetsList,
      createAsset,

      // Timeline events
      events,
      addEvent,
      updateEvent: updateEventEntry,
      removeEvent,

      // Liabilities
      liabilitiesList, setLiabilitiesList,
      createLiability,

      // Profile & lifeExpectancy
      profile,       updateProfile,
      clearProfile,
      resetProfile,
      revertProfile,
      profileComplete, setProfileComplete,
      riskScore,
      riskCategory,
      strategy,     setStrategy,

      // Settings
      settings,      updateSettings
    }}>
      {children}
    </FinanceContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useFinance = () => useContext(FinanceContext)
