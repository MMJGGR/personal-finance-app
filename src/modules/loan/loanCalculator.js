/**
 * src/modules/loan/loanCalculator.js
 * Functions for calculating loan schedules and payments.
 */

/**
 * Calculates the constant payment for an amortizing loan.
 *
 * @param {number} principal - The principal loan amount.
 * @param {number} annualRate - The annual interest rate (as a decimal, e.g., 0.05 for 5%).
 * @param {number} termYears - The loan term in years.
 * @param {number} paymentsPerYear - The number of payments per year.
 * @returns {number} The payment amount per period.
 */
export function calculateAmortizedPayment(principal, annualRate, termYears, paymentsPerYear) {
  const r = annualRate / paymentsPerYear;
  const n = termYears * paymentsPerYear;
  if (r === 0) return principal / n;
  return (r * principal) / (1 - Math.pow(1 + r, -n));
}

/**
 * Generates a loan amortization schedule.
 *
 * @param {object} options - Loan options.
 * @param {number} options.principal - The principal loan amount.
 * @param {number} options.annualRate - The annual interest rate (as a decimal).
 * @param {number} options.termYears - The loan term in years.
 * @param {number} options.paymentsPerYear - The number of payments per year.
 * @param {number} [options.extraPayment=0] - Optional extra payment per period.
 * @param {number} [startDate=Date.now()] - The start date of the loan (timestamp).
 * @returns {object} An object containing the total interest, total principal, and the payment schedule.
 */
export function calculateLoanSchedule(options, startDate = Date.now()) {
  let { principal, annualRate, termYears, paymentsPerYear, extraPayment = 0 } = options;
  const monthlyRate = annualRate / paymentsPerYear;
  let balance = principal;
  const payments = [];
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;

  const payment = calculateAmortizedPayment(principal, annualRate, termYears, paymentsPerYear);

  let currentDate = new Date(startDate);

  for (let i = 1; i <= termYears * paymentsPerYear; i++) {
    if (balance <= 0) break;

    const interestPayment = balance * monthlyRate;
    let principalPayment = payment - interestPayment;

    // Apply extra payment
    principalPayment += extraPayment;

    // Ensure principal payment does not exceed remaining balance
    if (principalPayment > balance) {
      principalPayment = balance;
    }

    balance -= principalPayment;
    totalInterestPaid += interestPayment;
    totalPrincipalPaid += principalPayment;

    payments.push({
      paymentNumber: i,
      date: currentDate.getTime(),
      payment: payment + extraPayment,
      principalPaid: principalPayment,
      interestPaid: interestPayment,
      balance: balance,
    });

    // Advance date by one payment period
    currentDate.setMonth(currentDate.getMonth() + (12 / paymentsPerYear));
  }

  return {
    totalInterestPaid,
    totalPrincipalPaid,
    payments,
  };
}