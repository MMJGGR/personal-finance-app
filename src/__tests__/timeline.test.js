import buildTimeline from '../selectors/timeline'

test('goal added only in target year when startYear equals endYear', () => {
  const timeline = buildTimeline(
    2024,
    2026,
    () => 0,
    [],
    [{ amount: 300, startYear: 2025, endYear: 2025, targetYear: 2025 }]
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
    [{ amount: 300, startYear: 2024, endYear: 2026, targetYear: 2026 }]
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
    []
  )
  expect(timeline[0].expenses).toBe(1200)
})

test('unknown frequency defaults to single payment', () => {
  const timeline = buildTimeline(
    2024,
    2024,
    () => 0,
    [{ amount: 100, frequency: 'Weekly', startYear: 2024, endYear: 2024 }],
    []
  )
  expect(timeline[0].expenses).toBe(100)
})
