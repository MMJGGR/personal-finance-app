import React, { useMemo } from 'react'
import { useFinance } from '../../FinanceContext'
import { formatCurrency } from '../../utils/formatters'
import AssetRow from './AssetRow'


  
  export default function InvestmentsTab() {
  const { assetsList, setAssetsList, settings } = useFinance()


  const handleAssetChange = (id, field, value) => {
    setAssetsList(prev =>
      prev.map(asset => (asset.id === id ? { ...asset, [field]: value } : asset))
    )
  }

  const addAsset = () => {
    setAssetsList(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: '',
        amount: 0,
        type: 'Cash',
        expectedReturn: 0,
        volatility: 0,
        horizonYears: 0,
        purchaseYear: new Date().getFullYear(),
        saleYear: null,
        principal: 0,
      },
    ])
  }

  const removeAsset = id => {
    if (window.confirm('Delete this asset?')) {
      setAssetsList(prev => prev.filter(asset => asset.id !== id))
    }
  }

  const totalAssets = useMemo(() => {
    return assetsList.reduce((sum, asset) => sum + (Number(asset.amount) || 0), 0)
  }, [assetsList])

  return (
    <div className="space-y-8 p-6">
      <h2 className="text-2xl font-bold text-amber-800">Investments</h2>

      <section>
        <h3 className="text-xl font-bold text-amber-800 mb-4">Asset List</h3>
        <div className="grid gap-4">
          {assetsList.length === 0 && (
            <p className="italic text-slate-500 col-span-full text-center">No assets added yet</p>
          )}
          {assetsList.map(asset => (
            <AssetRow
              key={asset.id}
              asset={asset}
              onChange={handleAssetChange}
              onDelete={removeAsset}
              currency={settings.currency}
            />
          ))}
        </div>
        <button
          onClick={addAsset}
          className="mt-4 bg-amber-400 hover:bg-amber-300 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          ➕ Add Asset
        </button>
      </section>

      <section className="bg-white p-4 rounded-xl shadow-md">
        <h3 className="text-lg font-bold text-amber-800 mb-2">Portfolio Summary</h3>
        <p>Total Assets: {formatCurrency(totalAssets, settings.locale, settings.currency)}</p>
        {/* Add more portfolio overview details here, e.g., allocation pie chart */}
      </section>
    </div>
  )
}
