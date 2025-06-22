import React from 'react'
import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '../../utils/formatters'


export default function IncomeTimelineChart({ data = [], locale, currency }) {
  const format = v => formatCurrency(v, locale, currency)
  return (
    <ResponsiveContainer width="100%" height={400} role="img" aria-label="Income timeline chart">
      <BarChart data={data}>
        <XAxis dataKey="year" />
        <YAxis />
        <Tooltip formatter={format} />
        <Legend />
        <Bar dataKey="gross" stackId="a" fill="#f59e0b" name="Gross Income" />
        <Bar dataKey="net" stackId="a" fill="#16a34a" name="After Tax" />
        <Line type="monotone" dataKey="expenses" stroke="#ef4444" name="Expenses" />
      </BarChart>
    </ResponsiveContainer>
  )
}
