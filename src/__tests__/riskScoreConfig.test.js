/* global test, expect */
import { riskScoreMap } from '../riskScoreConfig'

test('riskScoreMap exposes expected categories', () => {
  const keys = Object.keys(riskScoreMap).sort()
  expect(keys).toEqual(['goal', 'horizon', 'knowledge', 'response'].sort())
})
