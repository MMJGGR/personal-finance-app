export function defaultExpenses(start, end) {
  return [
    {
      name: 'Rent',
      amount: 1200,
      paymentsPerYear: 12,
      growth: 0,
      category: 'Fixed',
      priority: 1,
      startYear: start,
      endYear: end,
    },
    {
      name: 'Groceries',
      amount: 300,
      paymentsPerYear: 12,
      growth: 0,
      category: 'Variable',
      priority: 2,
      startYear: start,
      endYear: end,
    },
  ]
}

export function defaultGoals(start) {
  return [
    {
      name: 'Vacation',
      amount: 5000,
      targetYear: start + 1,
      startYear: start,
      endYear: start + 1,
    },
  ]
}

export function defaultLiabilities(start) {
  return [
    {
      name: 'Car Loan',
      principal: 10000,
      interestRate: 5,
      termYears: 5,
      paymentsPerYear: 12,
      extraPayment: 0,
      startYear: start,
      endYear: start + 4,
    },
  ]
}
