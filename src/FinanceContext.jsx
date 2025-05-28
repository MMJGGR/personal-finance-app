// src/FinanceContext.js
import React, { createContext, useContext, useState, useEffect } from 'react'

const FinanceContext = createContext()

export function FinanceProvider({ children }) {
  // === Core financial state ===
  const [discountRate, setDiscountRate] = useState(0)
  const [years, setYears] = useState(1)
  const [monthlyExpense, setMonthlyExpense] = useState(0)
  const [incomePV, setIncomePV] = useState(0)
  const [expensesPV, setExpensesPV] = useState(0)

  // === Profile & KYC fields ===
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    maritalStatus: '',
    numDependents: 0,
    residentialAddress: '',
    nationality: '',
    idNumber: '',
    taxResidence: '',
    employmentStatus: '',
    annualIncome: 0,
    liquidNetWorth: 0,
    sourceOfFunds: '',
    investmentKnowledge: '',
    lossResponse: '',
    investmentHorizon: '',
    investmentGoal: ''
  })

  // === Settings state ===
  const [settings, setSettings] = useState({
    inflationRate: 5,
    expectedReturn: 8,
    currency: 'KES',
    locale: 'en-KE',
    apiEndpoint: ''
  })

  // === Risk scoring ===
  const [riskScore, setRiskScore] = useState(0)
  function calculateRiskScore(p) {
    const map = {
      knowledge: { None:1, Basic:2, Moderate:3, Advanced:4 },
      response:  { Sell:1, Wait:3, BuyMore:5 },
      horizon:   { '<3 years':1, '3–7 years':3, '>7 years':5 },
      goal:      { Preservation:1, Income:3, Growth:5 }
    }
    let s = 0
    s += map.knowledge[p.investmentKnowledge]  || 0
    s += map.response[p.lossResponse]          || 0
    s += map.horizon[p.investmentHorizon]      || 0
    s += map.goal[p.investmentGoal]            || 0
    // capacity adjustment
    const capAdj = p.liquidNetWorth > p.annualIncome ? 2 : 1
    return s + capAdj
  }

  // === Updaters that persist to localStorage ===
  const updateProfile = (updated) => {
    setProfile(updated)
    localStorage.setItem('profile', JSON.stringify(updated))
    const score = calculateRiskScore(updated)
    setRiskScore(score)
    localStorage.setItem('riskScore', score)
  }

  const updateSettings = (updated) => {
    setSettings(updated)
    localStorage.setItem('settings', JSON.stringify(updated))
  }

  // === Auto-load persisted state on mount ===
  useEffect(() => {
    setIncomePV(Number(localStorage.getItem('incomePV') || 0))
    setExpensesPV(Number(localStorage.getItem('expensesPV') || 0))

    const sp = localStorage.getItem('profile')
    if (sp) setProfile(JSON.parse(sp))

    const ss = localStorage.getItem('settings')
    if (ss) setSettings(JSON.parse(ss))

    const rs = Number(localStorage.getItem('riskScore') || 0)
    setRiskScore(rs)
  }, [])

  return (
    <FinanceContext.Provider value={{
      // Core
      discountRate, setDiscountRate,
      years, setYears,
      monthlyExpense, setMonthlyExpense,
      incomePV, setIncomePV,
      expensesPV, setExpensesPV,
      // Profile
      profile, updateProfile,
      riskScore,
      // Settings
      settings, updateSettings
    }}>
      {children}
    </FinanceContext.Provider>
  )
}

export const useFinance = () => useContext(FinanceContext)
