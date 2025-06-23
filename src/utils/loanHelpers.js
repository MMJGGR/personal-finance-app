import { calculateLoanSchedule } from '../modules/loan/loanCalculator.js'

/**
 * Aggregate loan payments by calendar year.
 *
 * @param {Object[]} liabilitiesList - Array of liability objects
 * @returns {Record<string, number>} map of year to total payments
 */
export function getLoanFlowsByYear(liabilitiesList = []) {
  const totals = {}
  liabilitiesList.forEach(l => {
    if (!l || l.include === false) return
    const startYear = Number(l.startYear) || new Date().getFullYear()
    const schedule = calculateLoanSchedule({
      principal: Number(l.principal) || 0,
      annualRate: Number(l.interestRate) / 100 || 0,
      termYears: Number(l.termYears) ||
        (typeof l.endYear === 'number' && typeof l.startYear === 'number'
          ? l.endYear - l.startYear + 1
          : 1),
      paymentsPerYear: Number(l.paymentsPerYear) || 12,
      extraPayment: Number(l.extraPayment) || 0,
    }, new Date(startYear, 0, 1))

    schedule.payments.forEach(p => {
      const year = new Date(p.date).getFullYear()
      totals[year] = (totals[year] || 0) + p.payment
    })
  })
  return totals
}

export default { getLoanFlowsByYear }
