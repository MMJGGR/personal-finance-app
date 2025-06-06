/* global test, expect */
import InvestmentStrategies, { getStrategyWeights } from '../investmentStrategies'

test('returns strategy weights when found', () => {
  const weights = getStrategyWeights('Conservative')
  expect(weights).toBe(InvestmentStrategies.Conservative)
})

test('returns null for unknown strategy', () => {
  expect(getStrategyWeights('Unknown')).toBeNull()
})
