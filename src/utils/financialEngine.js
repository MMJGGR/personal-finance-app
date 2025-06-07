// src/utils/financialEngine.js
// Higher level financial calculations built on financeUtils and survivalMetrics.

import {
  calculatePV,
  frequencyToPayments
} from './financeUtils'
import {
  calculateNominalSurvival,
  calculatePVSurvival,
  calculatePVObligationSurvival
} from './survivalMetrics'

export function computePV(cashFlows = [], discountRate = 0, horizonYears = 0) {
  if (!Array.isArray(cashFlows) || horizonYears <= 0) return 0
  return cashFlows.reduce((sum, cf) => {
    const amount = Number(cf.amount) || 0
    const paymentsPerYear =
      typeof cf.paymentsPerYear === 'number'
        ? cf.paymentsPerYear
        : frequencyToPayments(cf.frequency ?? 0)
    const growth = Number(cf.growth ?? 0)
    const pv = calculatePV(amount, paymentsPerYear, growth, discountRate, horizonYears)
    return sum + pv
  }, 0)
}

export function computeNetWorth(assets = [], liabilities = []) {
  const totalAssets = Array.isArray(assets)
    ? assets.reduce((s, a) => s + Number(a.amount ?? a.value ?? 0), 0)
    : 0
  const totalLiabilities = Array.isArray(liabilities)
    ? liabilities.reduce((s, l) => s + Number(l.amount ?? l.principal ?? 0), 0)
    : 0
  return totalAssets - totalLiabilities
}

export function computeDebtAssetRatio(assets = [], liabilities = []) {
  const totalAssets = Array.isArray(assets)
    ? assets.reduce((s, a) => s + Number(a.amount ?? a.value ?? 0), 0)
    : 0
  if (totalAssets === 0) return 0
  const totalLiabilities = Array.isArray(liabilities)
    ? liabilities.reduce((s, l) => s + Number(l.amount ?? l.principal ?? 0), 0)
    : 0
  return totalLiabilities / totalAssets
}

export function computeSurvivalMonths(
  pvIncome = 0,
  monthlyObligations = 0,
  options = {}
) {
  const { discountRate = 0, horizonYears = 1, method = 'pv' } = options
  if (method === 'nominal') {
    return calculateNominalSurvival(
      pvIncome,
      discountRate,
      horizonYears,
      monthlyObligations
    )
  }
  if (method === 'obligation') {
    return calculatePVObligationSurvival(pvIncome, discountRate, monthlyObligations)
  }
  return calculatePVSurvival(
    pvIncome,
    discountRate,
    monthlyObligations,
    horizonYears
  )
}

export function deriveHorizon(profile = {}, settings = {}) {
  const age = profile.age ?? 0
  const defaultYears = settings.defaultProjectionYears ?? 0
  const incomeTargetAge = profile.retirementAge ?? age + defaultYears
  const incomeYears = Math.max(0, incomeTargetAge - age)
  const expenseTargetAge = profile.lifeExpectancy ?? age
  const expenseYears = Math.max(0, expenseTargetAge - age)
  return { incomeYears, expenseYears }
}

export default {
  computePV,
  computeNetWorth,
  computeDebtAssetRatio,
  computeSurvivalMonths,
  deriveHorizon
}
