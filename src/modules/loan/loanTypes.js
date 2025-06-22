/**
 * @typedef {Object} LoanInput
 * @property {number} principal - loan amount
 * @property {number} annualRate - annual interest rate (decimal)
 * @property {number} termYears - term in years
 * @property {number} paymentsPerYear - payment frequency per year
 * @property {number} [extraPayment] - optional extra payment each period
 */

/**
 * @typedef {Object} Payment
 * @property {string} date - ISO date of payment
 * @property {number} payment - total payment
 * @property {number} principalPaid - principal portion
 * @property {number} interestPaid - interest portion
 * @property {number} balance - remaining balance
 */

/**
 * @typedef {Object} LoanSchedule
 * @property {Payment[]} payments
 * @property {number} totalInterest
 * @property {number} pvLiability
 */
