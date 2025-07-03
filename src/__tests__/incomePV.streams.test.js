import { calculatePV as calcStreamPV } from '../components/Income/helpers'

function manualPV(amount, freq, growth, discount, periods) {
  let pv = 0
  const r = 1 + discount / 100
  for (let i = 0; i < periods; i++) {
    const cash = amount * freq * Math.pow(1 + growth / 100, i)
    pv += cash / Math.pow(r, i + 1)
  }
  return pv
}

test('salary present value calculation', () => {
  const now = new Date().getFullYear()
  const stream = {
    amount: 1000,
    frequency: 12,
    growth: 0,
    taxRate: 20,
    startYear: now,
    endYear: now + 2,
    type: 'Salary'
  }
  const pv = calcStreamPV(stream, 5, 5, { birthYear: now - 30 })
  const expectedGross = manualPV(1000, 12, 0, 5, 3)
  const expectedNet = expectedGross * 0.8
  expect(pv.gross).toBeCloseTo(expectedGross, 6)
  expect(pv.net).toBeCloseTo(expectedNet, 6)
})

test('bonus present value calculation', () => {
  const now = new Date().getFullYear()
  const stream = {
    amount: 2000,
    frequency: 1,
    growth: 0,
    taxRate: 10,
    startYear: now + 1,
    endYear: now + 3,
    type: 'Bonus'
  }
  const pv = calcStreamPV(stream, 5, 5, { birthYear: now - 30 })
  const expectedImmediate = manualPV(2000, 1, 0, 5, 3)
  const offset = 1
  const expectedGross = expectedImmediate / Math.pow(1 + 0.05, offset)
  const expectedNet = expectedGross * 0.9
  expect(pv.gross).toBeCloseTo(expectedGross, 6)
  expect(pv.net).toBeCloseTo(expectedNet, 6)
})

test('rental income present value with growth', () => {
  const now = new Date().getFullYear()
  const stream = {
    amount: 500,
    frequency: 12,
    growth: 3,
    taxRate: 0,
    startYear: now,
    endYear: now + 4,
    type: 'Rental'
  }
  const pv = calcStreamPV(stream, 5, 5, { birthYear: now - 30 })
  const expectedGross = manualPV(500, 12, 3, 5, 5)
  expect(pv.gross).toBeCloseTo(expectedGross, 6)
  expect(pv.net).toBeCloseTo(expectedGross, 6)
})
