/**
 * Utility functions for basic insurance needs calculations.
 */

/**
 * Estimate an emergency fund based on monthly expenses and number of dependents.
 * The recommended months of coverage is 3 plus one month for each dependent.
 *
 * @param {number} monthlyExpense - Typical monthly living expense.
 * @param {number} numDependents  - Number of financial dependents.
 * @returns {number} Suggested emergency fund amount.
 */
export function computeEmergencyFund(monthlyExpense = 0, numDependents = 0) {
  const expense = Math.max(0, parseFloat(monthlyExpense) || 0)
  const dependents = Math.max(0, parseInt(numDependents, 10) || 0)
  const months = 3 + dependents
  return expense * months
}

/**
 * Estimate life cover (insurance) based on income, dependents and marital status.
 * Married individuals generally need more coverage.
 *
 * Base multiplier is 10× annual income when married and 6× when single.
 * Each dependent adds one additional year of income.
 *
 * @param {number} annualIncome   - Gross annual income.
 * @param {number} numDependents  - Number of dependents.
 * @param {string} maritalStatus  - 'single' or 'married'.
 * @returns {number} Suggested life cover amount.
 */
export function computeLifeCover(
  annualIncome = 0,
  numDependents = 0,
  maritalStatus = 'single'
) {
  const income = Math.max(0, parseFloat(annualIncome) || 0)
  const dependents = Math.max(0, parseInt(numDependents, 10) || 0)
  const baseMultiplier = maritalStatus === 'married' ? 10 : 6
  const years = baseMultiplier + dependents
  return income * years
}
