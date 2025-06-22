import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { useFinance } from '../FinanceContext'
import { frequencyToPayments } from '../utils/financeUtils'

export default function ExpensesStackedBarChart() {
  const {
    expensesList,
    goalsList,
    includeMediumPV,
    includeLowPV,
    includeGoalsPV,
    discountRate,
    startYear,
  } = useFinance()

  // Aggregate expenses by year and category
  const filtered = expensesList.filter(e => {
    if (e.priority === 2 && !includeMediumPV) return false
    if (e.priority > 2 && !includeLowPV) return false
    return true
  })

  const dataByYear = {}
  const discBase = 1 + discountRate / 100
  filtered.forEach(exp => {
    const {
      category,
      frequency,
      paymentsPerYear,
      amount,
      startYear: sYear,
      endYear = sYear,
      growth = 0
    } = exp
    const ppy = paymentsPerYear || frequencyToPayments(frequency) || 1
    for (let year = sYear; year <= endYear; year++) {
      if (!dataByYear[year]) dataByYear[year] = { year: String(year) }
      const idx = year - sYear
      const cash = (Number(amount) || 0) * ppy * Math.pow(1 + growth / 100, idx)
      const disc = year - startYear + 1
      const pv = cash / Math.pow(discBase, disc)
      dataByYear[year][category] = (dataByYear[year][category] || 0) + pv
    }
  })

  if (includeGoalsPV) {
    goalsList.forEach(g => {
      const yr = g.targetYear ?? g.endYear ?? g.startYear
      const year = Number(yr)
      if (year == null) return
      if (!dataByYear[year]) dataByYear[year] = { year: String(year) }
      const disc = year - startYear
      const pv = (Number(g.amount) || 0) / Math.pow(discBase, disc)
      dataByYear[year].Goal = (dataByYear[year].Goal || 0) + pv
    })
  }

  const chartData = Object.values(dataByYear).sort((a, b) => a.year - b.year)

  return (
    <div className="w-full h-80 bg-white p-4 rounded-xl shadow-md">
      <h3 className="text-lg font-semibold mb-2">PV of Expenses Over Time</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip />
          <Legend formatter={(value) => value} />
          <Bar dataKey="Fixed" stackId="a" fill="#1f77b4" />
          <Bar dataKey="Variable" stackId="a" fill="#ff7f0e" />
          <Bar dataKey="Other" stackId="a" fill="#2ca02c" />
          <Bar dataKey="Goal" stackId="a" fill="#9467bd" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
