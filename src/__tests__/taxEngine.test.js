/* global test, expect */
import { calculatePAYE } from '../utils/taxEngine.js'

test('PAYE returns zero for low income', () => {
  expect(calculatePAYE(20000, 0)).toBe(0)
})

test('PAYE covers second tax bracket', () => {
  expect(calculatePAYE(30000, 0)).toBeCloseTo(1499.85, 2)
})

test('PAYE covers third tax bracket', () => {
  expect(calculatePAYE(400000, 0)).toBeCloseTo(112383.15, 2)
})

test('PAYE covers fourth tax bracket', () => {
  expect(calculatePAYE(600000, 0)).toBeCloseTo(174883.125, 3)
})

test('PAYE covers fifth tax bracket', () => {
  expect(calculatePAYE(900000, 0)).toBeCloseTo(274883.1, 2)
})

