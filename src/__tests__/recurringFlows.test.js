/* global test, expect */
import { presentValue, generateRecurringFlows } from '../utils/financeUtils'

// presentValue tests

test('presentValue discounts each period', () => {
  const flows = [100, 100, 100]
  const rate = 0.1
  const expected = flows.reduce((s, p, i) => s + p / Math.pow(1 + rate, i + 1), 0)
  expect(presentValue(flows, rate)).toBeCloseTo(expected)
})

// generateRecurringFlows tests

test('generateRecurringFlows creates annual amounts with growth', () => {
  const start = 2020
  const end = 2022
  const flows = generateRecurringFlows({
    amount: 100,
    frequency: 12,
    growth: 5,
    startYear: start,
    endYear: end
  })
  const expected = [
    { year: 2020, amount: 1200 },
    { year: 2021, amount: 1200 * 1.05 },
    { year: 2022, amount: 1200 * Math.pow(1.05, 2) }
  ]
  expect(flows).toEqual(expected)
})
