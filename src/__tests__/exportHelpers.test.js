import { buildIncomeJSON, buildIncomeCSV, buildPlanJSON, buildPlanCSV } from '../utils/exportHelpers'

test('income JSON payload contains profile fields', () => {
  const profile = { email:'test@example.com', phone:'555-1234', residentialAddress:'123 St' }
  const payload = buildIncomeJSON(profile, 2024, [], 5, 10, 1000, [], 0)
  expect(payload.profile.email).toBe('test@example.com')
  expect(payload.profile.phone).toBe('555-1234')
  expect(payload.profile.residentialAddress).toBe('123 St')
})

test('income CSV includes profile header', () => {
  const profile = { email:'test@example.com', phone:'555-1234', residentialAddress:'123 St' }
  const csv = buildIncomeCSV(profile, ['Col'], [[1]])
  expect(csv).toContain('test@example.com')
  expect(csv).toContain('555-1234')
  expect(csv).toContain('123 St')
})

test('plan JSON payload contains profile fields', () => {
  const profile = { email:'test@example.com', phone:'555-1234', residentialAddress:'123 St' }
  const payload = buildPlanJSON(profile, 5, 20, [], 0, [], 0, [], 0, 0)
  expect(payload.profile.email).toBe('test@example.com')
  expect(payload.profile.phone).toBe('555-1234')
  expect(payload.profile.residentialAddress).toBe('123 St')
})

test('plan CSV includes profile header', () => {
  const profile = { email:'test@example.com', phone:'555-1234', residentialAddress:'123 St' }
  const csv = buildPlanCSV(profile, [{ category:'Expenses', value:100 }])
  expect(csv).toContain('test@example.com')
  expect(csv).toContain('555-1234')
  expect(csv).toContain('123 St')
})
