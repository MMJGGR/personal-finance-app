import { buildCSV, quoteCSV } from './csvUtils'
import { stripPII } from './compliance.js'
import { selectAnnualIncome } from '../selectors'
import { getLoanFlowsByYear } from './loanHelpers'
import { buildCashflowTimeline } from './cashflowTimeline'
import { calculateLoanSchedule } from '../modules/loan/loanCalculator.js'
import { projectPensionGrowth, calculatePensionIncome } from './pensionProjection'
import { presentValue } from './financeUtils'
import { computeEmergencyFund, computeLifeCover } from './insuranceUtils'

export function buildIncomeJSON(
  profile,
  startYear,
  incomeSources,
  discountRate,
  years,
  monthlyExpense,
  pvPerStream,
  totalPV,
  timeline = []
) {
  return {
    generatedAt: new Date().toISOString(),
    profile,
    startYear,
    incomeSources,
    assumptions: { discountRate, years, monthlyExpense },
    pvPerStream,
    totalPV,
    timeline,
  }
}

export function buildIncomeCSV(profile, columns = [], rows = []) {
  const headerRows = [
    ['Name', profile.name || ''],
    ['Email', profile.email || ''],
    ['Phone', profile.phone || ''],
    ['Address', profile.residentialAddress || ''],
  ]
  const header = headerRows.map(r => r.map(quoteCSV).join(',')).join('\n')
  const data = buildCSV(columns, rows)
  return header + '\n' + data
}

export function buildPlanJSON(profile, discountRate, lifeYears, expensesList, pvExpenses, goalsList, pvGoals, liabilities, totalLiabilitiesPV, totalRequired, timeline = []) {
  return {
    generatedAt: new Date().toISOString(),
    profile,
    assumptions: { discountRate, lifeYears },
    expenses: expensesList,
    pvExpenses,
    goals: goalsList,
    pvGoals,
    liabilities,
    totalLiabilitiesPV,
    totalRequired,
    timeline,
  }
}

export function buildPlanCSV(profile, pvSummaryData = [], loans = []) {
  const headerRows = [
    ['Name', profile.name || ''],
    ['Email', profile.email || ''],
    ['Phone', profile.phone || ''],
    ['Address', profile.residentialAddress || ''],
  ]
  const header = headerRows.map(r => r.map(quoteCSV).join(',')).join('\n')
  const columns = ['Category', 'Value']
  const rows = pvSummaryData.map(d => [d.category, d.value])
  const summary = buildCSV(columns, rows)

  let loanSection = ''
  if (Array.isArray(loans) && loans.length > 0) {
    const loanCols = ['Loan Name', 'Principal', 'Rate', 'Term', 'Payment']
    const loanRows = loans.map(l => [
      l.name || 'Loan',
      l.principal,
      l.interestRate,
      l.termYears,
      l.computedPayment,
    ])
    loanSection = '\n' + buildCSV(loanCols, loanRows)
  }

  return header + '\n' + summary + loanSection
}

export async function submitProfile(payload = {}, settings = {}) {
  if (!settings.apiEndpoint) return
  if (typeof fetch !== 'function') return
  try {
    const sanitized = { ...payload, profile: stripPII(payload.profile) }
    await fetch(settings.apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitized)
    })
  } catch (err) {
    console.error('Failed to submit profile', err)
  }
}

