/* global test, expect */
import calcDiscretionaryAdvice from '../utils/discretionaryUtils'

const expenses = [
  { name: 'Streaming', amount: 10, frequency: 'Monthly', priority: 3 },
  { name: 'Coffee', amount: 70, frequency: 'Monthly', priority: 3 },
  { name: 'Gym', amount: 50, frequency: 'Monthly', priority: 2 }
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

test('suggestions accumulate until threshold met', () => {
  const moreExpenses = [
    ...expenses,
    { name: 'Snacks', amount: 50, frequency: 'Monthly', priority: 3 }
  ]
  // Surplus 50, threshold 20% of 1000 = 200 -> deficit 150
  const advice = calcDiscretionaryAdvice(moreExpenses, 1000, 50, 20)
  expect(advice.map(a => a.name)).toEqual(['Coffee', 'Snacks', 'Streaming'])
})

test('stops once savings exceed deficit', () => {
  const moreExpenses = [
    { name: 'Takeout', amount: 100, frequency: 'Monthly', priority: 3 },
    ...expenses
  ]
  // Surplus 150, threshold 20% = 200 -> deficit 50, only highest item needed
  const advice = calcDiscretionaryAdvice(moreExpenses, 1000, 150, 20)
  expect(advice).toHaveLength(1)
  expect(advice[0].name).toBe('Takeout')
})
