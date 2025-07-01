/**
 * Suggests expense optimizations based on discretionary spending and a defined threshold.
 * @param {Array} expensesList - List of all expenses.
 * @param {number} monthlySurplusNominal - Current monthly surplus (income - essential expenses).
 * @param {number} discretionaryCutThreshold - Percentage threshold for discretionary cuts (e.g., 0.1 for 10%).
 * @returns {Array} List of suggested expense cuts.
 */
export function suggestExpenseOptimizations(expensesList, monthlySurplusNominal, discretionaryCutThreshold) {
  const suggestions = [];
  const discretionaryExpenses = expensesList.filter(exp => exp.priority === 3); // Assuming priority 3 is discretionary

  // Sort discretionary expenses by amount in descending order
  discretionaryExpenses.sort((a, b) => b.amount - a.amount);

  let currentMonthlySurplus = monthlySurplusNominal;

  for (const expense of discretionaryExpenses) {
    const monthlyAmount = expense.amount * (expense.paymentsPerYear / 12);
    const cutAmount = monthlyAmount * discretionaryCutThreshold;

    if (cutAmount > 0 && currentMonthlySurplus < 0) {
      // Only suggest cuts if there's a deficit
      suggestions.push({
        name: expense.name,
        amount: cutAmount,
        reason: `Reduce by ${discretionaryCutThreshold * 100}% to improve cashflow.`,
      });
      currentMonthlySurplus += cutAmount; // Simulate the impact of the cut
    }
  }

  return suggestions;
}
