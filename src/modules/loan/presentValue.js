/**
 * Present value of a series of payments.
 * @param {number[]} flows - payment amounts per period
 * @param {number} rate - period interest rate
 * @returns {number}
 */
export function presentValue(flows, rate) {
  return flows.reduce((sum, p, idx) => sum + p / Math.pow(1 + rate, idx + 1), 0)
}