export function exportFullReport(state = {}) {
  const {
    profile = {},
    settings = {},
    incomeSources = [],
    expensesList = [],
    goalsList = [],
    liabilitiesList = [],
    assetsList = [],
    startYear = new Date().getFullYear(),
    years = 1,
    incomePV = 0,
    pvExpenses = 0,
    goalsPV = 0,
    monthlyExpense = 0,
    monthlyIncomeNominal = 0,
    fundingFlag,
    privatePensionContributions = []
  } = state

  const annualIncome = selectAnnualIncome(state)
  const yearlyNominal = annualIncome.map((amt, idx) => ({ year: startYear + idx, amount: amt }))

  const loanFlows = getLoanFlowsByYear(liabilitiesList)

  const timeline = buildCashflowTimeline(
    startYear,
    startYear + years - 1,
    y => annualIncome[y - startYear] || 0,
    expensesList,
    goalsList,
    y => loanFlows[y] || 0,
    settings.inflationRate || 0
  )

  let nw = assetsList.reduce((s,a)=>s+Number(a.amount||0),0) -
           liabilitiesList.reduce((s,l)=>s+Number(l.amount||l.principal||0),0)
  const netWorthTimeline = timeline.map(row => {
    nw += row.net
    return { year: row.year, netWorth: nw }
  })

  const loanSummaries = liabilitiesList.map(l => {
    const sched = calculateLoanSchedule({
      principal: Number(l.principal)||0,
      annualRate: Number(l.interestRate)/100 || 0,
      termYears: Math.ceil((l.termMonths||l.termYears*12||12)/12),
      paymentsPerYear: Number(l.frequency)||l.paymentsPerYear||12,
      extraPayment: Number(l.extraPayment)||0
    }, new Date(startYear,0,1))
    const byYear = {}
    sched.payments.forEach(p=>{
      const y = new Date(p.date).getFullYear()
      byYear[y] = (byYear[y]||0)+p.payment
    })
    const annualSchedule = Object.entries(byYear).map(([y,v])=>({year:Number(y),payment:v}))
    return {
      principal: l.principal,
      interestRate: l.interestRate,
      termMonths: l.termMonths || l.termYears*12 || 0,
      type: l.type || l.name,
      totalInterest: sched.totalInterest,
      pv: sched.pvLiability,
      annualSchedule
    }
  })

  const pvLiabilities = loanSummaries.reduce((s,l)=>s+l.pv,0)

  const assetReturn = (() => {
    const total = assetsList.reduce((s,a)=>s+Number(a.amount||0),0)
    if(total===0) return 0
    return assetsList.reduce((s,a)=>s + ((Number(a.amount||0)/total) * (Number(a.expectedReturn||a.returnAssumptionPct||0))),0)
  })()

  const assetVol = (() => {
    const total = assetsList.reduce((s,a)=>s+Number(a.amount||0),0)
    if(total===0) return 0
    return assetsList.reduce((s,a)=>s + ((Number(a.amount||0)/total) * (Number(a.volatility||a.volatilityPct||0))),0)
  })()

  
  const pensionAsset = assetsList.find(a => /pension/i.test(a.name||''))
  const pensionValue = pensionAsset ? Number(pensionAsset.amount||0) : 0
  const annualContrib = privatePensionContributions.reduce((s,p)=>s+p.amount*(p.frequency||12),0)
  const yearsToRet = (settings.retirementAge||65) - (profile.age||0)
  const futureValue = projectPensionGrowth(pensionValue, annualContrib, settings.expectedReturn||0, yearsToRet)
  const incomeRes = calculatePensionIncome({
    amount: annualContrib/12,
    duration: yearsToRet,
    frequency: 'Monthly',
    expectedReturn: settings.expectedReturn||0,
    pensionType: settings.pensionType || 'Annuity',
    retirementAge: settings.retirementAge||65,
    currentAge: profile.age||0,
    lifeExpectancy: profile.lifeExpectancy||85
  })
  const pvIncomeStream = presentValue(incomeRes.incomeStream.map(i=>i.amount), (settings.discountRate||0)/100)

  const emergencyFundNeeded = computeEmergencyFund(monthlyExpense, profile.dependents||profile.numDependents||0)
  const lifeCoverNeeded = computeLifeCover(monthlyIncomeNominal*12, profile.dependents||profile.numDependents||0, profile.maritalStatus||'single')

  return {
    profile,
    settings,
    income: {
      sources: incomeSources,
      yearlyNominal,
      pvLifetime: incomePV
    },
    expenses: {
      items: [...expensesList, ...goalsList],
      loanSummaries,
      pvLifetime: pvExpenses + goalsPV + pvLiabilities
    },
    investments: {
      holdings: assetsList,
      portfolioReturn: assetReturn,
      portfolioVolatility: assetVol
    },
    balanceSheet: {
      assets: assetsList.reduce((s,a)=>s+Number(a.amount||0),0),
      liabilities: liabilitiesList.reduce((s,l)=>s+Number(l.amount||l.principal||0),0),
      netWorthTimeline,
      alerts: fundingFlag ? [fundingFlag] : []
    },
    retirement: {
      futureValue,
      pvIncomeStream
    },
    insurance: {
      emergencyFundNeeded,
      lifeCoverNeeded
    }
  }
}
