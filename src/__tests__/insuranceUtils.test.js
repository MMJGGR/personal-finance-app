/* global test, expect */
import { computeEmergencyFund, computeLifeCover } from '../utils/insuranceUtils'

test('computes emergency fund based on expenses and dependents', () => {
  const amount = computeEmergencyFund(1000, 2) // 3 + 2 months
  expect(amount).toBe(5000)
})

test('life cover uses higher multiplier when married', () => {
  const marriedCover = computeLifeCover(60000, 2, 'married')
  const singleCover = computeLifeCover(60000, 1, 'single')
  expect(marriedCover).toBe(60000 * 12)
  expect(singleCover).toBe(60000 * 7)
})

