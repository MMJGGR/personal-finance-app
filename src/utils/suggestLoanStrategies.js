/**
 * src/utils/suggestLoanStrategies.js
 *
 * Given a list of loan liabilities, rank them by the interest savings
 * achieved when making a 10% extra payment each period. This helps surface
 * which loans benefit the most from accelerated repayment.
 */

import { calculateAmortizedPayment } from './financeUtils'

/**
 * Simulate loan amortisation with a constant payment.
 * Returns total interest paid and number of payments.
 */
function simulateLoan(principal, rate, termYears, paymentsPerYear, payment) {
  const r = rate / 100 / paymentsPerYear
  const n = termYears * paymentsPerYear
  let balance = principal
  let interestSum = 0
  let count = 0
  while (balance > 0 && count < n * 2) {
    const interest = balance * r
    interestSum += interest
    const principalPaid = payment - interest
    balance -= principalPaid
    count += 1
    if (count > n * 2) break
  }
  return { interest: interestSum, payments: count }
}

/**
 * Rank loans by potential interest saved when paying 10% extra each period.
 *
 * @param {Array} loans - Array of liability objects.
 * @returns {Array} Sorted list with name, interestSaved and paymentsSaved.
 */
export default function suggestLoanStrategies(loans = []) {
  if (!Array.isArray(loans) || loans.length === 0) return []

  return loans
    .map((loan) => {
      const payment =
        loan.computedPayment ??
        loan.payment ??
        calculateAmortizedPayment(
          loan.principal,
          loan.interestRate,
          loan.termYears,
          loan.paymentsPerYear
        )

      const base = simulateLoan(
        loan.principal,
        loan.interestRate,
        loan.termYears,
        loan.paymentsPerYear,
        payment
      )

      const extra = simulateLoan(
        loan.principal,
        loan.interestRate,
        loan.termYears,
        loan.paymentsPerYear,
        payment * 1.1
      )

      return {
        name: loan.name || 'Loan',
        interestSaved: base.interest - extra.interest,
        paymentsSaved: base.payments - extra.payments
      }
    })
    .sort((a, b) => b.interestSaved - a.interestSaved)
}

