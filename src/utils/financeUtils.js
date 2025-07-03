/**
 * src/utils/financeUtils.js
 * Shared financial formulas for present-value and related calculations.
 */

import { FREQUENCIES } from '../constants'

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
  if (typeof freq === 'number') return freq > 0 ? freq : 0
  // FREQUENCIES maps labels to payments per year
  return FREQUENCIES[freq] ?? 0
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

/**
 * Calculate the net present value of an amortising loan using a discount rate.
 *
 * @param {number} principal       - Original or remaining loan balance.
 * @param {number} annualRate      - Loan interest rate (percent).
 * @param {number} termYears       - Years until the loan is repaid.
 * @param {number} paymentsPerYear - Number of payments each year.
 * @param {number} discountRate    - Discount rate to value the cash flows (percent).
 * @returns {number} Net present value of the loan.
 */
export function calculateLoanNPV(
  principal,
  annualRate,
  termYears,
  paymentsPerYear,
  discountRate
) {
  const payment = calculateAmortizedPayment(
    principal,
    annualRate,
    termYears,
    paymentsPerYear
  );
  const n = termYears * paymentsPerYear;
  const d = discountRate / 100 / paymentsPerYear;

  const pvPayments = d === 0
    ? payment * n
    : payment * (1 - Math.pow(1 + d, -n)) / d;

  return pvPayments - principal;
}

/**
 * Estimate the future value of a present amount using annual compounding.
 *
 * @param {number} amount - Present value.
 * @param {number} rate   - Annual growth rate (percent).
 * @param {number} years  - Number of years to compound.
 * @returns {number} Future value after compounding.
 */
export function estimateFutureValue(amount, rate, years) {
  const r = rate / 100
  return amount * Math.pow(1 + r, years)
}

/**
 * Discount a future amount back to today's value using annual compounding.
 *
 * @param {number} amount - Future value to discount.
 * @param {number} rate   - Annual discount rate (percent).
 * @param {number} years  - Years until the amount is received.
 * @returns {number} Present value of the future amount.
 */
export function discountToPresent(amount, rate, years) {
  const r = rate / 100
  return amount / Math.pow(1 + r, years)
}

/**
 * Compute the internal rate of return for a series of cash flows.
 *
 * Cash flows are assumed to occur at equal time intervals with the
 * first value representing the initial investment (typically negative).
 * The function returns the annualized rate in percent.
 *
 * @param {number[]} cashFlows - Ordered list of cash flow amounts.
 * @returns {number} Internal rate of return as a percentage, or NaN if
 *                   the calculation cannot converge.
 */
export function internalRateOfReturn(cashFlows = []) {
  if (!Array.isArray(cashFlows) || cashFlows.length < 2) return NaN
  let hasPositive = false
  let hasNegative = false
  for (const cf of cashFlows) {
    if (cf > 0) hasPositive = true
    if (cf < 0) hasNegative = true
  }
  if (!hasPositive || !hasNegative) return NaN
  let rate = 0.1 // initial guess (10%)
  for (let i = 0; i < 100; i++) {
    let npv = 0
    let deriv = 0
    for (let t = 0; t < cashFlows.length; t++) {
      const cf = cashFlows[t]
      const denom = Math.pow(1 + rate, t)
      npv += cf / denom
      if (t > 0) {
        deriv -= t * cf / (denom * (1 + rate))
      }
    }
    const newRate = rate - npv / deriv
    if (!Number.isFinite(newRate)) return NaN
    if (Math.abs(newRate - rate) < 1e-7) return newRate * 100
    rate = newRate
  }
  return rate * 100
}

/**
 * Present value of a series of periodic cash flows.
 *
 * @param {number[]} flows - Payment amounts occurring at the end of each period.
 * @param {number} rate    - Periodic discount rate as a decimal (e.g. 0.01 for 1%).
 * @returns {number} Present value of the cash flow series.
 */
export function presentValue(flows = [], rate = 0) {
  if (!Array.isArray(flows) || flows.length === 0) return 0
  let pv = 0
  for (let i = 0; i < flows.length; i++) {
    pv += flows[i] / Math.pow(1 + rate, i + 1)
  }
  return pv
}

/**
 * Generate annual cash flows for a recurring stream.
 *
 * @param {Object} stream               - Stream definition.
 * @param {number} stream.amount        - Payment amount per period.
 * @param {string|number} stream.frequency - Frequency label or payments per year.
 * @param {number} stream.paymentsPerYear  - Explicit payments per year (overrides frequency).
 * @param {number} [stream.growth=0]    - Annual growth rate (percent).
 * @param {number} stream.startYear     - First calendar year of the stream.
 * @param {number} stream.endYear       - Last calendar year of the stream.
 * @returns {{year:number, amount:number}[]} Array of yearly cash flows.
 */
export function generateRecurringFlows(stream = {}) {
  const {
    amount = 0,
    frequency,
    paymentsPerYear,
    monthDue = 1,
    growth = 0,
    startYear = new Date().getFullYear(),
    endYear = startYear,
  } = stream

  const ppy = typeof paymentsPerYear === 'number'
    ? paymentsPerYear
    : frequencyToPayments(frequency) || 1

  const flows = []
  for (let year = startYear; year <= endYear; year++) {
    const idx = year - startYear
    const cash = amount * ppy * Math.pow(1 + growth / 100, idx)
    const offset = ppy === 12
      ? idx + 1
      : idx + (monthDue - 1) / 12
    flows.push({ year, amount: cash, offset })
  }
  return flows
}

/**
 * Placeholder for NSSF calculation.
 * @param {number} grossSalary - The gross salary.
 * @returns {object} An object containing employee and employer contributions.
 */
export function calculateNSSF(grossSalary) {
  // Simplified placeholder logic
  const employeeContribution = Math.min(grossSalary * 0.06, 1080); // Example: 6% up to a cap
  const employerContribution = employeeContribution; // Often matched by employer
  return { employeeContribution, employerContribution };
}

/**
 * Placeholder for PAYE (Pay As You Earn) calculation.
 * @param {number} taxableIncome - The taxable income.
 * @param {number} totalPensionContribution - Total pension contributions.
 * @returns {number} The calculated PAYE.
 */
export function calculatePAYE(taxableIncome) {
  // Simplified placeholder logic
  let paye = 0;
  if (taxableIncome > 24000) {
    paye = (taxableIncome - 24000) * 0.3; // Example: 30% for income above 24000
  }
  return paye;
}