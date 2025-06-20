import { expenseItemSchema } from '../schemas/expenseGoalSchemas.js'

test('valid priority between 1 and 3 passes', () => {
  const data = {
    name: 'Rent',
    amount: 100,
    frequency: 'Annually',
    startYear: 2024,
    priority: 3,
  }
  const parsed = expenseItemSchema.safeParse(data)
  expect(parsed.success).toBe(true)
  expect(parsed.data.priority).toBe(3)
})

test('priority outside range fails validation', () => {
  const data = {
    name: 'Rent',
    amount: 100,
    frequency: 'Annually',
    startYear: 2024,
    priority: 5,
  }
  const parsed = expenseItemSchema.safeParse(data)
  expect(parsed.success).toBe(false)
})
