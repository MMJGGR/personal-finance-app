/* global test, expect */
import { calculateLoanNPV } from '../utils/financeUtils'

test('calculateLoanNPV matches known mortgage example', () => {
  const npv = calculateLoanNPV(100000, 5, 30, 12, 4)
  expect(npv).toBeCloseTo(12443.32, 2)
})
