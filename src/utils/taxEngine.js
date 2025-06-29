// src/utils/taxEngine.js

// Kenyan PAYE Tax Brackets (as of latest available information, subject to change)
// This is a simplified representation for demonstration purposes.
// Actual tax calculations can be more complex with various reliefs and deductions.
const KENYAN_PAYE_TAX_BRACKETS = [
  { min: 0, max: 24000, rate: 0.10 }, // Up to KSh 24,000
  { min: 24001, max: 32333, rate: 0.25 }, // KSh 24,001 to KSh 32,333
  { min: 32334, max: 500000, rate: 0.30 }, // KSh 32,334 to KSh 500,000
  { min: 500001, max: 800000, rate: 0.325 }, // KSh 500,001 to KSh 800,000
  { min: 800001, max: Infinity, rate: 0.35 }, // Above KSh 800,000
];

const PENSION_RELIEF_LIMIT_MONTHLY = 30000; // KSh 30,000 per month
const PENSION_RELIEF_PERCENTAGE_OF_INCOME = 0.30; // 30% of pensionable income

/**
 * Calculates the monthly PAYE (Pay As You Earn) tax for a given taxable income.
 * Applies Kenyan tax brackets and pension contribution relief.
 * @param {number} monthlyTaxableIncome - The income subject to PAYE before tax relief.
 * @param {number} monthlyPensionContribution - The employee's monthly pension contribution (NSSF + private).
 * @returns {number} The calculated monthly PAYE.
 */
export function calculatePAYE(monthlyTaxableIncome, monthlyPensionContribution) {
  let taxReliefAmount = 0;

  // Calculate pension contribution relief
  const actualPensionRelief = Math.min(
    monthlyPensionContribution,
    PENSION_RELIEF_LIMIT_MONTHLY,
    monthlyTaxableIncome * PENSION_RELIEF_PERCENTAGE_OF_INCOME
  );
  taxReliefAmount = actualPensionRelief;

  let taxBeforeRelief = 0;
  let remainingIncome = monthlyTaxableIncome;

  for (const bracket of KENYAN_PAYE_TAX_BRACKETS) {
    if (remainingIncome <= 0) break;

    const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min + 1);
    taxBeforeRelief += taxableInBracket * bracket.rate;
    remainingIncome -= taxableInBracket;
  }

  // Apply personal relief (simplified, typically KSh 2,400 per month)
  const personalRelief = 2400;
  let finalTax = taxBeforeRelief - personalRelief - taxReliefAmount;

  return Math.max(0, finalTax);
}
