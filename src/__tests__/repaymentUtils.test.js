import { calculateLumpSumPV, calculateAmortizedPayment } from '../utils/financeUtils'

/* global test, expect */

test('calculateLumpSumPV discounts future cash flow', () => {
  const pv = calculateLumpSumPV(1000, 10, 2)
  expect(pv).toBeCloseTo(1000 / Math.pow(1.1, 2))
})

test('calculateLumpSumPV handles zero rate', () => {
  expect(calculateLumpSumPV(500, 0, 3)).toBe(500)
})

test('calculateAmortizedPayment handles zero interest', () => {
  const pay = calculateAmortizedPayment(1200, 0, 1, 12)
  expect(pay).toBeCloseTo(100)
})

test('calculateAmortizedPayment with interest', () => {
  const pay = calculateAmortizedPayment(10000, 6, 2, 12)
  const r = 0.06 / 12
  const n = 24
  const expected = (r * 10000) / (1 - Math.pow(1 + r, -n))
  expect(pay).toBeCloseTo(expected)
})
