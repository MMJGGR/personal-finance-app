import React, { useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useFinance } from './FinanceContext'
import { formatCurrency } from './utils/formatters'

export default function IncomeChart() {
  const { startYear, years, annualIncome, annualIncomePV, settings } = useFinance()
  const [mode, setMode] = useState('nominal')
  const data = useMemo(() => {
    const vals = mode === 'nominal' ? annualIncome : annualIncomePV
    return vals.map((v, idx) => ({
      year: String(startYear + idx),
      income: Number(v.toFixed(2)),
    }))
  }, [mode, annualIncome, annualIncomePV, startYear])
  const format = value => formatCurrency(value, settings.locale, settings.currency)
  return (
    <section className="bg-white p-4 rounded-xl shadow-md h-80">
      <div className="mb-2">
        <button
          onClick={() => setMode('nominal')}
          className={`px-3 py-1 rounded-full text-sm mr-2 ${
            mode === 'nominal' ? 'bg-amber-400 text-white' : 'bg-slate-200 text-slate-700'
          }`}
        >
          Nominal
        </button>
        <button
          onClick={() => setMode('discounted')}
          className={`px-3 py-1 rounded-full text-sm ${
            mode === 'discounted' ? 'bg-amber-400 text-white' : 'bg-slate-200 text-slate-700'
          }`}
        >
          Discounted
        </button>
      </div>
      <ResponsiveContainer width="100%" height="100%" role="img" aria-label="Income chart">
        <BarChart data={data}>
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip formatter={format} />
          <Legend />
          <Bar dataKey="income" fill="#f59e0b" name="Income" />
        </BarChart>
      </ResponsiveContainer>
    </section>
  )
}
