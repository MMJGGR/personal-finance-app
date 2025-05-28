import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useFinance } from './FinanceContext'

const COLORS = ['#fbbf24', '#f59e0b', '#fde68a', '#eab308', '#fcd34d', '#fef3c7']

export default function BalanceSheetTab() {
  const { incomePV, expensesPV } = useFinance()

  const [assets, setAssets] = useState([
    { name: 'Cash', amount: 500000 },
    { name: 'Investments', amount: 1000000 },
    { name: 'PV of Lifetime Income', amount: incomePV }
  ])

  const [liabilities, setLiabilities] = useState([
    { name: 'Business Loan', amount: 400000 },
    { name: 'PV of Lifetime Expenses', amount: expensesPV }
  ])

  const totalAssets = assets.reduce((sum, a) => sum + Number(a.amount || 0), 0)
  const totalLiabilities = liabilities.reduce((sum, l) => sum + Number(l.amount || 0), 0)
  const netWorth = totalAssets - totalLiabilities

  const addAsset = () => setAssets([...assets, { name: '', amount: 0 }])
  const addLiability = () => setLiabilities([...liabilities, { name: '', amount: 0 }])

  const updateItem = (setList, index, key, value) => {
    const newList = [...(key === 'assets' ? assets : liabilities)]
    newList[index][key === 'assets' ? 'name' : 'name'] = key === 'name' ? value : newList[index].name
    newList[index].amount = key === 'amount' ? Number(value) : newList[index].amount
    key === 'assets' ? setAssets(newList) : setLiabilities(newList)
  }

  const barData = [
    { name: 'Assets', value: totalAssets },
    { name: 'Liabilities', value: totalLiabilities },
    { name: 'Net Worth', value: netWorth }
  ]

  const pieData = [
    ...assets.map(a => ({ name: a.name, value: a.amount })),
    ...liabilities.map(l => ({ name: l.name, value: -l.amount }))
  ]

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-xl font-semibold text-amber-700">Lifetime Balance Sheet</h2>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-md font-medium mb-2">Assets</h3>
          {assets.map((item, i) => (
            <div key={i} className="flex space-x-2 mb-2">
              <input
                className="border p-2 rounded-md w-1/2"
                value={item.name}
                onChange={e => updateItem(setAssets, i, 'name', e.target.value)}
              />
              <input
                type="number"
                className="border p-2 rounded-md w-1/2"
                value={item.amount}
                onChange={e => updateItem(setAssets, i, 'amount', e.target.value)}
              />
            </div>
          ))}
          <button onClick={addAsset} className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700">
            + Add Asset
          </button>
        </div>

        <div>
          <h3 className="text-md font-medium mb-2">Liabilities</h3>
          {liabilities.map((item, i) => (
            <div key={i} className="flex space-x-2 mb-2">
              <input
                className="border p-2 rounded-md w-1/2"
                value={item.name}
                onChange={e => updateItem(setLiabilities, i, 'name', e.target.value)}
              />
              <input
                type="number"
                className="border p-2 rounded-md w-1/2"
                value={item.amount}
                onChange={e => updateItem(setLiabilities, i, 'amount', e.target.value)}
              />
            </div>
          ))}
          <button onClick={addLiability} className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700">
            + Add Liability
          </button>
        </div>
      </div>

      <div className="text-md text-slate-700 italic">
        Net Worth: <span className="text-2xl font-bold text-amber-700">KES {netWorth.toLocaleString()}</span>
      </div>

      <div className="grid grid-cols-2 gap-6 mt-6">
        <div className="bg-white p-4 rounded-xl shadow-md">
          <h4 className="font-semibold text-slate-700 mb-2">Balance Sheet Overview</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-md">
          <h4 className="font-semibold text-slate-700 mb-2">Asset/Liability Composition</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {pieData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
