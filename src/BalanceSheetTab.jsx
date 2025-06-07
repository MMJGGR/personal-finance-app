import React, { useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useFinance } from './FinanceContext'

const COLORS = ['#fbbf24', '#f59e0b', '#fde68a', '#eab308', '#fcd34d', '#fef3c7']

export default function BalanceSheetTab() {
  const {
    incomePV,
    expensesPV,
    assetsList,
    setAssetsList,
    createAsset,
    liabilitiesList,
    setLiabilitiesList,
  } = useFinance()

  // Keep PV of Lifetime Income in sync with context changes
  useEffect(() => {
    setAssetsList(prev => {
      const idx = prev.findIndex(a => a.id === 'pv-income')
      if (idx === -1) {
        return [...prev, { id: 'pv-income', name: 'PV of Lifetime Income', amount: incomePV }]
      }
      const updated = [...prev]
      updated[idx] = { ...updated[idx], amount: incomePV }
      return updated
    })
  }, [incomePV, setAssetsList])

  // Keep PV of Lifetime Expenses in sync with context changes
  useEffect(() => {
    setLiabilitiesList(prev => {
      const idx = prev.findIndex(l => l.id === 'pv-expenses')
      if (idx === -1) {
        return [...prev, { id: 'pv-expenses', name: 'PV of Lifetime Expenses', amount: expensesPV }]
      }
      const updated = [...prev]
      updated[idx] = { ...updated[idx], amount: expensesPV }
      return updated
    })
  }, [expensesPV, setLiabilitiesList])

  const totalAssets = assetsList.reduce((sum, a) => sum + Number(a.amount || 0), 0)
  const totalLiabilities = liabilitiesList.reduce((sum, l) => sum + Number(l.amount || 0), 0)
  const netWorth = totalAssets - totalLiabilities
  const debtAssetRatio = totalAssets > 0 ? totalLiabilities / totalAssets : 0

  const addAsset = () =>
    setAssetsList([...assetsList, createAsset()])
  const addLiability = () =>
    setLiabilitiesList([...liabilitiesList, { id: crypto.randomUUID(), name: '', amount: 0 }])

  const validateAsset = (asset, idx, list) => {
    if (
      list.some((a, i) => i !== idx && a.name && a.name.toLowerCase() === asset.name.toLowerCase())
    ) {
      alert('Asset names must be unique.')
      return false
    }
    const er = asset.expectedReturn ?? 0
    const vol = asset.volatility ?? 0
    if (er < 0 || er > 20 || vol < 0 || vol > 30) {
      alert('Expected return must be 0-20% and volatility 0-30%.')
      return false
    }
    return true
  }

  const updateItem = (setList, list, index, field, value) => {
    const updatedItem = {
      ...list[index],
      [field]: field === 'amount' ? Number(value) : value,
    }
    const updated = list.map((it, i) => (i === index ? updatedItem : it))
    if (setList === setAssetsList && !validateAsset(updatedItem, index, list)) return
    setList(updated)
  }

  const barData = [
    { name: 'Assets', value: totalAssets },
    { name: 'Liabilities', value: totalLiabilities },
    { name: 'Net Worth', value: netWorth }
  ]

  const pieData = [
    ...assetsList.map(a => ({ name: a.name, value: a.amount })),
    ...liabilitiesList.map(l => ({ name: l.name, value: -l.amount }))
  ]

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-xl font-semibold text-amber-700">Lifetime Balance Sheet</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-md font-medium mb-2">Assets</h3>
          {assetsList.map((item, i) => (
            <div key={item.id} className="flex space-x-2 mb-2">
              <input
                className="border p-2 rounded-md w-1/2"
                value={item.name}
                onChange={e => updateItem(setAssetsList, assetsList, i, 'name', e.target.value)}
                disabled={item.id === 'pv-income'}
                title="Asset name"
              />
              <input
                type="number"
                className="border p-2 rounded-md w-1/2"
                value={item.amount}
                onChange={e => updateItem(setAssetsList, assetsList, i, 'amount', e.target.value)}
                title="Asset amount"
              />
            </div>
          ))}
          <button
            onClick={addAsset}
            className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700"
            aria-label="Add asset"
            title="Add asset"
          >
            + Add Asset
          </button>
        </div>

        <div>
          <h3 className="text-md font-medium mb-2">Liabilities</h3>
          {liabilitiesList.map((item, i) => (
            <div key={item.id} className="flex space-x-2 mb-2">
              <input
                className="border p-2 rounded-md w-1/2"
                value={item.name}
                onChange={e => updateItem(setLiabilitiesList, liabilitiesList, i, 'name', e.target.value)}
                disabled={item.id === 'pv-expenses'}
                title="Liability name"
              />
              <input
                type="number"
                className="border p-2 rounded-md w-1/2"
                value={item.amount}
                onChange={e => updateItem(setLiabilitiesList, liabilitiesList, i, 'amount', e.target.value)}
                title="Liability amount"
              />
            </div>
          ))}
          <button
            onClick={addLiability}
            className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700"
            aria-label="Add liability"
            title="Add liability"
          >
            + Add Liability
          </button>
        </div>
      </div>

      <div className="text-md text-slate-700 italic">
        Net Worth: <span className="text-2xl font-bold text-amber-700">KES {netWorth.toLocaleString()}</span>
        {debtAssetRatio > 1 && (
          <span className="block text-red-600 text-sm">Warning: Debt exceeds assets ({(debtAssetRatio * 100).toFixed(1)}%).</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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
