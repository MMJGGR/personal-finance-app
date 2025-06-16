import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { formatCurrency } from '../../utils/formatters'


export default function IncomeTimelineChart({ data = [], locale, currency }) {
  const format = v => formatCurrency(v, locale, currency)
  return (
    <LineChart data={data} width={1000} height={500} role="img" aria-label="Income timeline chart">
      <XAxis dataKey="year" />
      <YAxis />
      <Tooltip formatter={format} />
      <Legend />
      <Line dataKey="gross" stroke="#f59e0b" name="Gross Income" />
      <Line dataKey="net" stroke="#16a34a" name="After Tax" />
      <Line dataKey="expenses" stroke="#ef4444" name="Expenses" strokeWidth={2} />
    </LineChart>
  )
}
