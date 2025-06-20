import { defaultLiabilities } from '../components/ExpensesGoals/defaults'
import { calculateAmortizedPayment } from '../utils/financeUtils'

test('default liabilities compute monthly payment', () => {
  const start = 2024
  const [loan] = defaultLiabilities(start)
  const expected = calculateAmortizedPayment(
    loan.principal,
    loan.interestRate,
    loan.termYears,
    loan.paymentsPerYear
  )
  expect(loan.computedPayment).toBeCloseTo(expected)
})
