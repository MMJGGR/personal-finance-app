import { calculatePV, generateIncomeTimeline } from '../components/Income/helpers'

test('inactive income excluded from PV totals and timeline', () => {
  const current = new Date().getFullYear()
  const assumptions = { retirementAge: current + 5, deathAge: current + 5 }
  const active = { amount: 1000, frequency: 1, growth: 0, taxRate: 0, startYear: current, active: true }
  const inactive = { ...active, active: false }
  const pvActive = calculatePV(active, 0, 5, assumptions)
  const pvInactive = inactive.active ? calculatePV(inactive, 0, 5, assumptions) : { gross: 0, net: 0 }
  expect(pvInactive.gross).toBe(0)
  const total = [active, inactive].map(s => s.active ? calculatePV(s, 0, 5, assumptions) : {gross:0, net:0})
    .reduce((sum, p) => sum + p.gross, 0)
  expect(total).toBeCloseTo(pvActive.gross)

  const timeline = generateIncomeTimeline([active, inactive], assumptions, [], 5)
  const expected = generateIncomeTimeline([active], assumptions, [], 5)
  expect(timeline).toEqual(expected)
})
