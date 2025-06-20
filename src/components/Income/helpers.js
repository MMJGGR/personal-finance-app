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

export function generateIncomeTimeline(sources, assumptions, assetsList = [], years) {
  const currentYear = new Date().getFullYear()
  const timeline = Array.from({ length: years }, (_, i) => ({
    year: currentYear + i,
    gross: 0,
    net: 0,
    expenses: assumptions.annualExpenses || 0,
  }))

  sources.forEach(s => {
    if (!s.active) return
    const linkedAsset = assetsList.find(a => a.id === s.linkedAssetId)
    const start = Math.max(currentYear, s.startYear ?? currentYear)
    const end = Math.min(getStreamEndYear(s, assumptions, linkedAsset), currentYear + years - 1)
    if (end < start) return

    const flows = generateRecurringFlows({
      amount: Number(s.amount) || 0,
      paymentsPerYear:
        typeof s.paymentsPerYear === 'number'
          ? s.paymentsPerYear
          : typeof s.frequency === 'number'
            ? s.frequency
            : frequencyToPayments(s.frequency),
      growth: Number(s.growth) || 0,
      startYear: start,
      endYear: end,
    })

    flows.forEach(f => {
      const idx = f.year - currentYear
      timeline[idx].gross += f.amount
      timeline[idx].net += f.amount * (1 - (s.taxRate || 0) / 100)
    })
  })

  return timeline
}

