import { getStreamEndYear } from '../../utils/incomeProjection'
import { calculatePV as calcPV, generateRecurringFlows, frequencyToPayments } from '../../utils/financeUtils'

export function findLinkedAsset(id, assetsList = []) {
  return assetsList.find(a => a.id === id)
}

export function calculatePV(stream, discountRate, years, assumptions = {}, linkedAsset) {
  const now = new Date().getFullYear()
  const startYear = Math.max(now, stream.startYear ?? now)
  const endYear = Math.min(getStreamEndYear(stream, assumptions, linkedAsset), startYear + years - 1)
  if (endYear < startYear) return { gross: 0, net: 0 }

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
    net: gross * (1 - (stream.taxRate || 0) / 100)
  }
}


