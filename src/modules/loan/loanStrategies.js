/**
 * src/modules/loan/loanStrategies.js
 * Functions for suggesting loan strategies.
 */

import { calculateLoanSchedule } from './loanCalculator';

/**
 * Suggests loan strategies based on current liabilities and financial goals.
 * @param {Array} liabilitiesList - List of current liabilities.
 * @returns {Array} List of suggested loan strategies.
 */
export function suggestLoanStrategies(liabilitiesList) {
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
