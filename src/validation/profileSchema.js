import { z } from 'zod'
import { personalInfoSchema, financialInfoSchema } from '../schemas/profileSchemas'

export const profileSchema = personalInfoSchema.merge(financialInfoSchema).extend({
  yearsInvesting: z.number().nonnegative().optional().default(0),
  emergencyFundMonths: z.number().nonnegative().optional().default(0),
  riskSurveyAnswers: z
    .array(z.number().min(1).max(5))
    .length(10)
    .optional()
    .default([]),
  riskScore: z.number().min(0).max(100).optional().default(0)
})
