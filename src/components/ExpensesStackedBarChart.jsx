import React from 'react'
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

export default function ExpensesStackedBarChart() {
  const { expensesList, startYear, years } = useFinance()

  const horizonEnd = startYear + years - 1

  // Aggregate expenses by year and category
  const dataByYear = {}
  expensesList.forEach(exp => {
    const {
      category,
      frequency,
      amount,
      startYear: sYear,
      endYear,
    } = exp
    const finalYear = endYear ?? horizonEnd
    for (let year = sYear; year <= finalYear; year++) {
      if (!dataByYear[year]) dataByYear[year] = { year: String(year) }
      const value = frequency === 'Monthly' ? amount * 12 : amount
      dataByYear[year][category] = (dataByYear[year][category] || 0) + value
    }
  })

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
          <Bar dataKey="Discretionary" stackId="a" fill="#ff7f0e" />
          <Bar dataKey="Goal" stackId="a" fill="#2ca02c" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
