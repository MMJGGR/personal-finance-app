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
    investmentKnowledge: 'Moderate',
    lossResponse: 'Wait',
    investmentHorizon: '>7 years',
    investmentGoal: 'Growth',
  }
  const score = calculateRiskScore(profile)
  expect(score).toBe(53)
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
    investmentKnowledge: 'Moderate',
    lossResponse: 'Wait',
    investmentHorizon: '>7 years',
    investmentGoal: 'Growth',
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
    investmentKnowledge: 'Moderate',
    lossResponse: 'Wait',
    investmentHorizon: '>7 years',
    investmentGoal: 'Growth',
  }
  const lowKnowledge = { ...base, investmentKnowledge: 'None' }
  const shortHorizon = { ...base, investmentHorizon: '<3 years' }
  expect(calculateRiskScore(lowKnowledge)).toBeLessThan(calculateRiskScore(base))
  expect(calculateRiskScore(shortHorizon)).toBeLessThan(calculateRiskScore(base))
})

test('deriveCategory boundaries', () => {
  expect(deriveCategory(30)).toBe('conservative')
  expect(deriveCategory(50)).toBe('balanced')
  expect(deriveCategory(80)).toBe('growth')
})
