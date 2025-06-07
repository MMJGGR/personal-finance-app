import { selectAnnualIncome, selectAnnualIncomePV } from '../selectors'

const state = {
  startYear: 2030,
  years: 3,
  settings: { discountRate: 5 },
  incomeSources: [
    { amount: 1000, frequency: 12, growth: 0, taxRate: 0 }
  ]
}

test('income pv per year applies discount sequentially', () => {
  const income = selectAnnualIncome(state)
  const pv = selectAnnualIncomePV(state)
  expect(pv).toHaveLength(3)
  for (let i = 0; i < 3; i++) {
    expect(pv[i]).toBeCloseTo(income[i] / ((1.05) ** (i + 1)))
  }
})
