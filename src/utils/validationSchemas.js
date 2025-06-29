import { z } from 'zod'

export const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, "Invalid phone number"),
  age: z.number().int().min(18, "Must be at least 18 years old").max(120, "Age seems too high"),
  maritalStatus: z.string().optional(),
  numDependents: z.number().int().min(0, "Cannot be negative").optional(),
  residentialAddress: z.string().min(5, "Address is required"),
  nationality: z.string().min(1, "Nationality is required"),
  education: z.string().optional(),
  location: z.string().optional(),
  citizenship: z.string().optional(),
  taxJurisdiction: z.string().optional(),
  idNumber: z.string().min(5, "ID/Passport number is required"),
  taxResidence: z.string().optional(),
  employmentStatus: z.string().optional(),
  annualIncome: z.number().min(0, "Cannot be negative"),
  liquidNetWorth: z.number().min(0, "Cannot be negative"),
  sourceOfFunds: z.string().optional(),
  behaviouralProfile: z.object({
    spendingHabits: z.string().optional(),
    biases: z.array(z.string()).optional(),
    financialWorries: z.string().optional(),
  }).optional(),
  financialChallenge: z.string().optional(),
  investmentKnowledge: z.string().optional(),
  lossResponse: z.string().optional(),
  investmentHorizon: z.string().optional(),
  investmentGoal: z.string().optional(),
  riskCapacity: z.string().optional(),
  riskWillingness: z.string().optional(),
  lifeExpectancy: z.number().int().min(18, "Life expectancy must be at least 18").max(120, "Life expectancy seems too high"),
})

export const preferencesSchema = z.object({
  startYear: z.number().int().min(1900).max(2100),
  projectionYears: z.number().int().min(1).max(100),
  chartView: z.enum(['nominal', 'real']),
  discountRate: z.number().min(0).max(100),
  inflationRate: z.number().min(0).max(100),
  expectedReturn: z.number().min(0).max(100),
  currency: z.string().min(1),
  locale: z.string().min(1),
  apiEndpoint: z.string().url("Invalid URL").startsWith("https://", "Must use HTTPS").optional().or(z.literal('')),
  discretionaryCutThreshold: z.number().min(0).max(1),
  survivalThresholdMonths: z.number().int().min(0),
  bufferPct: z.number().min(0).max(1),
  retirementAge: z.number().int().min(18).max(120),
  riskCapacityScore: z.number().int().min(0).max(100),
  riskWillingnessScore: z.number().int().min(0).max(100),
  liquidityBucketDays: z.number().int().min(0),
  taxBrackets: z.array(z.object({
    min: z.number(),
    max: z.number().optional(),
    rate: z.number().min(0).max(1),
  })).optional(),
  pensionContributionReliefPct: z.number().min(0).max(1),
  authToken: z.string().optional(),
  nssfRates: z.object({
    employee: z.number().min(0).max(1),
    employer: z.number().min(0).max(1),
  }).optional(),
  nssfCaps: z.object({
    employee: z.number().min(0),
    employer: z.number().min(0),
  }).optional(),
})

export const incomeSourceSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  amount: z.number().min(0, "Amount cannot be negative"),
  frequency: z.number().int().min(1, "Frequency must be at least 1"),
  growth: z.number().min(0).max(100),
  taxRate: z.number().min(0).max(100),
  startYear: z.number().int().min(1900).max(2100),
  endYear: z.number().int().min(1900).max(2100).nullable().optional(),
  type: z.string().min(1, "Type is required"),
  linkedAssetId: z.string().optional(),
  active: z.boolean(),
  taxed: z.boolean(),
  grossSalary: z.number().min(0).optional(),
  contractedOutTier2: z.boolean().optional(),
})

export const expenseSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  amount: z.number().min(0, "Amount cannot be negative"),
  frequency: z.string().optional(), // Assuming frequency can be a string like 'monthly', 'annually'
  paymentsPerYear: z.number().int().min(1, "Payments per year must be at least 1"),
  growth: z.number().min(0).max(100),
  startYear: z.number().int().min(1900).max(2100),
  endYear: z.number().int().min(1900).max(2100).nullable().optional(),
  include: z.boolean(),
  monthDue: z.number().int().min(1).max(12).optional(),
  priority: z.number().int().min(1).max(3),
});

export const goalSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  amount: z.number().min(0, "Amount cannot be negative"),
  targetYear: z.number().int().min(1900).max(2100),
  type: z.string().optional(),
  daysCover: z.number().min(0).optional(),
  startYear: z.number().int().min(1900).max(2100),
  endYear: z.number().int().min(1900).max(2100).nullable().optional(),
});

export const assetSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  amount: z.number().min(0, "Amount cannot be negative"),
  type: z.string().min(1, "Type is required"),
  expectedReturn: z.number().min(0).max(100),
  volatility: z.number().min(0).max(100),
  horizonYears: z.number().int().min(0),
  purchaseYear: z.number().int().min(1900).max(2100),
  saleYear: z.number().int().min(1900).max(2100).nullable().optional(),
  principal: z.number().min(0),
});

export const liabilitySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  principal: z.number().min(0, "Principal cannot be negative"),
  interestRate: z.number().min(0).max(100),
  termYears: z.number().int().min(1),
  paymentsPerYear: z.number().int().min(1),
  extraPayment: z.number().min(0).optional(),
  startYear: z.number().int().min(1900).max(2100),
  endYear: z.number().int().min(1900).max(2100).nullable().optional(),
  include: z.boolean(),
});
