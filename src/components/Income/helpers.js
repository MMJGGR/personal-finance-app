import { getStreamEndYear } from '../../utils/incomeProjection'
import { calculatePV as calcPV, frequencyToPayments, calculateNSSF } from '../../utils/financeUtils'
import { calculatePAYE } from '../../utils/taxEngine.js'

export function findLinkedAsset(id, assetsList = []) {
  return assetsList.find(a => a.id === id)
}

export function calculatePV(
  stream,
  discountRate,
  years,
  assumptions = {},
  linkedAsset,
  privatePensionContributions = []
) {
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
    const net = stream.taxed === false ? gross : gross * (1 - (stream.taxRate || 0) / 100)
    return { gross, net }
  }

  if (stream.type === 'Kenyan Salary') {
    let grossPV = 0
    let netPV = 0
    const offsetYears = startYear - now
    for (let yr = startYear; yr <= endYear; yr++) {
      const idx = yr - startYear
      const growthFactor = Math.pow(1 + (Number(stream.growth) || 0) / 100, idx)
      const monthlyGross = (Number(stream.grossSalary) || 0) * growthFactor
      const { employeeContribution } = calculateNSSF(monthlyGross)
      const privateMonthly = privatePensionContributions.reduce(
        (s, p) => s + p.amount / (p.frequency / 12),
        0
      )
      const monthlyPAYE = calculatePAYE(
        monthlyGross - employeeContribution,
        employeeContribution + privateMonthly
      )
      const monthlyNet = monthlyGross - employeeContribution - monthlyPAYE
      const annualGross = monthlyGross * 12
      const annualNet = monthlyNet * 12
      const factor = Math.pow(1 + discountRate / 100, offsetYears + idx + 1)
      grossPV += annualGross / factor
      netPV += annualNet / factor
    }
    return { gross: grossPV, net: netPV }
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
  const net = stream.taxed === false ? gross : gross * (1 - (stream.taxRate || 0) / 100)
  return { gross, net }
}
