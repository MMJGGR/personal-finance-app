import { extractAge, extractNetWorth } from '../utils/ageUtils'
import { computeSurveyScore } from '../utils/surveyUtils'

/* global test, expect */

test('extractAge computes from birthDate when age missing', () => {
  const age = extractAge({ birthDate: '2000-01-01' })
  expect(age).toBeGreaterThan(20)
})

test('extractNetWorth uses totals when netWorth missing', () => {
  const nw = extractNetWorth({ totalAssets: 1000, totalLiabilities: 200 })
  expect(nw).toBe(800)
})

test('computeSurveyScore normalizes range', () => {
  expect(computeSurveyScore([1,1])).toBe(0)
  expect(computeSurveyScore([5,5])).toBe(100)
})
