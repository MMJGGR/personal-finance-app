import {
  selectAnnualIncome,
  selectAnnualIncomePV,
  selectAnnualOutflow,
  selectDiscountedNet,
  selectCumulativePV
} from '../selectors'

const baseState = {
  startYear: 2024,
  years: 2,
  settings: { discountRate: 10 },
  incomeSources: [
    { amount: 1000, frequency: 12, growth: 0, taxRate: 0 }
  ],
  expensesList: [
    { amount: 500, frequency: 'Monthly', growth: 0, startYear: 2024, endYear: 2025 }
  ],
  goalsList: [
    { amount: 1200, targetYear: 2025, startYear: 2025, endYear: 2025 }
  ]
}

test('annual income sums per year', () => {
  const income = selectAnnualIncome(baseState)
  expect(income).toEqual([12000, 12000])
})

test('annual outflow includes goals', () => {
  const out = selectAnnualOutflow(baseState)
  expect(out).toEqual([6000, 7200])
})

test('annual income PV discounts each year', () => {
  const pv = selectAnnualIncomePV(baseState)
  expect(pv[0]).toBeCloseTo(12000 / 1.1)
  expect(pv[1]).toBeCloseTo(12000 / (1.1 ** 2))
})

test('discounted net uses discount rate', () => {
  const net = selectDiscountedNet(baseState)
  expect(net[0]).toBeCloseTo(6000 / 1.1)
  expect(net[1]).toBeCloseTo(4800 / (1.1 ** 2))
})

test('cumulative pv sums discounted net', () => {
  const cum = selectCumulativePV(baseState)
  const first = 6000 / 1.1
  const second = first + 4800 / (1.1 ** 2)
  expect(cum[0]).toBeCloseTo(first)
  expect(cum[1]).toBeCloseTo(second)
})
