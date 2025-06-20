import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { useFinance } from '../FinanceContext'

export default function ExpensesStackedBarChart() {
  const {
    expensesList,
    goalsList,
    includeMediumPV,
    includeLowPV,
    includeGoalsPV,
  } = useFinance()

  // Aggregate expenses by year and category
  const filtered = expensesList.filter(e => {
    if (e.priority === 2 && !includeMediumPV) return false
    if (e.priority > 2 && !includeLowPV) return false
    return true
  })

  const dataByYear = {}
  filtered.forEach(exp => {
    const { category, frequency, amount, startYear, endYear = startYear } = exp
    for (let year = startYear; year <= (endYear ?? startYear); year++) {
      if (!dataByYear[year]) dataByYear[year] = { year: String(year) }
      // Convert monthly to annual amount
      const value = frequency === 'Monthly' ? amount * 12 : amount
      dataByYear[year][category] = (dataByYear[year][category] || 0) + value
    }
  })

  if (includeGoalsPV) {
    goalsList.forEach(g => {
      const yr = g.targetYear ?? g.endYear ?? g.startYear
      const year = Number(yr)
      if (year == null) return
      if (!dataByYear[year]) dataByYear[year] = { year: String(year) }
      dataByYear[year].Goal = (dataByYear[year].Goal || 0) + (Number(g.amount) || 0)
    })
  }

  const chartData = Object.values(dataByYear).sort((a, b) => a.year - b.year)

  return (
    <div className="w-full h-80 bg-white p-4 rounded-xl shadow-md">
      <h3 className="text-lg font-semibold mb-2">Expenses Over Time</h3>
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
