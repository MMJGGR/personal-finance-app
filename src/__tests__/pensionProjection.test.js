import { calculatePensionIncome } from '../utils/pensionProjection.js'

test('annuity vs drawdown produce different income', () => {
  const base = {
    amount: 1000,
    duration: 10,
    frequency: 'Monthly',
    expectedReturn: 5,
    startYear: 2024,
    retirementAge: 65,
    currentAge: 55,
    lifeExpectancy: 85,
  }
  const ann = calculatePensionIncome({ ...base, pensionType: 'Annuity', annuityRate: 0.06 })
  const draw = calculatePensionIncome({ ...base, pensionType: 'Self-Managed' })
  expect(ann.futureValue).toBeCloseTo(draw.futureValue)
  expect(ann.monthlyIncome).not.toBeCloseTo(draw.monthlyIncome)
})

test('start year after retirement triggers error', () => {
  const res = calculatePensionIncome({
    amount: 500,
    duration: 5,
    frequency: 'Monthly',
    expectedReturn: 5,
    pensionType: 'Annuity',
    startYear: 2040,
    retirementAge: 60,
    currentAge: 50,
    lifeExpectancy: 80,
  })
  expect(res.error).toMatch(/after retirement/)
})
