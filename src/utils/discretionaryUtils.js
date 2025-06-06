export default function calcDiscretionaryAdvice(expenses = [], monthlyExpense = 0, monthlySurplus = 0, thresholdPercent = 0) {
  if (!Array.isArray(expenses) || expenses.length === 0) return []
  const thresholdAmt = (thresholdPercent / 100) * monthlyExpense
  const deficit = thresholdAmt - monthlySurplus
  if (deficit <= 0) return []
  const lowPriority = expenses
    .filter(e => e.priority === 3)
    .map(e => ({
      name: e.name || 'Expense',
      monthly: (parseFloat(e.amount) || 0) * (e.paymentsPerYear || 0) / 12
    }))
    .sort((a, b) => b.monthly - a.monthly)
  const suggestions = []
  let saved = 0
  for (const item of lowPriority) {
    if (saved >= deficit) break
    suggestions.push({ name: item.name, amount: item.monthly })
    saved += item.monthly
  }
  return suggestions
}

