import { calculateAmortizedPayment } from './financeUtils'
import { calculateNominalSurvival, calculatePVSurvival } from './survivalMetrics'
import { calculateRiskScore, deriveCategory } from './riskUtils'

export function computeMonthlySurplus(monthlyIncome = 0, monthlyExpenses = 0) {
  return monthlyIncome - monthlyExpenses
}

export function computeSurvivalMetrics(totalPV = 0, monthlyExpense = 0, discountRate = 0, years = 1) {
  return {
    nominal: calculateNominalSurvival(totalPV, discountRate, years, monthlyExpense),
    pv: calculatePVSurvival(totalPV, discountRate, monthlyExpense, years)
  }
}

export function liabilityDetailsFrom(loans = []) {
  if (!Array.isArray(loans)) return []
  return loans.map(l => {
    const payment =
      l.computedPayment ??
      l.payment ??
      calculateAmortizedPayment(l.principal, l.interestRate, l.termYears, l.paymentsPerYear)
    return { name: l.name || 'Loan', payment, ...l }
  })
}

export function computeDTI(monthlyDebt = 0, monthlyIncome = 0) {
  return monthlyIncome > 0 ? monthlyDebt / monthlyIncome : 0
}

export function computeRiskFromProfile(profile = {}) {
  const score = calculateRiskScore(profile)
  return deriveCategory(score)
}

export function generateLoanAdvice(loans = [], profile = {}, income = 0, expenses = 0, discountRate = 0, years = 1) {
  const liabilityDetails = liabilityDetailsFrom(loans)
  const monthlyDebt = liabilityDetails.reduce((s, l) => s + l.payment, 0)
  const monthlySurplus = computeMonthlySurplus(income, expenses) - monthlyDebt
  const dti = computeDTI(monthlyDebt, income)
  const risk = computeRiskFromProfile(profile)
  const survival = computeSurvivalMetrics(profile.totalPV ?? 0, expenses, discountRate, years)
  return { liabilityDetails, monthlySurplus, dti, risk, survival }
}

export default generateLoanAdvice
