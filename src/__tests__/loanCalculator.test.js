/* global test, expect */
import { calculateLoanSchedule } from '../modules/loan/loanCalculator'

test('30-year $200k at 4.5% with $200 extra', () => {
  const { payments, totalInterest, pvLiability } = calculateLoanSchedule({
    principal: 200000,
    annualRate: 0.045,
    termYears: 30,
    extraPayment: 200,
  })
  expect(payments.length).toBeLessThanOrEqual(360)
  expect(totalInterest).toBeGreaterThan(100000)
  expect(pvLiability).toBeCloseTo(200000, -2)
})
