import { calculateAmortizedPayment } from '../../utils/financeUtils.js'

export function defaultExpenses(start, end) {
  return [
    {
      id: crypto.randomUUID(),
      name: 'Rent',
      amount: 1200,
      frequency: 'Monthly',
      paymentsPerYear: 12,
      growth: 0,
      category: 'Fixed',
      priority: 1,
      include: true,
      startYear: start,
      endYear: end,
    },
    {
      id: crypto.randomUUID(),
      name: 'Groceries',
      amount: 300,
      frequency: 'Monthly',
      paymentsPerYear: 12,
      growth: 0,
      category: 'Variable',
      priority: 2,
      include: true,
      startYear: start,
      endYear: end,
    },
    {
      id: crypto.randomUUID(),
      name: 'Miscellaneous',
      amount: 100,
      frequency: 'Monthly',
      paymentsPerYear: 12,
      growth: 0,
      category: 'Other',
      priority: 3,
      include: true,
      startYear: start,
      endYear: end,
    },
  ]
}

export function defaultGoals(start) {
  return [
    {
      id: crypto.randomUUID(),
      name: 'Vacation',
      amount: 5000,
      targetYear: start + 1,
      startYear: start,
      endYear: start + 1,
    },
  ]
}

export function defaultLiabilities(start) {
  const base = {
    id: crypto.randomUUID(),
    name: 'Car Loan',
    principal: 10000,
    interestRate: 5,
    termYears: 5,
    paymentsPerYear: 12,
    extraPayment: 0,
    include: true,
    startYear: start,
    endYear: start + 4,
  }
  const computedPayment = calculateAmortizedPayment(
    base.principal,
    base.interestRate,
    base.termYears,
    base.paymentsPerYear
  )
  return [{ ...base, computedPayment }]
}
