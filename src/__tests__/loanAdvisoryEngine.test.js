/* global test, expect */
import generateLoanAdvice, {
  computeMonthlySurplus,
  computeSurvivalMetrics,
  liabilityDetailsFrom,
  computeDTI,
  computeRiskFromProfile
} from '../utils/loanAdvisoryEngine'
import { calculateNominalSurvival, calculatePVSurvival } from '../utils/survivalMetrics'
import { calculateAmortizedPayment } from '../utils/financeUtils'
import { calculateRiskScore, deriveCategory } from '../utils/riskUtils'

test('computeMonthlySurplus subtracts expenses', () => {
  expect(computeMonthlySurplus(5000, 3000)).toBe(2000)
})

test('computeSurvivalMetrics uses survival formulas', () => {
  const pv = 120000
  const discount = 5
  const years = 10
  const expense = 1000
  const expected = {
    nominal: calculateNominalSurvival(pv, discount, years, expense),
    pv: calculatePVSurvival(pv, discount, expense, years)
  }
  expect(computeSurvivalMetrics(pv, expense, discount, years)).toEqual(expected)
})

test('liabilityDetailsFrom computes payments', () => {
  const loans = [{ principal: 1000, interestRate: 10, termYears: 1, paymentsPerYear: 12 }]
  const result = liabilityDetailsFrom(loans)
  const payment = calculateAmortizedPayment(1000, 10, 1, 12)
  expect(result[0].payment).toBeCloseTo(payment)
})

test('computeDTI ratio', () => {
  expect(computeDTI(500, 1000)).toBe(0.5)
})

test('computeRiskFromProfile uses risk utilities', () => {
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
  const expected = deriveCategory(calculateRiskScore(profile))
  expect(computeRiskFromProfile(profile)).toBe(expected)
})

test('generateLoanAdvice assembles metrics', () => {
  const loans = [{ principal: 1000, interestRate: 5, termYears: 1, paymentsPerYear: 12 }]
  const profile = { age: 40, totalPV: 5000 }
  const advice = generateLoanAdvice(loans, profile, 2000, 1000, 5, 5)
  expect(advice.liabilityDetails).toHaveLength(1)
  expect(advice.dti).toBeGreaterThan(0)
  const expectedRisk = deriveCategory(calculateRiskScore(profile))
  expect(advice.risk).toBe(expectedRisk)
  expect(advice.survival.nominal).toBeDefined()
})
