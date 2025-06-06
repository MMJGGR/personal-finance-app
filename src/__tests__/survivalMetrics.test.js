/* global test, expect */
import {
  calculateNominalSurvival,
  calculatePVSurvival,
  calculatePVObligationSurvival
} from '../utils/survivalMetrics'

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

test('pv obligation survival uses discounted monthly obligations', () => {
  const months = calculatePVObligationSurvival(totalPV, discount, monthlyExpense)
  expect(months).toBe(119)
})

test('pv obligation survival returns Infinity when obligation is zero', () => {
  expect(calculatePVObligationSurvival(totalPV, discount, 0)).toBe(Infinity)
})

test('pv obligation survival returns Infinity when all obligations excluded', () => {
  const goalsPV = 12000
  const liabilitiesPV = 2400
  const monthlyPVExpense = 0

  const obligation = (g, l) => {
    const goalsPart = g ? goalsPV / (years * 12) : 0
    const liabPart = l ? liabilitiesPV / (years * 12) : 0
    return monthlyPVExpense + goalsPart + liabPart
  }

  const none = obligation(false, false)
  expect(none).toBe(0)
  expect(calculatePVObligationSurvival(totalPV, discount, none)).toBe(Infinity)
})

test('pv survival denominator responds to goal/liability toggles', () => {
  const goalsPV = 12000
  const liabilitiesPV = 2400
  const monthlyPVExpense = 0

  const obligation = (g, l) => {
    const goalsPart = g ? goalsPV / (years * 12) : 0
    const liabPart = l ? liabilitiesPV / (years * 12) : 0
    return monthlyPVExpense + goalsPart + liabPart
  }

  const withGoals = obligation(true, false)
  const withBoth = obligation(true, true)

  expect(withGoals).toBeCloseTo(goalsPV / (years * 12))
  expect(withBoth).toBeCloseTo((goalsPV + liabilitiesPV) / (years * 12))

  const df = Math.pow(1 + discount / 100, 1 / 12)
  const monthsGoals = Math.floor(totalPV / (withGoals * df))
  const monthsBoth = Math.floor(totalPV / (withBoth * df))

  expect(calculatePVObligationSurvival(totalPV, discount, withGoals)).toBe(monthsGoals)
  expect(calculatePVObligationSurvival(totalPV, discount, withBoth)).toBe(monthsBoth)
  expect(monthsBoth).toBeLessThan(monthsGoals)
})
