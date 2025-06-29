import React, { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useFinance } from '../FinanceContext'
import {
  generateRecurringFlows,
  frequencyToPayments,
} from '../utils/financeUtils'
import { getLoanFlowsByYear } from '../utils/loanHelpers'

export default function ExpensesStackedBarChart({ chartMode = 'nominal', timelineData, showIncome, showExpensesChart, showGoalsChart, showLiabilitiesChart, showInvestmentsChart, showPensionChart }) {
  const { settings, startYear } = useFinance()

  const BASE_COLORS = {
    income: '#4CAF50', // Green
    expenses: '#F44336', // Red
    goals: '#2196F3', // Blue
    loans: '#FFC107', // Amber
    investments: '#9C27B0', // Purple
    pension: '#00BCD4', // Cyan
  }

  const chartData = useMemo(() => {
    if (!timelineData || timelineData.length === 0) return []

    const processedData = timelineData.map(row => {
      const newRow = { year: row.year }
      if (showIncome) newRow.income = row.income
      if (showExpensesChart) newRow.expenses = row.expenses
      if (showGoalsChart) newRow.goals = row.goals
      if (showLiabilitiesChart) newRow.loans = row.loans
      if (showInvestmentsChart) newRow.investments = row.investments
      if (showPensionChart) newRow.pension = row.pension

      if (chartMode === 'pv') {
        const rate = settings.discountRate ?? 0
        const diff = Number(row.year) - startYear + 1
        const factor = Math.pow(1 + rate / 100, diff)
        Object.keys(newRow).forEach(k => {
          if (k !== 'year') {
            newRow[k] = newRow[k] / factor
          }
        })
      }
      return newRow
    })
    return processedData
  }, [timelineData, chartMode, showIncome, showExpensesChart, showGoalsChart, showLiabilitiesChart, showInvestmentsChart, showPensionChart, settings.discountRate, startYear])

  const dataKeys = useMemo(() => {
    const keys = []
    if (showIncome) keys.push('income')
    if (showExpensesChart) keys.push('expenses')
    if (showGoalsChart) keys.push('goals')
    if (showLiabilitiesChart) keys.push('loans')
    if (showInvestmentsChart) keys.push('investments')
    if (showPensionChart) keys.push('pension')
    return keys
  }, [showIncome, showExpensesChart, showGoalsChart, showLiabilitiesChart, showInvestmentsChart, showPensionChart])

  return (
    <div className="w-full h-80 bg-white p-4 rounded-xl shadow-md">
      <h3 className="text-lg font-semibold mb-2">Expenses Over Time</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip />
          <Legend formatter={value => value} />
          {categories.map(cat => (
            <Bar key={cat} dataKey={cat} stackId="a" fill={colorMap[cat]} />
          ))}
          {Object.keys(loanFlows).length > 0 && (
            <Bar dataKey="Debt Service" stackId="a" fill="#34d399" />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
