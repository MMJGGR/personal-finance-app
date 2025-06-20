export interface Profile {
  name: string
  email: string
  phone: string
  age: number
  lifeExpectancy: number
  [key: string]: any
}

export interface IncomeItem {
  name: string
  amount: number
  frequency: number | string
  growth?: number
  taxRate?: number
  startYear?: number
  endYear?: number | null
  type?: string
  linkedAssetId?: string
  active?: boolean
}

export interface ExpenseItem {
  name: string
  amount: number
  frequency: number | string
  growth?: number
  category?: string
  priority?: number
  paymentsPerYear?: number
  startYear?: number
  endYear?: number | null
}

export interface Asset {
  id: string
  name: string
  value: number
  type?: string
  expectedReturn?: number
  volatility?: number
  horizonYears?: number
  return?: number
}

export interface Liability {
  id: string
  name: string
  principal: number
  interestRate: number
  monthlyPayment: number
  termMonths: number
  startDate?: string
}

export interface Persona {
  id: string
  profile: Profile
  incomeSources: IncomeItem[]
  expensesList: ExpenseItem[]
  goalsList: ExpenseItem[]
  assetsList: Asset[]
  liabilitiesList: Liability[]
  settings: any
  includeMediumPV?: boolean
  includeLowPV?: boolean
  includeGoalsPV?: boolean
  includeLiabilitiesNPV?: boolean
}
