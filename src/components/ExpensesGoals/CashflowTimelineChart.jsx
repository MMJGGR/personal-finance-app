import React from 'react'
import { BarChart, Bar, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { formatCurrency } from '../../utils/formatters'

export default function CashflowTimelineChart({ data = [], locale, currency }) {
  const format = v => formatCurrency(v, locale, currency)
  return (
    <BarChart data={data} width={1000} height={500} role="img" aria-label="Cashflow timeline chart">
      <XAxis dataKey="year" />
      <YAxis />
      <Tooltip formatter={format} />
      <Legend />
      <Bar dataKey="income" stackId="a" fill="#f59e0b" name="Income" />
      <Bar dataKey="expenses" stackId="a" fill="#dc2626" name="Expenses" />
      <Bar dataKey="goals" stackId="a" fill="#6b21a8" name="Goals" />
      <Bar dataKey="loans" stackId="a" fill="#2563eb" name="Loans" />
      <Line type="monotone" dataKey="netCashflow" stroke="#16a34a" name="Net Cashflow" />
    </BarChart>
  )
}
