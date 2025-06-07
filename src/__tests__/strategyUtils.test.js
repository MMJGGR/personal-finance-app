import { deriveStrategy } from '../utils/strategyUtils'

test('risk score boundary at 6 is Conservative', () => {
  expect(deriveStrategy(6, '3–7 years')).toBe('Conservative')
})

test('risk score 7 yields Balanced', () => {
  expect(deriveStrategy(7, '3–7 years')).toBe('Balanced')
})

test('risk score 12 yields Balanced', () => {
  expect(deriveStrategy(12, '3–7 years')).toBe('Balanced')
})

test('risk score above 12 yields Growth', () => {
  expect(deriveStrategy(13, '3–7 years')).toBe('Growth')
})

