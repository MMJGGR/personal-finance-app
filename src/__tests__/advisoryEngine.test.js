import { computeFundingAdequacy } from '../utils/AdvisoryEngine'

test('funding adequacy flags shortfall', () => {
  const res = computeFundingAdequacy(60000, 80000)
  expect(res.flag).toBe('shortfall')
  expect(res.gap).toBe(-20000)
})

test('funding adequacy flags overfunded', () => {
  const res = computeFundingAdequacy(110000, 90000)
  expect(res.flag).toBe('overfunded')
  expect(res.gap).toBe(20000)
})

