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
    { year: 2020, amount: 1200, offset: 1 },
    { year: 2021, amount: 1200 * 1.05, offset: 2 },
    { year: 2022, amount: 1200 * Math.pow(1.05, 2), offset: 3 }
  ]
  expect(flows).toEqual(expected)
})

test('generateRecurringFlows applies monthDue to offset', () => {
  const year = 2024
  const flows = generateRecurringFlows({
    amount: 1000,
    frequency: 'Annually',
    monthDue: 7,
    startYear: year,
    endYear: year
  })
  expect(flows[0].offset).toBeCloseTo(0.5)
})

test('monthDue offset affects present value', () => {
  const year = 2024
  const rate = 10
  const flows = generateRecurringFlows({
    amount: 1000,
    frequency: 'Annually',
    monthDue: 7,
    startYear: year,
    endYear: year
  })
  const pv = flows.reduce((s, f) => s + f.amount / Math.pow(1 + rate / 100, f.offset), 0)
  const expected = 1000 / Math.pow(1 + rate / 100, 0.5)
  expect(pv).toBeCloseTo(expected)
})
