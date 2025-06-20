import React, { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '../../utils/formatters'

export default function LifetimeStackedChart({ data = [], locale, currency }) {
  const [show, setShow] = useState({
    income: true,
    expenses: true,
    goals: true,
    debt: true,
    investments: true,
    pension: true
  })
  const format = v => formatCurrency(v, locale, currency)
  const toggle = key => setShow({ ...show, [key]: !show[key] })
  return (
    <div>
      <div className="mb-2 space-x-2">
        {Object.keys(show).map(key => (
          <label key={key} className="mr-2">
            <input type="checkbox" checked={show[key]} onChange={() => toggle(key)} /> {key}
          </label>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={400} role="img" aria-label="Lifetime cash flow chart">
        <AreaChart data={data}>
          <XAxis dataKey="year" />
          <YAxis tickFormatter={format} />
          <Tooltip formatter={format} />
          <Legend />
          {show.income && <Area type="monotone" dataKey="income" stackId="1" stroke="#4ade80" fill="#bbf7d0" name="Income" />}
          {show.expenses && <Area type="monotone" dataKey="expenses" stackId="1" stroke="#f87171" fill="#fecaca" name="Expenses" />}
          {show.goals && <Area type="monotone" dataKey="goals" stackId="1" stroke="#60a5fa" fill="#bfdbfe" name="Goals" />}
          {show.debt && (
            <Area
              type="monotone"
              dataKey="debtService"
              stackId="1"
              stroke="#fbbf24"
              fill="#fde68a"
              name="Debt"
            />
          )}
          {show.investments && (
            <Area
              type="monotone"
              dataKey="investments"
              stackId="1"
              stroke="#a855f7"
              fill="#e9d5ff"
              name="Investments"
            />
          )}
          {show.pension && (
            <Area
              type="monotone"
              dataKey="pension"
              stackId="1"
              stroke="#14b8a6"
              fill="#99f6e4"
              name="Pension"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
