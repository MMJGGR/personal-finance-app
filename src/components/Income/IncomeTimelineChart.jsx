import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '../../utils/formatters'

export function generateIncomeTimeline(sources, years) {
  const timeline = Array.from({ length: years }, (_, i) => ({ year: i + 1, total: 0 }))
  sources.forEach(src => {
    if (!src.active) return
    for (let i = 0; i < years; i++) {
      const grown = src.amount * src.frequency * Math.pow(1 + src.growth / 100, i)
      timeline[i].total += grown
    }
  })
  return timeline
}

export default function IncomeTimelineChart({ data, locale, currency }) {
  const format = v => formatCurrency(v, locale, currency)
  return (
    <ResponsiveContainer width="100%" height={300} role="img" aria-label="Income timeline chart">
      <LineChart data={data}>
        <XAxis dataKey="year" />
        <YAxis />
        <Tooltip formatter={format} />
        <Legend />
        <Line type="monotone" dataKey="total" stroke="#f59e0b" name="Income" />
      </LineChart>
    </ResponsiveContainer>
  )
}
