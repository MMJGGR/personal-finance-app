import { buildCashflowTimeline as buildTimeline } from '../utils/cashflowTimeline'

test('timeline spans retirement horizon when expenses extend forward', () => {
  const current = 2024
  const retirementYear = 2028
  const expenses = [
    { amount: 100, paymentsPerYear: 12, startYear: current, endYear: retirementYear }
  ]
  const timeline = buildTimeline(current, retirementYear, () => 0, expenses, [], undefined, 0)
  expect(timeline).toHaveLength(retirementYear - current + 1)
})
