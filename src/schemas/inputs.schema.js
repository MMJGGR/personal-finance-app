import { z } from 'zod';
import { toNumber, intFieldWithRange } from './expenseGoalSchemas.js';

const posNumber = () => z.preprocess(toNumber, z.number().positive());

export const pensionFormSchema = z.object({
  amount: posNumber(),
  startYear: intFieldWithRange(1900, 9999),
  duration: intFieldWithRange(1, 100),
  frequency: z.enum(['Monthly', 'Annually']),
  pensionType: z.enum(['Annuity', 'Self-Managed'])
});
