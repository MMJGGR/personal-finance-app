import { z } from 'zod'

const intField = () =>
  z.preprocess(v => (v === '' || v === null || v === undefined ? undefined : parseInt(v as string, 10)), z.number().int())

const numField = () =>
  z.preprocess(v => (v === '' || v === null || v === undefined ? undefined : parseFloat(v as string)), z.number())

export const expenseItemSchema = z
  .object({
    name: z.string().min(1, 'Required'),
    amount: numField().nonnegative(),
    paymentsPerYear: intField().positive(),
    growth: numField().default(0),
    category: z.string().default(''),
    priority: intField().min(1).max(3).default(2),
    startYear: intField(),
    endYear: intField().optional().nullable(),
  })
  .refine(d => d.endYear == null || d.endYear >= d.startYear, {
    path: ['endYear'],
    message: 'End year must be after start year',
  })

export const goalItemSchema = z
  .object({
    name: z.string().min(1, 'Required'),
    amount: numField().nonnegative(),
    targetYear: intField(),
    startYear: intField(),
    endYear: intField(),
  })
  .refine(d => d.endYear >= d.startYear, {
    path: ['endYear'],
    message: 'End year must be after start year',
  })

export const loanInputSchema = z.object({
  name: z.string().optional().default(''),
  principal: numField().nonnegative(),
  interestRate: numField().nonnegative(),
  remainingMonths: intField().positive(),
  paymentsPerYear: intField().positive(),
  payment: numField().optional(),
})
