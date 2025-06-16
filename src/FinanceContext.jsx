// src/FinanceContext.jsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react'
import { calculatePV, frequencyToPayments } from './utils/financeUtils'
import {
  selectAnnualIncome,
  selectAnnualIncomePV,
  selectAnnualOutflow,
  selectDiscountedNet,
  selectCumulativePV
} from './selectors'
import { riskScoreMap } from './riskScoreConfig'
import { deriveStrategy } from './utils/strategyUtils'
import storage from './utils/storage'

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
  // === Core financial state ===
  const [discountRate, setDiscountRate]     = useState(0)
  const [years, setYears]                   = useState(1)
  const [monthlyExpense, setMonthlyExpense] = useState(() => {
    const s = storage.get('monthlyExpense')
    return s ? parseFloat(s) : 0
  })
  const [incomePV, setIncomePV]             = useState(0)
  const [expensesPV, setExpensesPV]         = useState(0)
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
    const defaults = [{
      name: 'Salary',
      type: 'Employment',
      amount: 10000,
      frequency: 12,
      growth: 5,
      taxRate: 30,
      startYear: now,
      endYear: null,
      linkedAssetId: '',
      active: true,
    }]
    if (s) {
      try {
        const parsed = JSON.parse(s)
        const migrated = parsed.map(src => ({
          startYear: src.startYear ?? now,
          endYear: src.endYear ?? null,
          linkedAssetId: src.linkedAssetId ?? '',
          active: src.active !== false,
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
  const [startYear, setStartYear] = useState(() => {
    const s = storage.get('incomeStartYear')
    return s ? Number(s) : new Date().getFullYear()
  })

  // === Expenses & Goals state ===
  const [expensesList, setExpensesList] = useState(() => {
    const s = storage.get('expensesList')
    if (!s) return []
    try {
      const parsed = JSON.parse(s)
      return parsed.map(exp => {
        let paymentsPerYear = exp.paymentsPerYear
        if (typeof paymentsPerYear !== 'number') {
          paymentsPerYear = frequencyToPayments(exp.frequency) || 1
        }
        return {
          ...exp,
          paymentsPerYear,
          priority: exp.priority ?? 2
        }
      })
    } catch {
      // ignore malformed stored data
      return []
    }
  })
  const [goalsList, setGoalsList] = useState(() => {
    const s = storage.get('goalsList')
    return s ? safeParse(s, []) : []
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
      },
      {
        id: crypto.randomUUID(),
        name: 'Investments',
        amount: 1000000,
        type: 'Portfolio',
        expectedReturn: 8,
        volatility: 15,
        horizonYears: 5,
      },
      {
        id: 'pv-income',
        name: 'PV of Lifetime Income',
        amount: 0,
        type: 'Income',
        expectedReturn: 0,
        volatility: 0,
        horizonYears: 0,
      },
    ]
  })

  // === Liabilities (Loans) state ===
  const [liabilitiesList, setLiabilitiesList] = useState(() => {
    const s = storage.get('liabilitiesList')
    if (s) {
      try {
        const parsed = JSON.parse(s)
        return parsed.map(l => ({ id: l.id || crypto.randomUUID(), ...l }))
      } catch {
        // ignore malformed stored data
      }
    }
    return []
  })

  // === Profile & KYC fields (with lifeExpectancy) ===
  const [profile, setProfile] = useState(() => {
    const s = storage.get('profile')
    const defaults = {
      name: '', // FIXME: unused - pending integration
      email: '', // FIXME: unused - pending integration
      phone: '', // FIXME: unused - pending integration
      age: 30,
      maritalStatus: '', // FIXME: unused - pending integration
      numDependents: 0, // FIXME: unused - pending integration
      residentialAddress: '', // FIXME: unused - pending integration
      nationality: '', // FIXME: unused - pending integration
      idNumber: '', // FIXME: unused - pending integration
      taxResidence: '', // FIXME: unused - pending integration
      employmentStatus: '', // FIXME: unused - pending integration
      annualIncome: 0,
      liquidNetWorth: 0,
      sourceOfFunds: '', // FIXME: unused - pending integration
      investmentKnowledge: '',
      lossResponse: '',
      investmentHorizon: '',
      investmentGoal: '',
      lifeExpectancy: 85,
    }
    return s ? safeParse(s, defaults) : defaults
  })

  // Utility to create a new asset with defaults
  const createAsset = () => ({
    id: crypto.randomUUID(),
    name: '',
    amount: 0,
    horizonYears: profile.lifeExpectancy - profile.age,
  })

  // === Settings state ===
  const [settings, setSettings] = useState(() => {
    const s = storage.get('settings')
    const defaults = {
      startYear: new Date().getFullYear(),
      projectionYears: 1,
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
    }
    const loaded = s ? { ...defaults, ...safeParse(s, {}) } : defaults
    if (!loaded.currency) {
      const nat = profile.nationality
      loaded.currency = DEFAULT_CURRENCY_MAP[nat] || 'KES'
    }
    return loaded
  })

  // === Risk scoring ===
  const [riskScore, setRiskScore] = useState(0)
  function calculateRiskScore(p) {
    const map = riskScoreMap
    let s = 0
    s += map.knowledge[p.investmentKnowledge]||0
    s += map.response[p.lossResponse]          ||0
    s += map.horizon[p.investmentHorizon]      ||0
    s += map.goal[p.investmentGoal]            ||0
    const capAdj = p.liquidNetWorth > p.annualIncome ? 2 : 1
    return s + capAdj
  }

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

  // === Updaters that persist to localStorage ===
  const updateSettings = useCallback(updated => {
    setSettings(updated)
    storage.set('settings', JSON.stringify(updated))
  }, [])

  const updateProfile = useCallback(updated => {
    setProfile(updated)
    storage.set('profile', JSON.stringify(updated))
    const score = calculateRiskScore(updated)
    setRiskScore(score)
    storage.set('riskScore', score)
    if (!settings.currency) {
      const cur = DEFAULT_CURRENCY_MAP[updated.nationality]
      if (cur) updateSettings({ ...settings, currency: cur })
    }
  }, [])

  // Derive default currency when none chosen
  useEffect(() => {
    if (!settings.currency) {
      const cur = DEFAULT_CURRENCY_MAP[profile.nationality] || 'KES'
      updateSettings({ ...settings, currency: cur })
    }
  }, [profile.nationality, settings.currency])

  // === Load default Hadi persona if no data present ===
  useEffect(() => {
    async function loadSeed() {
      if (storage.get('profile')) return
      if (typeof fetch !== 'function') return
      try {
        const res = await fetch('/hadiSeed.json')
        if (!res.ok) return
        const seed = await res.json()
        if (seed.profile) updateProfile(seed.profile)
        if (Array.isArray(seed.incomeSources)) setIncomeSources(seed.incomeSources)
        if (Array.isArray(seed.expensesList)) {
          const list = seed.expensesList.map(e => ({
            ...e,
            paymentsPerYear: typeof e.frequency === 'number'
              ? e.frequency
              : frequencyToPayments(e.frequency) || 1,
          }))
          setExpensesList(list)
        }
        if (Array.isArray(seed.goalsList)) setGoalsList(seed.goalsList)
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
      } catch (err) {
        console.error('Failed to load Hadi seed', err)
      }
    }
    loadSeed()
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
  useEffect(() => { storage.set('incomeSources', JSON.stringify(incomeSources)) }, [incomeSources])
  useEffect(() => { storage.set('incomeStartYear', String(startYear)) }, [startYear])
  useEffect(() => { storage.set('expensesList', JSON.stringify(expensesList)) }, [expensesList])
  useEffect(() => {
    if (settings.startYear !== undefined && settings.startYear !== startYear) {
      setStartYear(settings.startYear)
    }
  }, [settings.startYear])
  useEffect(() => {
    if (settings.projectionYears !== undefined && settings.projectionYears !== years) {
      setYears(settings.projectionYears)
    }
  }, [settings.projectionYears])
  useEffect(() => { storage.set('goalsList', JSON.stringify(goalsList)) }, [goalsList])
  useEffect(() => { storage.set('assetsList', JSON.stringify(assetsList)) }, [assetsList])
  useEffect(() => { storage.set('liabilitiesList', JSON.stringify(liabilitiesList)) }, [liabilitiesList])

  useEffect(() => {
    const monthlyTotal = expensesList.reduce((sum, e) => {
      const amt = parseFloat(e.amount) || 0
      return sum + amt * (e.paymentsPerYear / 12)
    }, 0)
    setMonthlyExpense(monthlyTotal)
    storage.set('monthlyExpense', monthlyTotal.toString())
  }, [expensesList])

  useEffect(() => {
    const monthlyIncome = incomeSources.reduce((sum, src) => {
      if (src.active === false) return sum
      const afterTax = src.amount * (1 - (src.taxRate || 0) / 100)
      return sum + (afterTax * src.frequency) / 12
    }, 0)
    setMonthlyIncomeNominal(monthlyIncome)
    storage.set('monthlyIncomeNominal', monthlyIncome.toString())
    const surplus = monthlyIncome - monthlyExpense
    setMonthlySurplusNominal(surplus)
    storage.set('monthlySurplusNominal', surplus.toString())
  }, [incomeSources, monthlyExpense])

  const annualIncome = useMemo(
    () =>
      selectAnnualIncome({
        incomeSources,
        startYear,
        years,
        settings
      }),
    [incomeSources, startYear, years, settings, profile]
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
    [expensesList, goalsList, startYear, years, settings, profile]
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
    [incomeSources, expensesList, goalsList, startYear, years, settings, profile]
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
    [incomeSources, expensesList, goalsList, startYear, years, settings, profile]
  )

  const incomePvValue = useMemo(() => {
    const rate = settings.discountRate ?? discountRate
    const planStart = startYear
    const planEnd = startYear + years - 1
    return incomeSources.reduce((sum, src) => {
      if (src.active === false) return sum
      const afterTaxAmt = src.amount * (1 - (src.taxRate || 0) / 100)
      const growth = src.growth || 0
      const srcStart = Math.max(src.startYear ?? planStart, planStart)
      const isSalary = String(src.type).toLowerCase() === 'salary'
      const retireLimit = startYear + (settings.retirementAge - profile.age) - 1
      let srcEnd = src.endYear ?? planEnd
      if (src.endYear == null && isSalary) {
        srcEnd = Math.min(srcEnd, retireLimit)
      }
      const effectiveEnd = Math.min(srcEnd, planEnd)
      if (effectiveEnd < srcStart) return sum
      const activeYears = effectiveEnd - srcStart + 1
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
  }, [incomeSources, settings.discountRate, settings.inflationRate, settings.retirementAge, profile.age, discountRate, years, startYear])

  const recalcIncomePV = useCallback(() => {
    setIncomePV(incomePvValue)
    storage.set('incomePV', incomePvValue.toString())
  }, [incomePvValue])

  useEffect(() => {
    recalcIncomePV()
  }, [recalcIncomePV])

  const expensesPvData = useMemo(() => {
    let high = 0
    let medium = 0
    let low = 0
    const rate = settings.discountRate ?? discountRate
    const totalPv = expensesList.reduce((sum, exp) => {
      const growth = exp.growth || 0
      const pv = calculatePV(
        exp.amount,
        exp.paymentsPerYear,
        growth,
        rate,
        years
      )
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
  }, [expensesList, settings.discountRate, settings.inflationRate, discountRate, years])

  const recalcExpensesPV = useCallback(() => {
    const { high, medium, low, totalPv, avgMonthly, mHigh, mMedium, mLow } = expensesPvData
    setPvHigh(high)
    storage.set('pvHigh', high.toString())
    setPvMedium(medium)
    storage.set('pvMedium', medium.toString())
    setPvLow(low)
    storage.set('pvLow', low.toString())
    setExpensesPV(totalPv)
    storage.set('expensesPV', totalPv.toString())
    setPvExpenses(totalPv)
    storage.set('pvExpenses', totalPv.toString())
    setMonthlyPVExpense(avgMonthly)
    storage.set('monthlyPVExpense', avgMonthly.toString())
    setMonthlyPVHigh(mHigh)
    storage.set('monthlyPVHigh', mHigh.toString())
    setMonthlyPVMedium(mMedium)
    storage.set('monthlyPVMedium', mMedium.toString())
    setMonthlyPVLow(mLow)
    storage.set('monthlyPVLow', mLow.toString())
  }, [expensesPvData])

  useEffect(() => {
    recalcExpensesPV()
  }, [recalcExpensesPV])

  useEffect(() => {
    recalcIncomePV()
    recalcExpensesPV()
  }, [recalcIncomePV, recalcExpensesPV, settings.discountRate, settings.inflationRate])

  useEffect(() => {
    storage.set('includeMediumPV', JSON.stringify(includeMediumPV))
  }, [includeMediumPV])
  useEffect(() => {
    storage.set('includeLowPV', JSON.stringify(includeLowPV))
  }, [includeLowPV])
  useEffect(() => {
    storage.set('includeGoalsPV', JSON.stringify(includeGoalsPV))
  }, [includeGoalsPV])
  useEffect(() => {
    storage.set('includeLiabilitiesNPV', JSON.stringify(includeLiabilitiesNPV))
  }, [includeLiabilitiesNPV])

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

    setNetWorth(nw)
    storage.set('netWorth', nw.toString())
    setDebtToAssetRatio(dar)
    storage.set('debtToAssetRatio', dar.toString())
    setHumanCapitalShare(hcs)
    storage.set('humanCapitalShare', hcs.toString())
  }, [assetsList, liabilitiesList, goalsList, incomePV, expensesPV, discountRate])

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
      setRiskScore(+rs)
    } else if (loadedProfile) {
      setRiskScore(calculateRiskScore(loadedProfile))
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
      const parsed = safeParse(sInc, null)
      if (parsed) setIncomeSources(parsed)
    }
    const sSY = storage.get('incomeStartYear')
    if (sSY) setStartYear(+sSY)

    const sExp = storage.get('expensesList')
    if (sExp) {
      try {
        const parsed = JSON.parse(sExp)
        setExpensesList(
          parsed.map(exp => {
            if (typeof exp.paymentsPerYear === 'number') return exp
            const ppy = frequencyToPayments(exp.frequency) || 1
            const { frequency: _unused, ...rest } = exp
            return { ...rest, paymentsPerYear: ppy }
          })
        )
      } catch {
        // ignore malformed stored data
      }
    }
    const sG = storage.get('goalsList')
    if (sG) {
      const parsed = safeParse(sG, null)
      if (parsed) setGoalsList(parsed)
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
      startYear,     setStartYear,

      // Expenses & Goals
      expensesList,  setExpensesList,
      goalsList,     setGoalsList,
      assetsList,    setAssetsList,
      createAsset,

      // Liabilities
      liabilitiesList, setLiabilitiesList,

      // Profile & lifeExpectancy
      profile,       updateProfile,
      riskScore,
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
