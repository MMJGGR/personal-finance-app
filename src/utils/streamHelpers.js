import { getStreamEndYear } from './incomeProjection'
import { frequencyToPayments } from './financeUtils'

export function annualAmountForYear(streams = [], year, assumptions = {}, assets = []) {
  return streams.reduce((sum, s) => {
    const linked = assets.find(a => a.id === s.linkedAssetId)
    const start = s.startYear ?? year
    const end = getStreamEndYear(s, assumptions, linked)
    if (year < start || year > end) return sum
    const idx = year - start
    const freq = typeof s.paymentsPerYear === 'number'
      ? s.paymentsPerYear
      : typeof s.frequency === 'number'
        ? s.frequency
        : frequencyToPayments(s.frequency) || 1
    const growth = s.growth || 0
    const amt = (Number(s.amount) || 0) * freq * Math.pow(1 + growth / 100, idx)
    return sum + amt
  }, 0)
}

export default { annualAmountForYear }
