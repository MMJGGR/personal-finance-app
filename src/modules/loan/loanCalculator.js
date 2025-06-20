import { presentValue } from '../../utils/financeUtils'

/**
 * Calculate amortization schedule for a loan.
 * @param {import('./loanTypes').LoanInput} input
 * @param {number|Date} [startDate=Date.now()] - base date for first payment
 * @returns {import('./loanTypes').LoanSchedule}
 */
export function calculateLoanSchedule(input, startDate = Date.now()) {
  const mRate = input.annualRate / 12
  const n = input.termYears * 12
  const basePay = input.principal * (mRate / (1 - Math.pow(1 + mRate, -n)))
  let balance = input.principal
  let totalInterest = 0
  const payments = []
  const start = new Date(startDate).getTime()
  for (let i = 1; i <= n && balance > 0; i++) {
    const interest = balance * mRate
    const extra = input.extraPayment || 0
    let principalPaid = basePay - interest + extra
    if (principalPaid > balance) principalPaid = balance
    const payment = interest + principalPaid
    balance -= principalPaid
    totalInterest += interest
    const date = new Date(start + 864e5 * 30 * i).toISOString()
    payments.push({ date, payment, principalPaid, interestPaid: interest, balance })
  }
  const pvLiability = presentValue(payments.map(p => p.payment), mRate)
  return { payments, totalInterest, pvLiability }
}
