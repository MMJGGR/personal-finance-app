import { createSelector } from 'reselect'
import { frequencyToPayments } from '../utils/financeUtils'

const getIncomeSources = state => state.incomeSources || []
const getExpenses = state => state.expensesList || []
const getGoals = state => state.goalsList || []
const getStartYear = state => state.startYear || new Date().getFullYear()
const getYears = state => state.years || 1
const getDiscountRate = state => state.settings?.discountRate ?? state.discountRate ?? 0
const getRetirementAge = state => state.settings?.retirementAge ?? 65
const getCurrentAge = state => state.profile?.age ?? 0

export const selectAnnualIncome = createSelector(
  [getIncomeSources, getStartYear, getYears, getRetirementAge, getCurrentAge],
  (sources, startYear, years, retireAge, currentAge) => {
    return Array.from({ length: years }, (_, idx) => {
      const year = startYear + idx
      return sources.reduce((sum, src) => {
        const afterTax = (Number(src.amount) || 0) * (1 - (src.taxRate || 0) / 100)
        const freq = typeof src.frequency === 'number' ? src.frequency : 0
        const sStart = src.startYear ?? startYear
        const isSalary = String(src.type).toLowerCase() === 'salary'
        let sEnd = src.endYear ?? startYear + years - 1
        const retireLimit = startYear + (retireAge - currentAge) - 1
        if (src.endYear == null && isSalary) {
          sEnd = Math.min(sEnd, retireLimit)
        }
        if (year < sStart || year > sEnd) return sum
        const yrIndex = year - sStart
        const growth = src.growth || 0
        const annual = afterTax * freq * Math.pow(1 + growth / 100, yrIndex)
        return sum + annual
      }, 0)
    })
  }
)

export const selectAnnualIncomePV = createSelector(
  [selectAnnualIncome, getDiscountRate],
  (income, rate) => {
    const discount = 1 + rate / 100
    return income.map((amt, idx) => amt / Math.pow(discount, idx + 1))
  }
)

export const selectAnnualOutflow = createSelector(
  [getExpenses, getGoals, getStartYear, getYears],
  (expenses, goals, startYear, years) => {
    return Array.from({ length: years }, (_, idx) => {
      const year = startYear + idx
      const expTotal = expenses.reduce((sum, e) => {
        const ppy = e.paymentsPerYear || frequencyToPayments(e.frequency) || 1
        const growth = e.growth || 0
        const base = (Number(e.amount) || 0) * ppy
        return sum + base * Math.pow(1 + growth / 100, idx)
      }, 0)
      const goalsTotal = goals.reduce(
        (s, g) => s + (g.targetYear === year ? Number(g.amount) || 0 : 0),
        0
      )
      return expTotal + goalsTotal
    })
  }
)

export const selectDiscountedNet = createSelector(
  [selectAnnualIncome, selectAnnualOutflow, getDiscountRate],
  (income, outflow, rate) => {
    const r = rate / 100
    return income.map((inc, idx) => {
      const net = inc - outflow[idx]
      return net / Math.pow(1 + r, idx + 1)
    })
  }
)

export const selectCumulativePV = createSelector(
  [selectDiscountedNet],
  discounted => {
    let sum = 0
    return discounted.map(v => (sum += v))
  }
)
