import { computeSurvivalMonths, computeFundingGaps } from '../engines/adequacy'
import {
  calculateNominalSurvival,
  calculatePVSurvival,
  calculatePVObligationSurvival
} from '../utils/survivalMetrics'

test('computeSurvivalMonths delegates based on method', () => {
  const pv = 120000
  const rate = 6
  const years = 10
  const exp = 1000

  expect(
    computeSurvivalMonths(pv, exp, { discountRate: rate, horizonYears: years })
  ).toBe(calculatePVSurvival(pv, rate, exp, years))

  expect(
    computeSurvivalMonths(pv, exp, { discountRate: rate, horizonYears: years, method: 'nominal' })
  ).toBe(calculateNominalSurvival(pv, rate, years, exp))

  expect(
    computeSurvivalMonths(pv, exp, { discountRate: rate, method: 'obligation' })
  ).toBe(calculatePVObligationSurvival(pv, rate, exp))
})

test('computeFundingGaps returns deficits', () => {
  const gaps = computeFundingGaps([5, -2, 3, -1])
  expect(gaps).toEqual([0, 2, 0, 1])
})
