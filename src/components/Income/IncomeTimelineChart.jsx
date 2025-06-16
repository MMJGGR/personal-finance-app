import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '../../utils/formatters'

export function generateIncomeTimeline(sources = [], start = 0, end = 0) {
  const rows = Array.from({ length: end - start + 1 }, (_, i) => ({ year: start + i }))
  sources.forEach((src, idx) => {
    if (!src.active) return
    const key = src.name || `Source ${idx + 1}`
    src.projection?.forEach(p => {
      const row = rows[p.year - start]
      if (row) row[key] = (row[key] || 0) + p.amount
    })
  })
  rows.forEach(r => {
    sources.forEach((src, idx) => {
      const key = src.name || `Source ${idx + 1}`
      if (r[key] == null) r[key] = 0
    })
  })
  return rows
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
        {Object.keys(data[0] || {})
          .filter(k => k !== 'year')
          .map(k => (
            <Line key={k} type="monotone" dataKey={k} stroke="#f59e0b" name={k} />
          ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
