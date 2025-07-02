import { z } from 'zod'

export const profileSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(1, 'Required'),
  address: z.string().optional().default(''),
  city: z.string().optional().default(''),
  country: z.string().optional().default(''),
  taxCountry: z.string().optional().default(''),
  taxId: z.string().optional().default(''),
  employmentStatus: z.string().min(1, 'Required'),
  employerName: z.string().optional().default(''),
  birthDate: z.string().min(1, 'Required'),
  annualIncome: z.number().nonnegative().default(0),
  netWorth: z.number().nonnegative().optional().default(0),
  liquidNetWorth: z.number().nonnegative().optional().default(0),
  yearsInvesting: z.number().nonnegative().optional().default(0),
  emergencyFundMonths: z.number().nonnegative().optional().default(0),
  riskSurvey: z.array(z.number().min(1).max(5)).length(10).optional().default([]),
  surveyScore: z.number().min(10).max(50).optional().default(0)
})
