// src/IncomeTab.jsx
import React, { useState } from 'react'
import { useFinance } from './FinanceContext'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

export default function IncomeTab() {
  const currentYear = new Date().getFullYear()
  const [startYear, setStartYear] = useState(currentYear)
  const [incomeSources, setIncomeSources] = useState([
    { name: 'Salary', amount: 10000, frequency: 12, growth: 5 },
    { name: 'Rental', amount: 30000, frequency: 1, growth: 3 }
  ])
  
  const {
    discountRate, setDiscountRate,
    years, setYears,
    monthlyExpense,
    setIncomePV,
  } = useFinance()

  const handleChange = (index, field, value) => {
    const updated = [...incomeSources]
    if (field === 'name') {
      updated[index][field] = value
    } else {
      const parsed = parseFloat(value)
      updated[index][field] = isNaN(parsed) || parsed < 0 ? 0 : parsed
    }
    setIncomeSources(updated)
  }

  const addIncome = () => {
    setIncomeSources([...incomeSources, { name: '', amount: 0, frequency: 1, growth: 0 }])
  }

  const removeIncome = (index) => {
    const updated = [...incomeSources]
    updated.splice(index, 1)
    setIncomeSources(updated)
  }

  const calculatePV = (amount, freq, growth, r, n) => {
    const A = amount * freq
    if (r === growth) return A * n / (1 + r / 100)
    const g = growth / 100
    const d = r / 100
    return A * (1 - Math.pow((1 + g) / (1 + d), n)) / (d - g)
  }

  const incomeData = Array.from({ length: years }, (_, i) => {
    const year = startYear + i
    const entry = { year: `${year}` }
    incomeSources.forEach(source => {
      const annual = source.amount * source.frequency * Math.pow(1 + source.growth / 100, i)
      entry[source.name || `Source ${i + 1}`] = parseFloat(annual.toFixed(2))
    })
    return entry
  })

  const pvPerStream = incomeSources.map(src =>
    calculatePV(src.amount, src.frequency, src.growth, discountRate, years)
  )

  const totalPV = pvPerStream.reduce((a, b) => a + b, 0)
  React.useEffect(() => {
    setIncomePV(totalPV)
    localStorage.setItem('incomePV', totalPV)
  }, [totalPV, setIncomePV])


  const interruptionMonths = Math.floor((totalPV / (monthlyExpense * 12)) * 12)
  

  
  const exportJSON = () => {
    const json = {
      startYear,
      income: incomeSources,
      assumptions: { discountRate, years, monthlyExpense },
      pv: pvPerStream,
      totalPV,
    }
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'income-data.json'
    a.click()
  }
  
  const chartColors = [
    '#FBBF24', '#F59E0B', '#FDBA74', '#FB923C', '#F472B6', '#C084FC', '#34D399', '#60A5FA'
  ]

  return (
    <div className="space-y-6 col-span-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {incomeSources.map((source, index) => (
          <div key={index} className="bg-white rounded-xl shadow p-4 space-y-2 relative">
            <input
              type="text"
              placeholder="Source name"
              value={source.name}
              onChange={e => handleChange(index, 'name', e.target.value)}
              className="w-full border p-2 rounded-md"
            />
            <input
              type="number"
              placeholder="Amount (KES)"
              value={source.amount}
              onChange={e => handleChange(index, 'amount', e.target.value)}
              className="w-full border p-2 rounded-md"
            />
            <input
              type="number"
              placeholder="Frequency (per year)"
              value={source.frequency}
              onChange={e => handleChange(index, 'frequency', e.target.value)}
              className="w-full border p-2 rounded-md"
            />
            <input
              type="number"
              placeholder="Growth Rate (%)"
              value={source.growth}
              onChange={e => handleChange(index, 'growth', e.target.value)}
              className="w-full border p-2 rounded-md"
            />
            <button
              onClick={() => removeIncome(index)}
              className="absolute top-2 right-2 text-red-600 hover:text-red-800 text-sm"
            >
              ✖
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addIncome}
        className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md"
      >
        ➕ Add Income
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-4 space-y-2">
          <label className="block text-sm font-semibold">Start Year</label>
          <input
            type="number"
            value={startYear}
            onChange={e => setStartYear(parseInt(e.target.value))}
            className="w-full border p-2 rounded-md"
          />
          <label className="block text-sm font-semibold">Discount Rate (%)</label>
          <input
            type="number"
            value={discountRate}
            onChange={e => setDiscountRate(parseFloat(e.target.value))}
            className="w-full border p-2 rounded-md"
          />
          <label className="block text-sm font-semibold">Projection Years</label>
          <input
            type="number"
            value={years}
            onChange={e => setYears(parseInt(e.target.value))}
            className="w-full border p-2 rounded-md"
          />
          <p className = "text-sm text-slate-500 italic">
            Monthly Expenses (from Expenses tab): <span className="font-semibold text-[#b45309]">KES {monthlyExpense.toFixed(0)}</span>
            </p>
        </div>

        <div className="col-span-2 bg-white rounded-xl shadow p-4">
          <h2 className="text-lg font-bold text-amber-700 mb-2">💰 Present Value Summary</h2>
          <ul className="text-sm space-y-1">
            {incomeSources.map((src, i) => (
              <li key={i}>
                {src.name || `Source ${i + 1}`}: <span className="text-[#047857] font-semibold">KES {pvPerStream[i].toFixed(0)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-md font-semibold">
            Total PV: <span className="text-[#047857] text-xl">KES {totalPV.toFixed(0)}</span>
          </p>
          <p className="text-sm mt-2">
            Without income, you could survive approximately <strong>{interruptionMonths}</strong> months at KES {monthlyExpense.toLocaleString()} per month.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4 h-[300px]">
        <h2 className="text-lg font-semibold mb-2 text-amber-700">Projected Income by Year</h2>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={incomeData}>
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            {incomeSources.map((src, i) => (
              <Bar
                key={i}
                dataKey={src.name || `Source ${i + 1}`}
                stackId="a"
                fill={chartColors[i % chartColors.length]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <button
          onClick={exportJSON}
          className="bg-white border border-amber-600 text-amber-700 px-4 py-2 rounded-md hover:bg-amber-100 transition"
        >
          📁 Export Income to JSON
        </button>
      </div>
    </div>
  )
}
