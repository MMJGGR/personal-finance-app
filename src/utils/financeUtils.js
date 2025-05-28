/**
 * src/utils/financeUtils.js
 * Shared financial formulas for present-value and related calculations.
 */

/**
 * Calculate present value of a growing annuity.
 *
 * @param {number} amount        - Payment amount per period.
 * @param {number} frequency     - Number of payments per year.
 * @param {number} growthRate    - Annual growth rate (in percent, e.g. 5 for 5%).
 * @param {number} discountRate  - Discount rate (in percent).
 * @param {number} periods       - Number of years.
 * @returns {number} Present value (in same units as `amount`).
 */
export function calculatePV(amount, frequency, growthRate, discountRate, periods) {
  const A = amount * frequency;
  const g = growthRate / 100;
  const d = discountRate / 100;

  // When growth and discount are equal, avoid division by zero:
  if (Math.abs(d - g) < 1e-8) {
    // PV of level annuity discounted one period
    return A * periods / (1 + d);
  }

  // Standard growing-annuity formula
  return A * (1 - Math.pow((1 + g) / (1 + d), periods)) / (d - g);
}
