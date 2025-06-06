import { calculateAmortizedPayment } from './financeUtils'

function simulateLoan(principal, rate, termYears, paymentsPerYear, payment) {
  const r = rate / 100 / paymentsPerYear
  const n = termYears * paymentsPerYear
  let balance = principal
  let interest = 0
  let count = 0
  while (balance > 0 && count < n * 2) {
    const interestPayment = balance * r
    interest += interestPayment
    const principalPaid = payment - interestPayment
    balance -= principalPaid
    count += 1
    if (count > n * 2) break
  }
  return { interest, payments: count }
}

export function computeBaselineLoanStats(loans = []) {
  if (!Array.isArray(loans)) return []
  return loans.map(l => {
    const payment =
      l.computedPayment ??
      l.payment ??
      calculateAmortizedPayment(l.principal, l.interestRate, l.termYears, l.paymentsPerYear)
    const n = l.termYears * l.paymentsPerYear
    const interestTotal = payment * n - l.principal
    return { name: l.name || 'Loan', payment, interestTotal, payments: n }
  })
}

export function computeAcceleratedLoanStats(loans = [], extraPercent = 0.1) {
  if (!Array.isArray(loans)) return []
  return loans.map(l => {
    const basePayment =
      l.computedPayment ??
      l.payment ??
      calculateAmortizedPayment(l.principal, l.interestRate, l.termYears, l.paymentsPerYear)
    const payment = basePayment * (1 + extraPercent)
    const result = simulateLoan(l.principal, l.interestRate, l.termYears, l.paymentsPerYear, payment)
    return {
      name: l.name || 'Loan',
      payment,
      interestTotal: result.interest,
      payments: result.payments
    }
  })
}

export function suggestLoanPayments(loans = [], extraBudget = 0) {
  if (!Array.isArray(loans) || loans.length === 0) return []
  const baseline = computeBaselineLoanStats(loans)
  const sorted = loans.slice().sort((a, b) => b.interestRate - a.interestRate)
  const targetName = sorted[0].name || 'Loan'
  return baseline.map(stat => {
    if (stat.name === targetName) {
      return { ...stat, payment: stat.payment + extraBudget }
    }
    return stat
  })
}

export default { computeBaselineLoanStats, computeAcceleratedLoanStats, suggestLoanPayments }
