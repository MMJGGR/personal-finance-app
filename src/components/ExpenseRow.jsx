import React from 'react'

export default function ExpenseRow({ id, name, amount, frequency, category, startYear, endYear, onChange, onDelete }) {
  const makeId = field => `${id}-${field}`

  return (
    <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-center mb-1 bg-white p-2 rounded-md shadow relative">
      <div>
        <label htmlFor={makeId('name')} className="block text-sm font-medium">Name</label>
        <input
          id={makeId('name')}
          aria-label="Expense name"
          title="Expense name"
          type="text"
          className="border p-2 rounded-md w-full"
          value={name}
          onChange={e => onChange(id, 'name', e.target.value)}
        />
      </div>

      <div>
        <label htmlFor={makeId('amount')} className="block text-sm font-medium">Amount</label>
        <input
          id={makeId('amount')}
          aria-label="Expense amount"
          title="Expense amount"
          type="number"
          min={0}
          className="border p-2 rounded-md w-full text-right"
          value={amount}
          onChange={e => onChange(id, 'amount', e.target.value)}
        />
      </div>

      <div>
        <label htmlFor={makeId('frequency')} className="block text-sm font-medium">Payments/Yr</label>
        <input
          id={makeId('frequency')}
          aria-label="Payments per year"
          title="Payments per year (use a Goal for one-off outflows)"
          type="number"
          min={1}
          className="border p-2 rounded-md w-full text-right"
          value={frequency}
          onChange={e => onChange(id, 'frequency', e.target.value)}
        />
      </div>

      <div>
        <label htmlFor={makeId('category')} className="block text-sm font-medium">Category</label>
        <select
          id={makeId('category')}
          aria-label="Expense category"
          title="Expense category"
          className="border p-2 rounded-md w-full"
          value={category}
          onChange={e => onChange(id, 'category', e.target.value)}
        >
          <option value="Fixed">Fixed</option>
          <option value="Discretionary">Discretionary</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label htmlFor={makeId('startYear')} className="block text-sm font-medium">Start Year</label>
        <input
          id={makeId('startYear')}
          aria-label="Start year"
          title="Start year"
          type="number"
          className="border p-2 rounded-md w-full text-right"
          value={startYear ?? ''}
          onChange={e => onChange(id, 'startYear', e.target.value)}
        />
      </div>

      <div>
        <label htmlFor={makeId('endYear')} className="block text-sm font-medium">End Year</label>
        <input
          id={makeId('endYear')}
          aria-label="End year"
          title="End year"
          type="number"
          className="border p-2 rounded-md w-full text-right"
          value={endYear ?? ''}
          onChange={e => onChange(id, 'endYear', e.target.value)}
        />
      </div>

      <button
        onClick={() => onDelete(id)}
        className="absolute top-1 right-1 text-lg"
        aria-label="Delete expense"
      >
        ❌
      </button>
    </div>
  )
}
