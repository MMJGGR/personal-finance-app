import { generateRecurringFlows } from '../utils/financeUtils'
import { getLoanFlowsByYear } from '../utils/loanHelpers'

test('loan amounts added to chart data when liabilities exist', () => {
  const start = 2024
  const expenses = [{ amount: 100, paymentsPerYear: 12, growth: 0, startYear: start, endYear: start, category: 'Fixed', priority: 1 }]
  const liabilities = [{ principal: 1200, interestRate: 12, termYears: 1, paymentsPerYear: 12, startYear: start, include: true }]

  const dataByYear = {}
  expenses.forEach(exp => {
    const flows = generateRecurringFlows({
      amount: exp.amount,
      paymentsPerYear: exp.paymentsPerYear,
      growth: 0,
      startYear: exp.startYear,
      endYear: exp.endYear,
    })
    flows.forEach(({ year, amount }) => {
      if (!dataByYear[year]) dataByYear[year] = { year: String(year) }
      dataByYear[year][exp.category] = (dataByYear[year][exp.category] || 0) + amount
    })
  })

  const loanFlows = getLoanFlowsByYear(liabilities)
  Object.entries(loanFlows).forEach(([year, amt]) => {
    const y = Number(year)
    if (!dataByYear[y]) dataByYear[y] = { year: String(y) }
    dataByYear[y]['Debt Service'] = (dataByYear[y]['Debt Service'] || 0) + amt
  })

  const chartData = Object.values(dataByYear)
  expect(chartData[0]['Debt Service']).toBeGreaterThan(0)
})


