import { frequencyToPayments, calculatePV } from '../utils/financeUtils'

/* global test, expect */

test('frequencyToPayments handles known strings', () => {
  expect(frequencyToPayments('Monthly')).toBe(12)
  expect(frequencyToPayments('Quarterly')).toBe(4)
  expect(frequencyToPayments('Annually')).toBe(1)
})

test('frequencyToPayments handles numeric and invalid values', () => {
  expect(frequencyToPayments(24)).toBe(24)
  expect(frequencyToPayments(0)).toBe(0)
  expect(frequencyToPayments(-3)).toBe(0)
  expect(frequencyToPayments('Weekly')).toBe(0)
  expect(frequencyToPayments()).toBe(0)
})

test('calculatePV returns zero for unknown frequency', () => {
  const pv = calculatePV(100, frequencyToPayments('Unknown'), 0, 5, 5)
  expect(pv).toBe(0)
})
