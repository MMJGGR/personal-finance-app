import { deriveStrategy } from '../utils/strategyUtils'

test('risk score boundary at 30 is Conservative', () => {
  expect(deriveStrategy(30, '3–7 years')).toBe('Conservative')
})

test('risk score 31 yields Balanced', () => {
  expect(deriveStrategy(31, '3–7 years')).toBe('Balanced')
})

test('risk score 70 yields Balanced', () => {
  expect(deriveStrategy(70, '3–7 years')).toBe('Balanced')
})

test('risk score above 70 yields Growth', () => {
  expect(deriveStrategy(71, '3–7 years')).toBe('Growth')
})

