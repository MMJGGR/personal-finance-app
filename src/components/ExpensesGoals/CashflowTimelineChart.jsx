import React from 'react'
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { formatCurrency } from '../../utils/formatters'

export default function CashflowTimelineChart({ data = [], locale, currency }) {
  const format = v => formatCurrency(v, locale, currency)
  return (
    <ResponsiveContainer width="100%" height={400} role="img" aria-label="Cashflow timeline chart">
      <AreaChart data={data}>
        <XAxis dataKey="year" />
        <YAxis tickFormatter={format} />
        <Tooltip formatter={format} />
        <Legend />
        <Area type="monotone" dataKey="net" stroke="#22c55e" fill="#bbf7d0" name="Surplus" />
        <Line type="monotone" dataKey="net" stroke="#f59e0b" name="Net" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
