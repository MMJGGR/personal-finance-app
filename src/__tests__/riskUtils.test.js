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

test('questionnaire factors influence score', () => {
  const base = {
    age: 30,
    annualIncome: 500000,
    liquidNetWorth: 300000,
    yearsInvesting: 5,
    employmentStatus: 'Employed',
    emergencyFundMonths: 6,
    surveyScore: 40,
  }
  const unemployed = { ...base, employmentStatus: 'Student' }
  const lowLiquidity = { ...base, emergencyFundMonths: 0 }
  expect(calculateRiskScore(unemployed)).toBeLessThan(calculateRiskScore(base))
  expect(calculateRiskScore(lowLiquidity)).toBeLessThan(calculateRiskScore(base))
})

test('deriveCategory boundaries', () => {
  expect(deriveCategory(30)).toBe('conservative')
  expect(deriveCategory(50)).toBe('balanced')
  expect(deriveCategory(80)).toBe('growth')
})

test('example conservative profile', () => {
  const conservative = {
    age: 70,
    annualIncome: 100000,
    liquidNetWorth: 100000,
    yearsInvesting: 0,
    employmentStatus: 'Retired',
    emergencyFundMonths: 12,
    surveyScore: 10
  }
  const score = calculateRiskScore(conservative)
  expect(score).toBeLessThanOrEqual(30)
  expect(deriveCategory(score)).toBe('conservative')
})

test('example growth profile', () => {
  const growth = {
    age: 25,
    annualIncome: 4500000,
    liquidNetWorth: 5000000,
    yearsInvesting: 15,
    employmentStatus: 'Full-Time',
    emergencyFundMonths: 2,
    surveyScore: 50
  }
  const score = calculateRiskScore(growth)
  expect(score).toBeGreaterThanOrEqual(71)
  expect(deriveCategory(score)).toBe('growth')
})
