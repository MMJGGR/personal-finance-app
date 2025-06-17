import { buildCSV, quoteCSV } from './csvUtils'

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
    await fetch(settings.apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  } catch (err) {
    console.error('Failed to submit profile', err)
  }
}
