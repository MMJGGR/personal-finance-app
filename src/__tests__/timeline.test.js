import { buildCashflowTimeline as buildTimeline } from '../utils/cashflowTimeline'

test('goal added only in target year when startYear equals endYear', () => {
  const timeline = buildTimeline(
    2024,
    2026,
    () => 0,
    [],
    [{ amount: 300, startYear: 2025, endYear: 2025, targetYear: 2025 }],
    undefined,
    0
  )
  const goals = timeline.map(r => r.goals)
  expect(goals).toEqual([0, 300, 0])
})

test('multi-year goal occurs only in target year', () => {
  const timeline = buildTimeline(
    2024,
    2026,
    () => 0,
    [],
    [{ amount: 300, startYear: 2024, endYear: 2026, targetYear: 2026 }],
    undefined,
    0
  )
  const goals = timeline.map(r => r.goals)
  expect(goals).toEqual([0, 0, 300])
})

test('string frequency expands to correct payments per year', () => {
  const timeline = buildTimeline(
    2024,
    2024,
    () => 0,
    [{ amount: 100, frequency: 'Monthly', startYear: 2024, endYear: 2024 }],
    [],
    undefined,
    0
  )
  expect(timeline[0].expenses).toBe(1200)
})

test('unknown frequency defaults to single payment', () => {
  const timeline = buildTimeline(
    2024,
    2024,
    () => 0,
    [{ amount: 100, frequency: 'Weekly', startYear: 2024, endYear: 2024 }],
    [],
    undefined,
    0
  )
  expect(timeline[0].expenses).toBe(100)
})

test('expenses grow by inflation rate when growth not set', () => {
  const timeline = buildTimeline(
    2024,
    2025,
    () => 0,
    [{ amount: 100, paymentsPerYear: 12, startYear: 2024, endYear: 2025 }],
    [],
    undefined,
    5
  )
  expect(timeline[1].expenses).toBeCloseTo(timeline[0].expenses * 1.05)
})

test('expense growth overrides inflation rate', () => {
  const timeline = buildTimeline(
    2024,
    2025,
    () => 0,
    [{ amount: 100, paymentsPerYear: 12, growth: 10, startYear: 2024, endYear: 2025 }],
    [],
    undefined,
    5
  )
  expect(timeline[1].expenses).toBeCloseTo(timeline[0].expenses * 1.1)
})

test('expense without endYear persists through maxYear', () => {
  const timeline = buildTimeline(
    2024,
    2026,
    () => 0,
    [{ amount: 100, paymentsPerYear: 1, startYear: 2024 }],
    [],
    undefined,
    0
  )
  expect(timeline.map(r => r.expenses)).toEqual([100, 100, 100])
})
