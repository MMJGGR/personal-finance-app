import React from 'react'

export default function AssetRow({
  asset,
  onChange,
  onDelete,
  currency,
}) {
  const makeId = field => `${asset.id}-${field}`

  return (
    <div className="grid grid-cols-1 sm:grid-cols-7 gap-2 items-center mb-1 bg-white p-2 rounded-md shadow relative">
      <div>
        <label htmlFor={makeId('name')} className="block text-sm font-medium">Name</label>
        <input
          id={makeId('name')}
          type="text"
          className="border p-2 rounded-md w-full"
          value={asset.name}
          onChange={e => onChange(asset.id, 'name', e.target.value)}
        />
      </div>
      <div>
        <label htmlFor={makeId('amount')} className="block text-sm font-medium">Amount ({currency})</label>
        <input
          id={makeId('amount')}
          type="number"
          className="border p-2 rounded-md w-full text-right"
          value={asset.amount}
          onChange={e => onChange(asset.id, 'amount', parseFloat(e.target.value) || 0)}
        />
      </div>
      <div>
        <label htmlFor={makeId('type')} className="block text-sm font-medium">Type</label>
        <select
          id={makeId('type')}
          className="border p-2 rounded-md w-full"
          value={asset.type}
          onChange={e => onChange(asset.id, 'type', e.target.value)}
        >
          <option value="Cash">Cash</option>
          <option value="Portfolio">Portfolio</option>
          <option value="Real Estate">Real Estate</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div>
        <label htmlFor={makeId('expectedReturn')} className="block text-sm font-medium">Expected Return (%)</label>
        <input
          id={makeId('expectedReturn')}
          type="number"
          step="0.1"
          className="border p-2 rounded-md w-full text-right"
          value={asset.expectedReturn}
          onChange={e => onChange(asset.id, 'expectedReturn', parseFloat(e.target.value) || 0)}
        />
      </div>
      <div>
        <label htmlFor={makeId('volatility')} className="block text-sm font-medium">Volatility (%)</label>
        <input
          id={makeId('volatility')}
          type="number"
          step="0.1"
          className="border p-2 rounded-md w-full text-right"
          value={asset.volatility}
          onChange={e => onChange(asset.id, 'volatility', parseFloat(e.target.value) || 0)}
        />
      </div>
      <div>
        <label htmlFor={makeId('horizonYears')} className="block text-sm font-medium">Horizon (Years)</label>
        <input
          id={makeId('horizonYears')}
          type="number"
          step="1"
          className="border p-2 rounded-md w-full text-right"
          value={asset.horizonYears}
          onChange={e => onChange(asset.id, 'horizonYears', parseInt(e.target.value) || 0)}
        />
      </div>
      <button
        onClick={() => onDelete(asset.id)}
        className="absolute top-1 right-1 text-lg"
      >
        ❌
      </button>
    </div>
  )
}
