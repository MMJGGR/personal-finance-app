import { z } from 'zod';

export const personalInfoSchema = z.object({
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
  age: z.number().nonnegative().default(30),
  lifeExpectancy: z.number().positive().default(85),
  numDependents: z.number().nonnegative().default(0),
  education: z.string().optional().default('')
});

export const financialInfoSchema = z.object({
  annualIncome: z.number().nonnegative().default(0),
  netWorth: z.number().nonnegative().optional().default(0),
  liquidNetWorth: z.number().nonnegative().optional().default(0)
});
