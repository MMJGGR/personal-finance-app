/**
 * @typedef {Object} LoanInput
 * @property {number} principal      Original loan amount
 * @property {number} annualRate     Annual interest rate (e.g. 0.045 for 4.5%)
 * @property {number} termYears      Term of the loan in years
 * @property {number} [extraPayment] Optional extra payment per month
 */

/**
 * @typedef {Object} Payment
 * @property {string} date           ISO string date of payment
 * @property {number} payment        Total payment amount
 * @property {number} principalPaid  Portion applied to principal
 * @property {number} interestPaid   Portion applied to interest
 * @property {number} balance        Remaining loan balance
 */

/**
 * @typedef {Object} LoanSchedule
 * @property {Payment[]} payments    Array of payments in order
 * @property {number} totalInterest  Total interest paid over life
 * @property {number} pvLiability    Present value of all payments
 */
export {}
