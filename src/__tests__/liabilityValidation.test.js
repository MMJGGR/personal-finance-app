/* global test, expect */
import { calculateAmortizedPayment } from '../utils/financeUtils'

test('loan payment matches documentation example', () => {
  const principal = 916453.96
  const annualRate = 15
  const months = 34
  const payment = calculateAmortizedPayment(principal, annualRate, months / 12, 12)
  expect(payment).toBeCloseTo(33252.5, 1)
})
