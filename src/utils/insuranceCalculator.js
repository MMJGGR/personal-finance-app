/**
 * src/utils/insuranceCalculator.js
 * Functions for calculating various insurance needs.
 */

/**
 * Computes recommended emergency fund amount.
 * @param {number} monthlyExpenses - User's total monthly expenses.
 * @param {number} numDependents - Number of dependents.
 * @returns {number} Recommended emergency fund amount.
 */
export function computeEmergencyFund(monthlyExpenses, numDependents) {
  let months = 3; // Base for single, no dependents
  if (numDependents > 0) {
    months = 6; // More for dependents
  }
  if (monthlyExpenses > 5000) {
    months = 6; // Higher expenses, more buffer
  }
  return monthlyExpenses * months;
}

/**
 * Computes recommended life cover amount.
 * @param {number} annualIncome - User's annual income.
 * @param {number} numDependents - Number of dependents.
 * @param {string} maritalStatus - Marital status (e.g., 'single', 'married').
 * @returns {number} Recommended life cover amount.
 */
export function computeLifeCover(annualIncome, numDependents, maritalStatus) {
  let multiplier = 10; // Base multiplier for income
  if (numDependents > 0) {
    multiplier += numDependents * 2; // Add more for dependents
  }
  if (maritalStatus === 'married') {
    multiplier += 2; // Add more for married
  }
  return annualIncome * multiplier;
}

/**
 * Computes recommended disability insurance coverage.
 * @param {number} annualIncome - User's annual income.
 * @param {number} incomeReplacementRatio - Desired income replacement ratio (e.g., 0.6 for 60%).
 * @returns {number} Recommended annual disability coverage.
 */
export function computeDisabilityCoverage(annualIncome, incomeReplacementRatio = 0.6) {
  return annualIncome * incomeReplacementRatio;
}

/**
 * Computes recommended health insurance coverage.
 * This is a simplified placeholder. Real health insurance needs are complex.
 * @param {number} age - User's age.
 * @param {number} numDependents - Number of dependents.
 * @returns {number} Recommended annual health coverage.
 */
export function computeHealthCoverage(age, numDependents) {
  let base = 50000; // Base annual cost
  if (age > 40) base *= 1.5;
  if (numDependents > 0) base += numDependents * 20000;
  return base;
}

/**
 * Computes recommended long-term care (LTC) insurance coverage.
 * This is a simplified placeholder.
 * @param {number} age - User's age.
 * @returns {number} Recommended annual LTC coverage.
 */
export function computeLTCCoverage(age) {
  let base = 30000; // Base annual cost for LTC
  if (age > 50) base *= 1.5;
  if (age > 65) base *= 2;
  return base;
}

/**
 * Computes recommended property and casualty (P&C) insurance coverage.
 * This is a simplified placeholder.
 * @param {number} homeValue - Value of user's home.
 * @param {number} assetsValue - Value of other significant assets.
 * @returns {number} Recommended annual P&C coverage.
 */
export function computePropertyCasualtyCoverage(homeValue, assetsValue) {
  return homeValue * 0.8 + assetsValue * 0.1; // Example: 80% of home value, 10% of other assets
}
