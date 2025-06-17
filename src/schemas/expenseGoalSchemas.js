import { z } from 'zod'

// --- Parsing Helpers -------------------------------------------------------
export const toInt = v =>
  v === '' || v === null || v === undefined ? undefined : parseInt(String(v), 10)

export const toNumber = v =>
  v === '' || v === null || v === undefined ? undefined : parseFloat(String(v))

// --- Schema Field Helpers ---------------------------------------------------
export const numField = () => z.preprocess(toNumber, z.number())

export const nonNegNumber = () =>
  z.preprocess(toNumber, z.number().nonnegative())

export const intField = () => z.preprocess(toInt, z.number().int())

export const posIntField = () => z.preprocess(toInt, z.number().int().positive())

export const expenseItemSchema = z
  .object({
    name: z.string().min(1, 'Required'),
    amount: nonNegNumber(),
    paymentsPerYear: posIntField(),
    growth: numField().default(0),
    category: z.string().default(''),
    priority: intField().pipe(z.number().min(1).max(3)).default(2),
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
    amount: nonNegNumber(),
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
  principal: nonNegNumber(),
  interestRate: nonNegNumber(),
  remainingMonths: posIntField(),
  paymentsPerYear: posIntField(),
  payment: numField().optional(),
})
