import {
  calculateNominalSurvival,
  calculatePVSurvival,
  calculatePVObligationSurvival
} from '../utils/survivalMetrics'

export function computeSurvivalMonths(pvIncome = 0, monthlyOutflow = 0, options = {}) {
  const { discountRate = 0, horizonYears = 1, method = 'pv' } = options
  if (method === 'nominal') {
    return calculateNominalSurvival(pvIncome, discountRate, horizonYears, monthlyOutflow)
  }
  if (method === 'obligation') {
    return calculatePVObligationSurvival(pvIncome, discountRate, monthlyOutflow)
  }
  return calculatePVSurvival(pvIncome, discountRate, monthlyOutflow, horizonYears)
}

export function computeFundingGaps(cumulativePV = []) {
  if (!Array.isArray(cumulativePV)) return []
  return cumulativePV.map(v => (v < 0 ? -v : 0))
}

export default {
  computeSurvivalMonths,
  computeFundingGaps
}
