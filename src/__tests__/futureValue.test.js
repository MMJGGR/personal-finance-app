/* global test, expect */
import { estimateFutureValue, discountToPresent } from '../utils/financeUtils'

// Basic round-trip check
const amount = 1000
const rate = 5
const years = 3

test('estimateFutureValue compounds annually', () => {
  const fv = estimateFutureValue(amount, rate, years)
  expect(fv).toBeCloseTo(amount * Math.pow(1 + rate / 100, years))
})

test('discountToPresent reverses compounding', () => {
  const pv = discountToPresent(1100, 10, 1)
  expect(pv).toBeCloseTo(1100 / 1.1)
})

test('compounding and discount are inverse operations', () => {
  const fv = estimateFutureValue(amount, rate, years)
  const pv = discountToPresent(fv, rate, years)
  expect(pv).toBeCloseTo(amount)
})
