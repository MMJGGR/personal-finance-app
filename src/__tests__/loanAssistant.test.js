/* global test, expect */
import {
  computeBaselineLoanStats,
  computeAcceleratedLoanStats,
  suggestLoanPayments
} from '../utils/loanAssistant'

test('computeBaselineLoanStats returns interest totals', () => {
  const loans = [{ name: 'Loan', principal: 1000, interestRate: 12, termYears: 1, paymentsPerYear: 12 }]
  const result = computeBaselineLoanStats(loans)[0]
  expect(result.payments).toBe(12)
  expect(result.interestTotal).toBeGreaterThan(0)
})

test('computeAcceleratedLoanStats shortens term with extra', () => {
  const loans = [{ principal: 1000, interestRate: 12, termYears: 1, paymentsPerYear: 12 }]
  const base = computeBaselineLoanStats(loans)[0]
  const accel = computeAcceleratedLoanStats(loans, 0.1)[0]
  expect(accel.payments).toBeLessThanOrEqual(base.payments)
  expect(accel.interestTotal).toBeLessThan(base.interestTotal)
})

test('suggestLoanPayments assigns extra to highest rate', () => {
  const loans = [
    { name: 'Low', principal: 1000, interestRate: 5, termYears: 1, paymentsPerYear: 12 },
    { name: 'High', principal: 1000, interestRate: 10, termYears: 1, paymentsPerYear: 12 }
  ]
  const res = suggestLoanPayments(loans, 50)
  const high = res.find(r => r.name === 'High')
  const low = res.find(r => r.name === 'Low')
  expect(high.payment).toBeGreaterThan(low.payment)
})
