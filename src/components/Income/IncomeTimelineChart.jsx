import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '../../utils/formatters'

const COLORS = ['#fbbf24', '#f59e0b', '#d97706', '#92400e', '#78350f']

export default function IncomeTimelineChart({ data = [], incomeSources = [], locale, currency }) {
  const format = v => formatCurrency(v, locale, currency)
  const active = incomeSources.filter(s => s.active)

  return (
    <ResponsiveContainer width="100%" height={500} role="img" aria-label="Income timeline chart">
      <BarChart data={data}>
        <XAxis dataKey="year" />
        <YAxis />
        <Tooltip formatter={format} />
        <Legend />
        {active.map((s, idx) => (
          <Bar
            key={s.id}
            dataKey={s.id}
            name={s.name}
            stackId="income"
            fill={COLORS[idx % COLORS.length]}
          />
        ))}
        <Line
          type="monotone"
          dataKey="expenses"
          name="Expenses"
          stroke="#ef4444"
          strokeWidth={2}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
