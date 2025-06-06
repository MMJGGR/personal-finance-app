/* global test, expect */
import { calculatePV } from '../utils/financeUtils'

test('calculatePV handles supported frequencies', () => {
  const amount = 100
  const growth = 0
  const discount = 5
  const years = 3

  const monthly = calculatePV(amount, 12, growth, discount, years)
  const annual = calculatePV(amount, 1, growth, discount, years)
  const oneTime = calculatePV(amount, 0, growth, discount, years)

  expect(monthly).toBeGreaterThan(annual)
  expect(annual).toBeGreaterThan(0)
  expect(oneTime).toBe(0)
})
