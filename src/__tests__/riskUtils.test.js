/* global test, expect */
import { calculateRiskScore, deriveCategory } from '../utils/riskUtils'

test('calculates score and category from profile', () => {
  const profile = {
    birthDate: '1990-01-01',
    annualIncome: 500000,
    netWorth: 300000,
    yearsInvesting: 5,
    employmentStatus: 'Employed',
    emergencyFundMonths: 6,
    surveyScore: 40,
  }
  const score = calculateRiskScore(profile)
  expect(score).toBe(41)
  expect(deriveCategory(score)).toBe('balanced')
})

test('age and liquid net worth influence score', () => {
  const base = {
    age: 30,
    annualIncome: 500000,
    liquidNetWorth: 300000,
    yearsInvesting: 5,
    employmentStatus: 'Employed',
    emergencyFundMonths: 6,
    surveyScore: 40,
  }
  const younger = { ...base, age: 20 }
  const older = { ...base, age: 60 }
  const lowerNW = { ...base, liquidNetWorth: 100000 }
  const higherNW = { ...base, liquidNetWorth: 1000000 }

  expect(calculateRiskScore(older)).toBeGreaterThan(calculateRiskScore(younger))
  expect(calculateRiskScore(higherNW)).toBeGreaterThan(calculateRiskScore(lowerNW))
})

test('deriveCategory boundaries', () => {
  expect(deriveCategory(30)).toBe('conservative')
  expect(deriveCategory(50)).toBe('balanced')
  expect(deriveCategory(80)).toBe('growth')
})
