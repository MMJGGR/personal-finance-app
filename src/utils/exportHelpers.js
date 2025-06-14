import { buildCSV, quoteCSV } from './csvUtils'

export function buildIncomeJSON(profile, startYear, incomeSources, discountRate, years, monthlyExpense, pvPerStream, totalPV) {
  return {
    generatedAt: new Date().toISOString(),
    profile,
    startYear,
    incomeSources,
    assumptions: { discountRate, years, monthlyExpense },
    pvPerStream,
    totalPV,
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

export function buildPlanJSON(profile, discountRate, lifeYears, expensesList, pvExpenses, goalsList, pvGoals, liabilities, totalLiabilitiesPV, totalRequired) {
  return {
    generatedAt: new Date().toISOString(),
    profile,
    assumptions: { discountRate, lifeYears },
    expenses: expensesList,
    pvExpenses,
    goals: goalsList,
    pvGoals,
    liabilities: liabilities.map(l => {
      const { schedule: _schedule, ...rest } = l
      return rest
    }),
    totalLiabilitiesPV,
    totalRequired,
  }
}

export function buildPlanCSV(profile, pvSummaryData = []) {
  const headerRows = [
    ['Name', profile.name || ''],
    ['Email', profile.email || ''],
    ['Phone', profile.phone || ''],
    ['Address', profile.residentialAddress || ''],
  ]
  const header = headerRows.map(r => r.map(quoteCSV).join(',')).join('\n')
  const columns = ['Category', 'Value']
  const rows = pvSummaryData.map(d => [d.category, d.value])
  const data = buildCSV(columns, rows)
  return header + '\n' + data
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
