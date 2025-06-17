import React from 'react'
import { AreaChart, Area, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { formatCurrency } from '../../utils/formatters'

export default function CashflowTimelineChart({ data = [], locale, currency }) {
  const format = v => formatCurrency(v, locale, currency)
  return (
    <AreaChart data={data} width={1000} height={400} role="img" aria-label="Cashflow timeline chart">
      <XAxis dataKey="year" />
      <YAxis tickFormatter={format} />
      <Tooltip formatter={format} />
      <Legend />
      <Area type="monotone" dataKey="surplus" stroke="#22c55e" fill="#bbf7d0" name="Surplus" />
      <Line type="monotone" dataKey="net" stroke="#f59e0b" name="Net" />
    </AreaChart>
  )
}
