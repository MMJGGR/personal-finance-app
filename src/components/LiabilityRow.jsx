import React from 'react'
import { calculateAmortizedPayment } from '../utils/financeUtils.js'

export default function LiabilityRow({
  id,
  name,
  principal,
  interestRate,
  termYears,
  paymentsPerYear,
  extraPayment,
  computedPayment,
  onChange,
  onDelete,
  onCompute,
}) {
  const makeId = field => `${id}-${field}`
  const handleChange = (field, value) => {
    if (typeof onChange === 'function') {
      onChange(id, field, value)
    }
  }
  const handleCompute = () => {
    const payment = calculateAmortizedPayment(
      Number(principal) || 0,
      Number(interestRate) || 0,
      Number(termYears) || 0,
      Number(paymentsPerYear) || 1
    )
    if (typeof onCompute === 'function') {
      onCompute(id, payment)
    } else if (typeof onChange === 'function') {
      onChange(id, 'computedPayment', payment)
    }
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-7 gap-2 items-center mb-1">
      <div>
        <label htmlFor={makeId('name')} className="sr-only">Liability name</label>
        <input
          id={makeId('name')}
          className="border p-2 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-md w-full"
          value={name || ''}
          onChange={e => handleChange('name', e.target.value)}
          aria-label="Liability name"
        />
      </div>
      <div>
        <label htmlFor={makeId('principal')} className="sr-only">Principal</label>
        <input
          id={makeId('principal')}
          type="number"
          className="border p-2 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-md text-right w-full"
          value={principal}
          onChange={e => handleChange('principal', e.target.value)}
          aria-label="Principal"
        />
      </div>
      <div>
        <label htmlFor={makeId('interestRate')} className="sr-only">Interest rate</label>
        <input
          id={makeId('interestRate')}
          type="number"
          step="0.01"
          className="border p-2 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-md text-right w-full"
          value={interestRate}
          onChange={e => handleChange('interestRate', e.target.value)}
          aria-label="Interest rate"
        />
      </div>
      <div>
        <label htmlFor={makeId('termYears')} className="sr-only">Term years</label>
        <input
          id={makeId('termYears')}
          type="number"
          className="border p-2 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-md text-right w-full"
          value={termYears}
          onChange={e => handleChange('termYears', e.target.value)}
          aria-label="Term years"
        />
      </div>
      <div>
        <label htmlFor={makeId('paymentsPerYear')} className="sr-only">Payments per year</label>
        <input
          id={makeId('paymentsPerYear')}
          type="number"
          className="border p-2 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-md text-right w-full"
          value={paymentsPerYear}
          onChange={e => handleChange('paymentsPerYear', e.target.value)}
          aria-label="Payments per year"
        />
      </div>
      <div>
        <label htmlFor={makeId('extraPayment')} className="sr-only">Extra payment</label>
        <input
          id={makeId('extraPayment')}
          type="number"
          className="border p-2 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-md text-right w-full"
          value={extraPayment}
          onChange={e => handleChange('extraPayment', e.target.value)}
          aria-label="Extra payment"
        />
      </div>
      <div className="flex flex-col items-end space-y-1">
        <div className="flex space-x-1">
          <button
            onClick={handleCompute}
            className="bg-amber-400 text-white px-2 py-1 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            aria-label="Calculate payment"
          >
            Calc
          </button>
          <button
            onClick={() => onDelete(id)}
            className="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label="Remove liability"
          >
            ✖
          </button>
        </div>
        {computedPayment != null && (
          <span className="text-xs text-right w-full">{computedPayment.toFixed(2)}</span>
        )}
      </div>
    </div>
  )
}
