import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { formatCurrency } from '../../utils/formatters'

export default function CashflowTimelineChart({ data = [], locale, currency }) {
  const format = v => formatCurrency(v, locale, currency)
  return (
    <LineChart data={data} width={1000} height={400} role="img" aria-label="Cashflow timeline chart">
      <XAxis dataKey="year" />
      <YAxis tickFormatter={format} />
      <Tooltip formatter={format} />
      <Legend />
      <Line type="monotone" dataKey="income" stroke="#22c55e" name="Income" />
      <Line type="monotone" dataKey="expenses" stroke="#dc2626" name="Expenses" />
      <Line type="monotone" dataKey="goals" stroke="#6b21a8" name="Goals" />
      <Line type="monotone" dataKey="loans" stroke="#2563eb" name="Loans" />
      <Line type="monotone" dataKey="net" stroke="#f59e0b" name="Net" />
    </LineChart>
  )
}
