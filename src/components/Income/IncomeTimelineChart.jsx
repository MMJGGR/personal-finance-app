import React from 'react'
import { BarChart, Bar, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { formatCurrency } from '../../utils/formatters'

const COLORS = ['#fbbf24', '#f59e0b', '#d97706', '#92400e', '#78350f']

export default function IncomeTimelineChart({ data = [], incomeSources = [], locale, currency }) {
  const format = v => formatCurrency(v, locale, currency)
  return (
    <BarChart data={data} width={1000} height={500} role="img" aria-label="Income timeline chart">
      <XAxis dataKey="year" />
      <YAxis />
      <Tooltip formatter={format} />
      <Legend />

      {incomeSources.filter(s => s.active).map((s, idx) => (
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
  )
}
