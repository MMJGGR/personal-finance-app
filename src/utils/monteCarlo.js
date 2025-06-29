// src/utils/monteCarlo.js

/**
 * Generates a random number from a normal distribution using the Box-Muller transform.
 * @param {number} mean - The mean of the distribution.
 * @param {number} stdDev - The standard deviation of the distribution.
 * @returns {number} A random number from the normal distribution.
 */
function randomNormal(mean, stdDev) {
  let u1 = 0, u2 = 0;
  while (u1 === 0) u1 = Math.random(); // Converting [0,1) to (0,1)
  while (u2 === 0) u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean;
}

/**
 * Runs a Monte Carlo simulation for retirement planning.
 * @param {object} params - The parameters for the simulation.
 * @param {number} params.initialPortfolioValue - The starting value of the portfolio.
 * @param {number} params.annualContribution - The amount contributed to the portfolio each year before retirement.
 * @param {number} params.retirementAge - The age at which the user plans to retire.
 * @param {number} params.lifeExpectancy - The user's life expectancy.
 * @param {number} params.age - The user's current age.
 * @param {number} params.expectedReturn - The expected annual return of the portfolio (as a percentage).
 * @param {number} params.standardDeviation - The standard deviation of the portfolio returns (as a percentage).
 * @param {number} params.numSimulations - The number of simulations to run.
 * @param {number} params.retirementIncome - The desired annual income during retirement.
 * @param {number} params.projectedPensionValue - The projected value of the pension fund at retirement age.
 * @returns {object} The results of the simulation, including the success rate and percentile data.
 */
export function runMonteCarloSimulation(params) {
  const {
    initialPortfolioValue,
    annualContribution,
    retirementAge,
    lifeExpectancy,
    age,
    expectedReturn,
    standardDeviation,
    numSimulations,
    retirementIncome,
    projectedPensionValue,
  } = params;

  const yearsToRetirement = retirementAge - age;
  const retirementYears = lifeExpectancy - retirementAge;
  const totalYears = yearsToRetirement + retirementYears;

  let successfulSimulations = 0;
  const allSimulations = [];

  for (let i = 0; i < numSimulations; i++) {
    let portfolioValue = initialPortfolioValue;
    let pensionValue = projectedPensionValue; // Start with projected pension value
    const yearlyData = [{ year: age, value: portfolioValue + pensionValue }]; // Combined value
    let isSuccessful = true;

    for (let j = 0; j < totalYears; j++) {
      const currentYear = age + j + 1;
      const annualReturn = randomNormal(expectedReturn / 100, standardDeviation / 100);

      if (currentYear <= retirementAge) {
        portfolioValue += annualContribution;
      }

      portfolioValue *= 1 + annualReturn;
      pensionValue *= 1 + (expectedReturn / 100); // Pension grows at expectedReturn, tax-free

      if (currentYear > retirementAge) {
        let remainingIncomeNeeded = retirementIncome;

        // First, draw from pension fund
        if (pensionValue > 0) {
          const drawFromPension = Math.min(remainingIncomeNeeded, pensionValue);
          pensionValue -= drawFromPension;
          remainingIncomeNeeded -= drawFromPension;
        }

        // If income still needed, draw from portfolio
        if (remainingIncomeNeeded > 0) {
          portfolioValue -= remainingIncomeNeeded;
        }
      }

      if (portfolioValue < 0) {
        portfolioValue = 0;
        isSuccessful = false;
      }

      yearlyData.push({ year: currentYear, value: portfolioValue + pensionValue }); // Combined value
    }

    if (isSuccessful) {
      successfulSimulations++;
    }

    allSimulations.push(yearlyData);
  }

  const successRate = (successfulSimulations / numSimulations) * 100;

  const percentiles = {};
  const percentileKeys = [10, 25, 50, 75, 90];

  for (let i = 0; i <= totalYears; i++) {
    const year = age + i;
    const yearlyValues = allSimulations.map(sim => sim[i].value).sort((a, b) => a - b);

    percentileKeys.forEach(p => {
      if (!percentiles[p]) percentiles[p] = [];
      const index = Math.floor((p / 100) * yearlyValues.length);
      percentiles[p].push({ year, value: yearlyValues[index] });
    });
  }

  return {
    successRate,
    percentiles,
  };
}