import '../loan/loanTypes'

/**
 * Calculate amortization schedule for a loan.
 * @param {import('./loanTypes.js').LoanInput} input
 * @returns {import('./loanTypes.js').LoanSchedule}
 */
export function calculateLoanSchedule(input) {
  const { principal, annualRate, termYears, extraPayment = 0 } = input
  const monthlyRate = annualRate / 12
  const n = termYears * 12
  const basePayment = principal * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -n)))
  let balance = principal
  const payments = []
  let totalInterest = 0
  const today = new Date()

  for (let i = 1; i <= n && balance > 0; i++) {
    const interest = balance * monthlyRate
    const principalPaid = Math.min(balance, basePayment - interest + extraPayment)
    const payment = interest + principalPaid
    balance -= principalPaid
    totalInterest += interest
    const date = new Date(today.getFullYear(), today.getMonth() + i, 1).toISOString()
    payments.push({ date, payment, principalPaid, interestPaid: interest, balance })
  }

  const pvLiability = payments.reduce(
    (sum, p, idx) => sum + p.payment / Math.pow(1 + monthlyRate, idx + 1),
    0
  )

  return { payments, totalInterest, pvLiability }
}
