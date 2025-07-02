export function calculateRiskScore({ age = 0, annualIncome = 0, liquidNetWorth = 0, employmentStatus = '', ...profile }) {
  // Basic placeholder weights. In a real app these would be more complex
  let score = 0
  if (typeof age === 'number') score += age < 35 ? 10 : age < 50 ? 20 : 30
  if (typeof annualIncome === 'number') score += annualIncome > 100000 ? 30 : annualIncome > 50000 ? 20 : 10
  if (typeof liquidNetWorth === 'number') score += liquidNetWorth > 100000 ? 30 : liquidNetWorth > 50000 ? 20 : 10
  if (employmentStatus === 'Employed') score += 10
  return Math.min(Math.max(score, 0), 100)
}

export function deriveCategory(score) {
  if (score <= 30) return 'conservative'
  if (score <= 70) return 'balanced'
  return 'growth'
}
