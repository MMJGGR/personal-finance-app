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

/**
 * Convert a frequency value to payments per year.
 * Accepts recognized strings or numeric values.
 *
 * @param {string|number} freq - Frequency label or numeric payments per year.
 * @returns {number} Payments per year (0 if invalid).
 */
export function frequencyToPayments(freq) {
  if (typeof freq === 'number') return freq > 0 ? freq : 0;
  const map = { Monthly: 12, Quarterly: 4, Annually: 1 };
  return map[freq] ?? 0;
}


/**
 * Calculate present value of a single future amount.
 *
 * @param {number} amount     - Future cash flow.
 * @param {number} rate       - Annual discount rate (%).
 * @param {number} periods    - Years until payment.
 * @returns {number} Present value.
 */
export function calculateLumpSumPV(amount, rate, periods) {
  const d = rate / 100;
  return amount / Math.pow(1 + d, periods);
}

/**
 * Calculate the constant payment for an amortising loan.
 *
 * @param {number} principal       - Original loan amount.
 * @param {number} annualRate      - Annual interest rate (percent).
 * @param {number} termYears       - Loan term in years.
 * @param {number} paymentsPerYear - Number of payments per year.
 * @returns {number} Payment amount per period.
 */
export function calculateAmortizedPayment(principal, annualRate, termYears, paymentsPerYear) {
  const r = annualRate / 100 / paymentsPerYear;
  const n = termYears * paymentsPerYear;
  if (r === 0) return principal / n;
  return (r * principal) / (1 - Math.pow(1 + r, -n));
}
