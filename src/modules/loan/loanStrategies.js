/**
 * src/modules/loan/loanStrategies.js
 * Functions for suggesting loan strategies.
 */

import { calculateLoanSchedule, calculateAmortizedPayment } from './loanCalculator';

/**
 * Suggests loan strategies based on current liabilities and financial goals.
 * @param {Array} liabilitiesList - List of current liabilities.
 * @param {number} expectedReturn - Expected return on investments (for comparison).
 * @param {number} currentAge - Current age of the user.
 * @param {number} lifeExpectancy - User's life expectancy.
 * @returns {Array} List of suggested loan strategies.
 */
export function suggestLoanStrategies(liabilitiesList, expectedReturn, currentAge, lifeExpectancy) {
  const strategies = [];

  liabilitiesList.forEach(loan => {
    // Strategy 1: Pay extra to reduce term and interest
    const originalSchedule = calculateLoanSchedule({
      principal: loan.principal,
      annualRate: loan.interestRate / 100,
      termYears: loan.termYears,
      paymentsPerYear: loan.paymentsPerYear,
      extraPayment: 0,
    });

    const extraPaymentAmount = loan.computedPayment * 0.1; // Example: 10% extra payment
    const acceleratedSchedule = calculateLoanSchedule({
      principal: loan.principal,
      annualRate: loan.interestRate / 100,
      termYears: loan.termYears,
      paymentsPerYear: loan.paymentsPerYear,
      extraPayment: extraPaymentAmount,
    });

    const originalTotalInterest = originalSchedule.totalInterestPaid;
    const acceleratedTotalInterest = acceleratedSchedule.totalInterestPaid;
    const interestSaved = originalTotalInterest - acceleratedTotalInterest;

    if (interestSaved > 0) {
      strategies.push({
        name: `Accelerate ${loan.name}`,
        description: `Pay an extra ${extraPaymentAmount.toFixed(2)} per period to save ${interestSaved.toFixed(2)} in interest and reduce the loan term.`,
        interestSaved: interestSaved,
        loanId: loan.id,
      });
    }

    // Strategy 2: Refinance (simplified example)
    const newInterestRate = loan.interestRate - 1; // Example: 1% lower interest rate
    if (newInterestRate > 0) {
      const newPayment = calculateAmortizedPayment(
        loan.principal,
        newInterestRate / 100,
        loan.termYears,
        loan.paymentsPerYear
      );
      const newSchedule = calculateLoanSchedule({
        principal: loan.principal,
        annualRate: newInterestRate / 100,
        termYears: loan.termYears,
        paymentsPerYear: loan.paymentsPerYear,
        extraPayment: 0,
      });
      const newTotalInterest = newSchedule.totalInterestPaid;
      const refinanceInterestSaved = originalTotalInterest - newTotalInterest;

      if (refinanceInterestSaved > 0) {
        strategies.push({
          name: `Refinance ${loan.name}`,
          description: `Refinance at ${newInterestRate}% to save ${refinanceInterestSaved.toFixed(2)} in interest.`,
          interestSaved: refinanceInterestSaved,
          loanId: loan.id,
        });
      }
    }

    // Strategy 3: Debt Snowball/Avalanche (conceptual, requires multiple loans)
    // This would involve prioritizing payments on one loan over others.
    // For a single loan, it's similar to accelerating payments.
  });

  // Sort strategies by interest saved (most impactful first)
  strategies.sort((a, b) => b.interestSaved - a.interestSaved);

  return strategies;
}
