// src/FinanceContext.jsx

import React, { createContext, useContext, useState, useEffect } from 'react'
import { calculatePV, frequencyToPayments } from './utils/financeUtils'

const FinanceContext = createContext()

export function FinanceProvider({ children }) {
  // === Core financial state ===
  const [discountRate, setDiscountRate]     = useState(0)
  const [years, setYears]                   = useState(1)
  const [monthlyExpense, setMonthlyExpense] = useState(() => {
    const s = localStorage.getItem('monthlyExpense')
    return s ? parseFloat(s) : 0
  })
  const [incomePV, setIncomePV]             = useState(0)
  const [expensesPV, setExpensesPV]         = useState(0)
  const [pvExpenses, setPvExpenses]         = useState(0)
  const [monthlyPVExpense, setMonthlyPVExpense] = useState(0)
  const [monthlySurplusNominal, setMonthlySurplusNominal] = useState(() => {
    const s = localStorage.getItem('monthlySurplusNominal')
    return s ? parseFloat(s) : 0
  })
  const [monthlyIncomeNominal, setMonthlyIncomeNominal] = useState(() => {
    const s = localStorage.getItem('monthlyIncomeNominal')
    return s ? parseFloat(s) : 0
  })

  const [pvHigh, setPvHigh] = useState(() => {
    const s = localStorage.getItem('pvHigh')
    return s ? parseFloat(s) : 0
  })
  const [pvMedium, setPvMedium] = useState(() => {
    const s = localStorage.getItem('pvMedium')
    return s ? parseFloat(s) : 0
  })
  const [pvLow, setPvLow] = useState(() => {
    const s = localStorage.getItem('pvLow')
    return s ? parseFloat(s) : 0
  })
  const [monthlyPVHigh, setMonthlyPVHigh] = useState(() => {
    const s = localStorage.getItem('monthlyPVHigh')
    return s ? parseFloat(s) : 0
  })
  const [monthlyPVMedium, setMonthlyPVMedium] = useState(() => {
    const s = localStorage.getItem('monthlyPVMedium')
    return s ? parseFloat(s) : 0
  })
  const [monthlyPVLow, setMonthlyPVLow] = useState(() => {
    const s = localStorage.getItem('monthlyPVLow')
    return s ? parseFloat(s) : 0
  })

  const [includeMediumPV, setIncludeMediumPV] = useState(() => {
    const s = localStorage.getItem('includeMediumPV')
    return s ? JSON.parse(s) : true
  })
  const [includeLowPV, setIncludeLowPV] = useState(() => {
    const s = localStorage.getItem('includeLowPV')
    return s ? JSON.parse(s) : true
  })
  const [includeGoalsPV, setIncludeGoalsPV] = useState(() => {
    const s = localStorage.getItem('includeGoalsPV')
    return s ? JSON.parse(s) : false
  })
  const [includeLiabilitiesNPV, setIncludeLiabilitiesNPV] = useState(() => {
    const s = localStorage.getItem('includeLiabilitiesNPV')
    return s ? JSON.parse(s) : false
  })

  // === Derived balance sheet metrics ===
  const [netWorth, setNetWorth] = useState(() => {
    const s = localStorage.getItem('netWorth')
    return s ? parseFloat(s) : 0
  })
  const [debtToAssetRatio, setDebtToAssetRatio] = useState(() => {
    const s = localStorage.getItem('debtToAssetRatio')
    return s ? parseFloat(s) : 0
  })
  const [humanCapitalShare, setHumanCapitalShare] = useState(() => {
    const s = localStorage.getItem('humanCapitalShare')
    return s ? parseFloat(s) : 0
  })

  // === IncomeTab state ===
  const [incomeSources, setIncomeSources] = useState(() => {
    const s = localStorage.getItem('incomeSources')
    return s
      ? JSON.parse(s)
      : [{
          name: 'Salary',
          type: 'Employment',
          amount: 10000,
          frequency: 12,
          growth: 5,
          taxRate: 30,
        }]
  })
  const [startYear, setStartYear] = useState(() => {
    const s = localStorage.getItem('incomeStartYear')
    return s ? Number(s) : new Date().getFullYear()
  })

  // === Expenses & Goals state ===
  const [expensesList, setExpensesList] = useState(() => {
    const s = localStorage.getItem('expensesList')
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
    const s = localStorage.getItem('goalsList')
    return s ? JSON.parse(s) : []
  })

  // === Balance Sheet assets state ===
  const [assetsList, setAssetsList] = useState(() => {
    const s = localStorage.getItem('assetsList')
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
    const s = localStorage.getItem('liabilitiesList')
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
    const s = localStorage.getItem('profile')
    if (s) return JSON.parse(s)
    return {
      name:'', email:'', phone:'', age:30,
      maritalStatus:'', numDependents:0,
      residentialAddress:'', nationality:'',
      idNumber:'', taxResidence:'',
      employmentStatus:'', annualIncome:0,
      liquidNetWorth:0, sourceOfFunds:'',
      investmentKnowledge:'', lossResponse:'',
      investmentHorizon:'', investmentGoal:'',
      lifeExpectancy:85
    }
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
    const s = localStorage.getItem('settings')
    return s
      ? JSON.parse(s)
      : {
          inflationRate: 5,
          expectedReturn: 8,
          currency: 'KES',
          locale: 'en-KE',
          apiEndpoint: '',
          discretionaryCutThreshold: 0,
          survivalThresholdMonths: 0,
          bufferPct: 0,
        }
  })

  // === Risk scoring ===
  const [riskScore, setRiskScore] = useState(0)
  function calculateRiskScore(p) {
    const map = {
      knowledge:{ None:1, Basic:2, Moderate:3, Advanced:4 },
      response: { Sell:1, Wait:3, BuyMore:5 },
      horizon:  { '<3 years':1, '3–7 years':3, '>7 years':5 },
      goal:     { Preservation:1, Income:3, Growth:5 }
    }
    let s = 0
    s += map.knowledge[p.investmentKnowledge]||0
    s += map.response[p.lossResponse]          ||0
    s += map.horizon[p.investmentHorizon]      ||0
    s += map.goal[p.investmentGoal]            ||0
    const capAdj = p.liquidNetWorth > p.annualIncome ? 2 : 1
    return s + capAdj
  }

  // === Updaters that persist to localStorage ===
  const updateProfile = updated => {
    setProfile(updated)
    localStorage.setItem('profile', JSON.stringify(updated))
    const score = calculateRiskScore(updated)
    setRiskScore(score)
    localStorage.setItem('riskScore', score)
  }
  const updateSettings = updated => {
    setSettings(updated)
    localStorage.setItem('settings', JSON.stringify(updated))
  }

  // === Persist state slices ===
  useEffect(() => { localStorage.setItem('incomeSources', JSON.stringify(incomeSources)) }, [incomeSources])
  useEffect(() => { localStorage.setItem('incomeStartYear', String(startYear)) }, [startYear])
  useEffect(() => { localStorage.setItem('expensesList', JSON.stringify(expensesList)) }, [expensesList])
  useEffect(() => { localStorage.setItem('goalsList', JSON.stringify(goalsList)) }, [goalsList])
  useEffect(() => { localStorage.setItem('assetsList', JSON.stringify(assetsList)) }, [assetsList])
  useEffect(() => { localStorage.setItem('liabilitiesList', JSON.stringify(liabilitiesList)) }, [liabilitiesList])

  useEffect(() => {
    const monthlyTotal = expensesList.reduce((sum, e) => {
      const amt = parseFloat(e.amount) || 0
      return sum + amt * (e.paymentsPerYear / 12)
    }, 0)
    setMonthlyExpense(monthlyTotal)
    localStorage.setItem('monthlyExpense', monthlyTotal.toString())
  }, [expensesList])

  useEffect(() => {
    const monthlyIncome = incomeSources.reduce((sum, src) => {
      const afterTax = src.amount * (1 - (src.taxRate || 0) / 100)
      return sum + (afterTax * src.frequency) / 12
    }, 0)
    setMonthlyIncomeNominal(monthlyIncome)
    localStorage.setItem('monthlyIncomeNominal', monthlyIncome.toString())
    const surplus = monthlyIncome - monthlyExpense
    setMonthlySurplusNominal(surplus)
    localStorage.setItem('monthlySurplusNominal', surplus.toString())
  }, [incomeSources, monthlyExpense])

  useEffect(() => {
    let high = 0
    let medium = 0
    let low = 0
    const totalPv = expensesList.reduce((sum, exp) => {
      const pv = calculatePV(
        exp.amount,
        exp.paymentsPerYear,
        exp.growth || 0,
        discountRate,
        years
      )
      if (exp.priority === 1) high += pv
      else if (exp.priority === 2) medium += pv
      else low += pv
      return sum + pv
    }, 0)

    setPvHigh(high)
    localStorage.setItem('pvHigh', high.toString())
    setPvMedium(medium)
    localStorage.setItem('pvMedium', medium.toString())
    setPvLow(low)
    localStorage.setItem('pvLow', low.toString())

    setPvExpenses(totalPv)
    localStorage.setItem('pvExpenses', totalPv.toString())

    const months = years * 12
    const avgMonthly = months > 0 ? totalPv / months : 0
    const mHigh = months > 0 ? high / months : 0
    const mMedium = months > 0 ? medium / months : 0
    const mLow = months > 0 ? low / months : 0
    setMonthlyPVExpense(avgMonthly)
    localStorage.setItem('monthlyPVExpense', avgMonthly.toString())
    setMonthlyPVHigh(mHigh)
    localStorage.setItem('monthlyPVHigh', mHigh.toString())
    setMonthlyPVMedium(mMedium)
    localStorage.setItem('monthlyPVMedium', mMedium.toString())
    setMonthlyPVLow(mLow)
    localStorage.setItem('monthlyPVLow', mLow.toString())
  }, [expensesList, discountRate, years])

  useEffect(() => {
    localStorage.setItem('includeMediumPV', JSON.stringify(includeMediumPV))
  }, [includeMediumPV])
  useEffect(() => {
    localStorage.setItem('includeLowPV', JSON.stringify(includeLowPV))
  }, [includeLowPV])
  useEffect(() => {
    localStorage.setItem('includeGoalsPV', JSON.stringify(includeGoalsPV))
  }, [includeGoalsPV])
  useEffect(() => {
    localStorage.setItem('includeLiabilitiesNPV', JSON.stringify(includeLiabilitiesNPV))
  }, [includeLiabilitiesNPV])

  useEffect(() => {
    const assetTotal = assetsList.reduce((sum, a) => sum + Number(a.amount || 0), 0)
    const liabilityTotal = liabilitiesList.reduce((sum, l) => sum + Number(l.amount || 0), 0)
    const nw = assetTotal - liabilityTotal
    const dar = assetTotal > 0 ? liabilityTotal / assetTotal : 0
    const hcs = assetTotal > 0 ? incomePV / assetTotal : 0
    setNetWorth(nw)
    localStorage.setItem('netWorth', nw.toString())
    setDebtToAssetRatio(dar)
    localStorage.setItem('debtToAssetRatio', dar.toString())
    setHumanCapitalShare(hcs)
    localStorage.setItem('humanCapitalShare', hcs.toString())
  }, [incomePV, goalsList, liabilitiesList, assetsList])

  // === Auto-load persisted state on mount ===
  useEffect(() => {
    const ip = localStorage.getItem('incomePV')
    if (ip) setIncomePV(+ip)
    const ep = localStorage.getItem('expensesPV')
    if (ep) setExpensesPV(+ep)

    const sProf = localStorage.getItem('profile')
    if (sProf) {
      const p = JSON.parse(sProf)
      setProfile(p)
      setRiskScore(calculateRiskScore(p))
    }

    const sSet = localStorage.getItem('settings')
    if (sSet) {
      const parsed = JSON.parse(sSet)
      setSettings({
        discretionaryCutThreshold: 0,
        survivalThresholdMonths: 0,
        bufferPct: 0,
        ...parsed,
      })
    }

    const sInc = localStorage.getItem('incomeSources')
    if (sInc) setIncomeSources(JSON.parse(sInc))
    const sSY = localStorage.getItem('incomeStartYear')
    if (sSY) setStartYear(+sSY)

    const sExp = localStorage.getItem('expensesList')
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
    const sG = localStorage.getItem('goalsList')
    if (sG) setGoalsList(JSON.parse(sG))

    const sA = localStorage.getItem('assetsList')
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

    const sL = localStorage.getItem('liabilitiesList')
    if (sL) {
      try {
        const parsed = JSON.parse(sL)
        setLiabilitiesList(parsed.map(l => ({ id: l.id || crypto.randomUUID(), ...l })))
      } catch {
        // ignore malformed stored data
      }
    }

    const me = localStorage.getItem('monthlyExpense')
    if (me) setMonthlyExpense(+me)

    const pvE = localStorage.getItem('pvExpenses')
    if (pvE) setPvExpenses(+pvE)
    const mpvE = localStorage.getItem('monthlyPVExpense')
    if (mpvE) setMonthlyPVExpense(+mpvE)
    const ms = localStorage.getItem('monthlySurplusNominal')
    if (ms) setMonthlySurplusNominal(+ms)
    const mi = localStorage.getItem('monthlyIncomeNominal')
    if (mi) setMonthlyIncomeNominal(+mi)
    const ph = localStorage.getItem('pvHigh')
    if (ph) setPvHigh(+ph)
    const pm = localStorage.getItem('pvMedium')
    if (pm) setPvMedium(+pm)
    const pl = localStorage.getItem('pvLow')
    if (pl) setPvLow(+pl)
    const mph = localStorage.getItem('monthlyPVHigh')
    if (mph) setMonthlyPVHigh(+mph)
    const mpm = localStorage.getItem('monthlyPVMedium')
    if (mpm) setMonthlyPVMedium(+mpm)
    const mpl = localStorage.getItem('monthlyPVLow')
    if (mpl) setMonthlyPVLow(+mpl)
    const nw = localStorage.getItem('netWorth')
    if (nw) setNetWorth(+nw)
    const dar = localStorage.getItem('debtToAssetRatio')
    if (dar) setDebtToAssetRatio(+dar)
    const hcs = localStorage.getItem('humanCapitalShare')
    if (hcs) setHumanCapitalShare(+hcs)

    const incMed = localStorage.getItem('includeMediumPV')
    if (incMed) setIncludeMediumPV(JSON.parse(incMed))
    const incLow = localStorage.getItem('includeLowPV')
    if (incLow) setIncludeLowPV(JSON.parse(incLow))
    const incGoals = localStorage.getItem('includeGoalsPV')
    if (incGoals) setIncludeGoalsPV(JSON.parse(incGoals))
    const incLiab = localStorage.getItem('includeLiabilitiesNPV')
    if (incLiab) setIncludeLiabilitiesNPV(JSON.parse(incLiab))
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

      // Settings
      settings,      updateSettings
    }}>
      {children}
    </FinanceContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useFinance = () => useContext(FinanceContext)
