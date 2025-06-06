/* global test, expect */
import calcDiscretionaryAdvice from '../utils/calcDiscretionaryAdvice'

const expenses = [
  { name: 'Streaming', amount: 10, paymentsPerYear: 12, priority: 3 },
  { name: 'Coffee', amount: 70, paymentsPerYear: 12, priority: 3 },
  { name: 'Gym', amount: 50, paymentsPerYear: 12, priority: 2 }
]

test('suggests low priority cuts sorted by impact', () => {
  const advice = calcDiscretionaryAdvice(expenses, 1000, 100, 20)
  expect(advice.length).toBe(2)
  expect(advice[0].name).toBe('Coffee')
  expect(advice[1].name).toBe('Streaming')
})

test('returns empty when surplus above threshold', () => {
  expect(calcDiscretionaryAdvice(expenses, 1000, 300, 20)).toEqual([])
})
