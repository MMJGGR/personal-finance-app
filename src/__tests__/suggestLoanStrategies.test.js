/* global test, expect */
import suggestLoanStrategies from '../utils/suggestLoanStrategies'

const sampleLoans = [
  { name: 'Low',  principal: 1000, interestRate: 5,  termYears: 1, paymentsPerYear: 12 },
  { name: 'High', principal: 1000, interestRate: 10, termYears: 1, paymentsPerYear: 12 }
]

test('loans ranked by potential interest savings', () => {
  const result = suggestLoanStrategies(sampleLoans)
  expect(result[0].name).toBe('High')
  expect(result[1].name).toBe('Low')
  expect(result[0].interestSaved).toBeGreaterThan(result[1].interestSaved)
})

test('handles empty input', () => {
  expect(suggestLoanStrategies([])).toEqual([])
})
