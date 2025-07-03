/* global test, expect */
import { calculateRiskScore, deriveCategory, computeSurveyScore } from '../utils/riskUtils'

test('calculates score and category from profile', () => {
  const profile = {
    birthDate: '1990-01-01',
    annualIncome: 500000,
    netWorth: 300000,
    yearsInvesting: 5,
    employmentStatus: 'Employed',
    emergencyFundMonths: 6,
    riskSurveyAnswers: Array(10).fill(3),
    investmentKnowledge: 'Moderate',
    lossResponse: 'Wait',
    investmentHorizon: '>7 years',
    investmentGoal: 'Growth',
  }
  const score = calculateRiskScore(profile)
  expect(score).toBe(50)
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
    riskSurveyAnswers: Array(10).fill(3),
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
  expect(calculateRiskScore(higherNW)).toBeGreaterThanOrEqual(calculateRiskScore(lowerNW))
})

test('questionnaire factors influence score', () => {
  const base = {
    age: 30,
    annualIncome: 500000,
    liquidNetWorth: 300000,
    yearsInvesting: 5,
    employmentStatus: 'Employed',
    emergencyFundMonths: 6,
    riskSurveyAnswers: Array(10).fill(3),
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

test('example conservative profile', () => {
  const conservative = {
    age: 70,
    annualIncome: 100000,
    liquidNetWorth: 100000,
    yearsInvesting: 0,
    employmentStatus: 'Retired',
    emergencyFundMonths: 12,
    riskSurveyAnswers: Array(10).fill(1),
    investmentKnowledge: 'None',
    lossResponse: 'Sell',
    investmentHorizon: '<3 years',
    investmentGoal: 'Preservation'
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
    riskSurveyAnswers: Array(10).fill(5),
    investmentKnowledge: 'Advanced',
    lossResponse: 'BuyMore',
    investmentHorizon: '>7 years',
    investmentGoal: 'Growth'
  }
  const score = calculateRiskScore(growth)
  expect(score).toBeGreaterThanOrEqual(65)
  expect(deriveCategory(score)).toBe('balanced')
})

test('computeSurveyScore normalizes answers', () => {
  expect(computeSurveyScore(Array(5).fill(1))).toBe(0)
  expect(computeSurveyScore(Array(5).fill(5))).toBe(100)
  expect(computeSurveyScore([3,3,3,3,3])).toBe(50)
})

test('ignore undefined survey answers', () => {
  const base = {
    age: 30,
    annualIncome: 500000,
    liquidNetWorth: 300000,
    yearsInvesting: 5,
    employmentStatus: 'Employed',
    emergencyFundMonths: 6,
    investmentKnowledge: 'Moderate',
    lossResponse: 'Wait',
    investmentHorizon: '>7 years',
    investmentGoal: 'Growth',
  }
  const partial = { ...base, riskSurveyAnswers: [5, undefined, 5] }
  const complete = { ...base, riskSurveyAnswers: [5, 5] }
  expect(calculateRiskScore(partial)).toBe(calculateRiskScore(complete))
})

test('handles malformed numeric fields', () => {
  const messy = {
    age: 'thirty',
    annualIncome: '100,000',
    netWorth: '200,000',
    yearsInvesting: 'two',
    employmentStatus: 'Employed',
    emergencyFundMonths: 'six',
    riskSurveyAnswers: Array(10).fill(3),
    investmentKnowledge: 'Moderate',
    lossResponse: 'Wait',
    investmentHorizon: '>7 years',
    investmentGoal: 'Growth',
  }
  const score = calculateRiskScore(messy)
  expect(score).toBeGreaterThan(0)
})
