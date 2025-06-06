export function calculateNominalSurvival(totalIncomePV, discountRate, years, monthlyExpense) {
  const r = discountRate / 100 / 12
  const n = years * 12
  const annuityFactor = r === 0 ? n : (1 - Math.pow(1 + r, -n)) / r
  const monthlyIncomeEquivalent = annuityFactor > 0 ? totalIncomePV / annuityFactor : 0
  return monthlyExpense > 0 ? Math.floor(monthlyIncomeEquivalent / monthlyExpense) : 0
}

export function calculatePVSurvival(totalIncomePV, discountRate, monthlyExpense, years) {
  if (monthlyExpense <= 0) return 0
  const r = discountRate / 100 / 12
  if (r === 0) return Math.floor(totalIncomePV / monthlyExpense)
  const ratio = (totalIncomePV * r) / monthlyExpense
  if (ratio >= 1) return years * 12
  const n = -Math.log(1 - ratio) / Math.log(1 + r)
  return Math.floor(n)
}
