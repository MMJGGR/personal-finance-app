// src/utils/nssfCalculator.js

/**
 * Calculates the mandatory NSSF contributions based on Kenyan regulations.
 * As of February 2025, both employees and employers contribute 6% of the employee's salary.
 * Tier I: up to KSh 8,000 (max KSh 480)
 * Tier II: up to KSh 72,000 (max KSh 4,320)
 *
 * @param {number} grossSalary - The employee's gross monthly salary.
 * @returns {{employeeContribution: number, employerContribution: number, totalContribution: number}}
 */
export function calculateNSSF(grossSalary) {
  const lowerEarningsLimit = 8000;
  const upperEarningsLimit = 72000;
  const contributionRate = 0.06; // 6%

  let employeeContribution = 0;
  let employerContribution = 0;

  // Tier I calculation
  const tier1Amount = Math.min(grossSalary, lowerEarningsLimit);
  employeeContribution += tier1Amount * contributionRate;
  employerContribution += tier1Amount * contributionRate;

  // Tier II calculation (if applicable)
  if (grossSalary > lowerEarningsLimit) {
    const tier2Amount = Math.min(grossSalary, upperEarningsLimit) - lowerEarningsLimit;
    employeeContribution += tier2Amount * contributionRate;
    employerContribution += tier2Amount * contributionRate;
  }

  // Cap contributions at the maximum for the upper earnings limit
  employeeContribution = Math.min(employeeContribution, upperEarningsLimit * contributionRate);
  employerContribution = Math.min(employerContribution, upperEarningsLimit * contributionRate);

  const totalContribution = employeeContribution + employerContribution;

  return {
    employeeContribution: parseFloat(employeeContribution.toFixed(2)),
    employerContribution: parseFloat(employerContribution.toFixed(2)),
    totalContribution: parseFloat(totalContribution.toFixed(2)),
  };
}
