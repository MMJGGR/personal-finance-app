/* global test, expect */
import { calculateLoanSchedule } from './loanCalculator.js'

test('loan amortization works', () => {
  const schedule = calculateLoanSchedule({
    principal: 200000,
    annualRate: 0.045,
    termYears: 30,
    extraPayment: 200
  })
  expect(schedule.payments.length).toBeGreaterThan(0)
  expect(schedule.totalInterest).toBeGreaterThan(100000)
})
