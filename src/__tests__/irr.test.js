/* global test, expect */
import { internalRateOfReturn } from '../utils/financeUtils'

test('internalRateOfReturn matches known multi-period example', () => {
  const irr = internalRateOfReturn([-1000, 300, 420, 680])
  expect(irr).toBeCloseTo(16.34, 2)
})

test('internalRateOfReturn handles simple two-period case', () => {
  const irr = internalRateOfReturn([-100, 110])
  expect(irr).toBeCloseTo(10, 4)
})

test('internalRateOfReturn returns NaN when cash flows have same sign', () => {
  expect(internalRateOfReturn([100, 200, 300])).toBeNaN()
})
