// src/utils/pensionProjection.js

/**
 * Projects the growth of pension funds over time.
 * Assumes tax-free growth within the pension scheme.
 *
 * @param {number} initialPensionValue - The current value of the pension fund.
 * @param {number} annualContributions - Total annual contributions (NSSF + private).
 * @param {number} expectedReturn - The expected annual growth rate (as a percentage).
 * @param {number} yearsToRetirement - Number of years until retirement.
 * @returns {number} The projected value of the pension fund at retirement.
 */
export function projectPensionGrowth(initialPensionValue, annualContributions, expectedReturn, yearsToRetirement) {
  let futureValue = initialPensionValue;
  const rate = expectedReturn / 100;

  for (let i = 0; i < yearsToRetirement; i++) {
    futureValue = (futureValue + annualContributions) * (1 + rate);
  }

  return futureValue;
}
