import buildTimeline from '../selectors/timeline'

test('goal added only in target year when startYear equals endYear', () => {
  const timeline = buildTimeline(
    2024,
    2026,
    () => 0,
    [],
    [{ amount: 300, startYear: 2025, endYear: 2025 }]
  )
  const goals = timeline.map(r => r.goals)
  expect(goals).toEqual([0, 300, 0])
})

test('multi-year goal amount is distributed across years', () => {
  const timeline = buildTimeline(
    2024,
    2026,
    () => 0,
    [],
    [{ amount: 300, startYear: 2024, endYear: 2026 }]
  )
  const goals = timeline.map(r => r.goals)
  expect(goals).toEqual([100, 100, 100])
})
