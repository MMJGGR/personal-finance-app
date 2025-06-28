import { getStreamEndYear } from '../../utils/incomeProjection'
import { calculatePV as calcPV, frequencyToPayments } from '../../utils/financeUtils'

export function findLinkedAsset(id, assetsList = []) {
  return assetsList.find(a => a.id === id)
}

export function calculatePV(stream, discountRate, years, assumptions = {}, linkedAsset) {
  const now = new Date().getFullYear()
  const birthYear = assumptions.birthYear ?? now
  let startYear = stream.startYear
  if (startYear == null && stream.startAge != null) {
    startYear = birthYear + stream.startAge
  }
  startYear = Math.max(now, startYear ?? now)
  const endYear = Math.min(getStreamEndYear(stream, assumptions, linkedAsset), startYear + years - 1)
  if (endYear < startYear) return { gross: 0, net: 0 }

  if (Array.isArray(stream.vestSchedule) && stream.vestSchedule.length) {
    let gross = 0
    for (const v of stream.vestSchedule) {
      if (!v) continue
      const y = v.year ?? startYear
      if (y < startYear || y > startYear + years - 1) continue
      const shares = (stream.totalGrant || 0) * ((v.pct || 0) / 100)
      const value = shares * (stream.fairValuePerShare || 0)
      const offset = y - now
      gross += value / Math.pow(1 + discountRate / 100, offset)
    }
    return {
      gross,
      net: stream.taxed === false ? gross : gross * (1 - (stream.taxRate || 0) / 100)
    }
  }

  const paymentsPerYear =
    typeof stream.paymentsPerYear === 'number'
      ? stream.paymentsPerYear
      : typeof stream.frequency === 'number'
        ? stream.frequency
        : frequencyToPayments(stream.frequency)

  const pvImmediate = calcPV(
    Number(stream.amount) || 0,
    paymentsPerYear,
    Number(stream.growth) || 0,
    discountRate,
    endYear - startYear + 1
  )
  const offsetYears = startYear - now
  const gross = pvImmediate / Math.pow(1 + discountRate / 100, offsetYears)
  return {
    gross,
    net: stream.taxed === false ? gross : gross * (1 - (stream.taxRate || 0) / 100)
  }
}


