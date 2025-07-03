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

/**
 * Calculate expected monthly pension income at retirement.
 * A simple heuristic is applied until the full engine is implemented.
 *
 * @param {Object} params
 * @param {number} params.amount - Contribution amount per period.
 * @param {number} params.duration - Number of years contributions are made.
 * @param {'Monthly'|'Annually'} params.frequency - Contribution frequency.
 * @param {number} params.expectedReturn - Expected annual growth rate.
 * @param {'Annuity'|'Self-Managed'} params.pensionType - Selected pension type.
 * @param {number} [params.annuityRate=0.05] - Annuity payout rate if applicable.
 * @param {number} [params.startYear] - Calendar year contributions begin.
 * @param {number} [params.retirementAge=65] - Planned retirement age.
 * @param {number} [params.currentAge=30] - Current age of the contributor.
 * @param {number} [params.lifeExpectancy=85] - Expected lifespan.
 * @returns {{futureValue:number, monthlyIncome:number, incomeStream:Array}}
 */
export function calculatePensionIncome({
  amount,
  duration,
  frequency,
  expectedReturn,
  pensionType,
  annuityRate = 0.05,
  startYear = new Date().getFullYear(),
  retirementAge = 65,
  currentAge = 30,
  lifeExpectancy = 85,
}) {
  const currentCalendarYear = new Date().getFullYear();
  const retirementYear = currentCalendarYear + (retirementAge - currentAge);
  if (startYear > retirementYear) {
    return { futureValue: 0, monthlyIncome: 0, incomeStream: [], error: 'Start year after retirement' };
  }

  const years = Math.max(0, Math.min(duration, retirementAge - currentAge));
  const annualContribution = amount * (frequency === 'Monthly' ? 12 : 1);
  const rate = expectedReturn / 100;
  let futureValue = 0;
  for (let i = 0; i < years; i++) {
    futureValue = (futureValue + annualContribution) * (1 + rate);
  }

  let monthlyIncome;
  if (pensionType === 'Annuity') {
    monthlyIncome = (futureValue * annuityRate) / 12;
  } else {
    monthlyIncome = (futureValue * 0.04) / 12; // basic SWR approximation
  }

  const annualIncome = monthlyIncome * 12;
  const incomeYears = lifeExpectancy - retirementAge + 1;
  const incomeStream = Array.from({ length: incomeYears }, (_, idx) => ({
    year: retirementYear + idx,
    amount: annualIncome,
  }));

  return { futureValue, monthlyIncome, incomeStream };
}
