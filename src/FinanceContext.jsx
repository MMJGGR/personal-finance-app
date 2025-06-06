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
        if (typeof exp.paymentsPerYear === 'number') return exp
        const ppy = frequencyToPayments(exp.frequency) || 1
        const { frequency: _unused, ...rest } = exp
        return { ...rest, paymentsPerYear: ppy }
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

  // === Liabilities (Loans) state ===
  const [liabilitiesList, setLiabilitiesList] = useState(() => {
    const s = localStorage.getItem('liabilitiesList')
    return s ? JSON.parse(s) : []
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

  // === Settings state ===
  const [settings, setSettings] = useState(() => {
    const s = localStorage.getItem('settings')
    return s
      ? JSON.parse(s)
      : { inflationRate:5, expectedReturn:8, currency:'KES', locale:'en-KE', apiEndpoint:'' }
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
    const totalPv = expensesList.reduce((sum, exp) => {
      return sum + calculatePV(
        exp.amount,
        exp.paymentsPerYear,
        exp.growth || 0,
        discountRate,
        years
      )
    }, 0)

    setPvExpenses(totalPv)
    localStorage.setItem('pvExpenses', totalPv.toString())

    const avgMonthly = years > 0 ? totalPv / (years * 12) : 0
    setMonthlyPVExpense(avgMonthly)
    localStorage.setItem('monthlyPVExpense', avgMonthly.toString())
  }, [expensesList, discountRate, years])

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
    if (sSet) setSettings(JSON.parse(sSet))

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

    const sL = localStorage.getItem('liabilitiesList')
    if (sL) setLiabilitiesList(JSON.parse(sL))

    const me = localStorage.getItem('monthlyExpense')
    if (me) setMonthlyExpense(+me)

    const pvE = localStorage.getItem('pvExpenses')
    if (pvE) setPvExpenses(+pvE)
    const mpvE = localStorage.getItem('monthlyPVExpense')
    if (mpvE) setMonthlyPVExpense(+mpvE)
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

      // IncomeTab
      incomeSources, setIncomeSources,
      startYear,     setStartYear,

      // Expenses & Goals
      expensesList,  setExpensesList,
      goalsList,     setGoalsList,

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
