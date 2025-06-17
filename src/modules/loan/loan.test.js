/* global test, expect */
import { calculateLoanSchedule } from './loanCalculator.js'

test('loan amortization works', () => {
  const start = new Date(2025, 0, 1).getTime()
  const schedule = calculateLoanSchedule({
    principal: 200000,
    annualRate: 0.045,
    termYears: 30,
    extraPayment: 200
  }, start)
  expect(schedule.payments.length).toBeGreaterThan(0)
  expect(new Date(schedule.payments[0].date).getFullYear()).toBe(2025)
  expect(schedule.totalInterest).toBeGreaterThan(100000)
})
