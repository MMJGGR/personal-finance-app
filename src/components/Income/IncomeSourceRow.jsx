import React from 'react'

export default function IncomeSourceRow({ income, index, updateIncome, deleteIncome, currency }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-md relative transition-all">
      <label className="block text-sm font-medium">Source Name</label>
      <input
        type="text"
        className="w-full border p-2 rounded-md"
        value={income.name}
        onChange={e => updateIncome(index, 'name', e.target.value)}
        required
        aria-label="Income source name"
        title="Income source name"
      />

      <label className="block text-sm font-medium mt-2">Type</label>
      <select
        className="w-full border p-2 rounded-md"
        value={income.type}
        onChange={e => updateIncome(index, 'type', e.target.value)}
        aria-label="Income type"
        title="Income type"
      >
        <option value="Salary">Salary</option>
        <option value="Rental">Rental</option>
        <option value="Bond">Bond</option>
        <option value="Dividend">Dividend</option>
      </select>

      <label className="block text-sm font-medium mt-2">Amount ({currency})</label>
      <input
        type="number"
        className="w-full border p-2 rounded-md"
        value={income.amount}
        onChange={e => {
          let val = Number(e.target.value)
          if (val < 0) val = 0
          updateIncome(index, 'amount', val)
        }}
        min={0}
        step={0.01}
        required
        aria-label="Income amount"
        title="Income amount"
      />

      <label className="block text-sm font-medium mt-2">Frequency (/yr)</label>
      <input
        type="number"
        className="w-full border p-2 rounded-md"
        value={income.frequency}
        onChange={e => {
          let val = Number(e.target.value)
          if (val < 1) val = 1
          updateIncome(index, 'frequency', val)
        }}
        min={1}
        required
        aria-label="Payments per year"
        title="Payments per year"
      />

      <label className="block text-sm font-medium mt-2">Growth Rate (%)</label>
      <input
        type="number"
        className="w-full border p-2 rounded-md"
        value={income.growth}
        onChange={e => {
          let val = Number(e.target.value)
          if (val < 0) val = 0
          if (val > 20) val = 20
          updateIncome(index, 'growth', val)
        }}
        step={0.1}
        min={0}
        max={20}
        aria-label="Growth rate"
        title="Growth rate"
      />

      <label className="block text-sm font-medium mt-2">Tax Rate (%)</label>
      <input
        type="number"
        className="w-full border p-2 rounded-md"
        value={income.taxRate}
        onChange={e => updateIncome(index, 'taxRate', Number(e.target.value))}
        min={0}
        max={100}
        step={0.1}
        required
        aria-label="Tax rate"
        title="Tax rate"
      />

      <label className="block text-sm font-medium mt-2">Start Year</label>
      <input
        type="number"
        className="w-full border p-2 rounded-md"
        value={income.startYear}
        onChange={e => updateIncome(index, 'startYear', e.target.value)}
        aria-label="Start year"
        title="Start year"
      />

      <label className="block text-sm font-medium mt-2">End Year (optional)</label>
      <input
        type="number"
        className="w-full border p-2 rounded-md"
        value={income.endYear ?? ''}
        onChange={e => updateIncome(index, 'endYear', e.target.value)}
        aria-label="End year"
        title="End year"
      />

      <label className="block text-sm font-medium mt-2">Linked Asset ID (optional)</label>
      <input
        type="text"
        className="w-full border p-2 rounded-md"
        value={income.linkedAssetId || ''}
        onChange={e => updateIncome(index, 'linkedAssetId', e.target.value)}
        aria-label="Linked Asset ID (optional)"
        title="Linked Asset ID"
      />

      <label className="block text-sm font-medium mt-2">
        <input
          type="checkbox"
          className="mr-1"
          checked={income.active}
          onChange={e => updateIncome(index, 'active', e.target.checked)}
          aria-label="Include this income in projection"
          title="Include this income in projection"
        />
        Include in Projection
      </label>

      <button
        onClick={() => {
          if (window.confirm(`Delete ${income.name}?`)) deleteIncome(index)
        }}
        className="absolute top-1 right-1 text-xl"
        aria-label={`Delete ${income.name} income stream`}
        title={`Delete ${income.name}`}
      >
        ❌
      </button>
    </div>
  )
}
