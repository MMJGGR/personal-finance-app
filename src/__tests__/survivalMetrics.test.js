/* global test, expect */
import { calculateNominalSurvival, calculatePVSurvival } from '../utils/survivalMetrics'

// Example inputs
const totalPV = 120000
const discount = 6
const years = 10
const monthlyExpense = 1000

test('nominal survival uses annuity factor', () => {
  const months = calculateNominalSurvival(totalPV, discount, years, monthlyExpense)
  expect(months).toBe(1)
})

test('pv survival uses exponential formula', () => {
  const months = calculatePVSurvival(totalPV, discount, monthlyExpense, years)
  expect(months).toBe(183)
})

test('pv survival caps at total period when ratio >= 1', () => {
  const highPV = 300000
  const months = calculatePVSurvival(highPV, discount, monthlyExpense, years)
  expect(months).toBe(years * 12)
})

test('returns Infinity when expenses are zero', () => {
  expect(calculateNominalSurvival(totalPV, discount, years, 0)).toBe(Infinity)
  expect(calculatePVSurvival(totalPV, discount, 0, years)).toBe(Infinity)
})
