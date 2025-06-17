import React from 'react'
import { useFinance } from '../FinanceContext'

export default function AssumptionsModal({ open, onClose }) {
  const { settings } = useFinance()
  if (!open) return null
  const items = [
    { label: 'Inflation Rate', value: `${settings.inflationRate}%` },
    { label: 'Discount Rate', value: `${settings.discountRate}%` },
    { label: 'Expected Return', value: `${settings.expectedReturn}%` },
    { label: 'Retirement Age', value: settings.retirementAge },
  ]
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow p-6 w-80" role="dialog" aria-modal="true" aria-label="Assumptions">
        <h2 className="text-lg font-semibold mb-4 text-amber-800">Assumptions</h2>
        <ul className="space-y-1 mb-4">
          {items.map(it => (
            <li key={it.label} className="flex justify-between">
              <span className="text-slate-600">{it.label}</span>
              <span className="font-medium">{it.value}</span>
            </li>
          ))}
        </ul>
        <div className="text-right">
          <button onClick={onClose} className="border border-amber-600 px-4 py-1 rounded hover:bg-amber-50">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
