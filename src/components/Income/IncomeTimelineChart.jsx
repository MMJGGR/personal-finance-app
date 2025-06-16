import React from 'react'
import { BarChart, Bar, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { formatCurrency } from '../../utils/formatters'


export default function IncomeTimelineChart({ data = [], locale, currency }) {
  const format = v => formatCurrency(v, locale, currency)
  return (
    <BarChart data={data} width={1000} height={500} role="img" aria-label="Income timeline chart">
      <XAxis dataKey="year" />
      <YAxis />
      <Tooltip formatter={format} />
      <Legend />
      <Bar dataKey="gross" stackId="a" fill="#f59e0b" name="Gross Income" />
      <Bar dataKey="net" stackId="a" fill="#16a34a" name="After Tax" />
      <Line type="monotone" dataKey="expenses" stroke="#ef4444" name="Expenses" />
    </BarChart>
  )
}
