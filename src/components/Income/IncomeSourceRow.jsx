import React from 'react'

export default function IncomeSourceRow({ income, index, updateIncome, deleteIncome, currency, assetsList = [] }) {
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

      {income.type === 'Kenyan Salary' ? (
        <>
          <label className="block text-sm font-medium mt-2">Gross Monthly Salary ({currency})</label>
          <input
            type="number"
            className="w-full border p-2 rounded-md"
            value={grossSalary}
            onChange={e => setGrossSalary(Number(e.target.value))}
            min={0}
            step={0.01}
            required
            aria-label="Gross monthly salary"
            title="Gross monthly salary"
          />
          {nssfContributions && (
            <div className="mt-2 text-sm text-gray-600">
              <p>Employee NSSF: {formatCurrency(nssfContributions.employeeContribution, locale, currency)}</p>
              <p>Employer NSSF: {formatCurrency(nssfContributions.employerContribution, locale, currency)}</p>
              <p>Total NSSF: {formatCurrency(nssfContributions.totalContribution, locale, currency)}</p>
              <label className="block text-sm font-medium mt-2">
                <input
                  type="checkbox"
                  checked={contractedOutTier2}
                  onChange={e => setContractedOutTier2(e.target.checked)}
                />
                Contract out Tier II
              </label>
            </div>
          )}
          <label className="block text-sm font-medium mt-2">Taxable Income ({currency})</label>
          <input
            type="number"
            className="w-full border p-2 rounded-md bg-gray-100"
            value={grossSalary - (nssfContributions ? nssfContributions.employeeContribution : 0)}
            readOnly
            aria-label="Taxable income"
            title="Taxable income"
          />
        </>
      ) : (
        <>
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
        </>
      )}

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

      <label className="block text-sm font-medium mt-2">Start Age (optional)</label>
      <input
        type="number"
        className="w-full border p-2 rounded-md"
        value={income.startAge ?? ''}
        onChange={e => {
          const val = e.target.value === '' ? null : Number(e.target.value)
          updateIncome(index, 'startAge', val)
        }}
        aria-label="Start age"
        title="Start age"
      />

      <label className="block text-sm font-medium mt-2">End Year (optional)</label>
      <input
        type="number"
        className="w-full border p-2 rounded-md"
        value={income.endYear ?? ''}
        onChange={e => updateIncome(index, 'endYear', Number(e.target.value) || null)}
        placeholder="Auto"
        aria-label="End year"
        title="End year"
      />

      <label className="block text-sm font-medium mt-2">Linked Asset (optional)</label>
      <select
        className="w-full border p-2 rounded-md"
        value={income.linkedAssetId}
        onChange={e => updateIncome(index, 'linkedAssetId', e.target.value)}
        aria-label="Linked asset"
        title="Linked asset"
      >
        <option value="">-- None --</option>
        {assetsList.map(asset => (
          <option key={asset.id} value={asset.id}>{asset.name || asset.type}</option>
        ))}
      </select>

      <label className="block text-sm font-medium mt-2">
        <input
          type="checkbox"
          checked={income.taxed !== false}
          onChange={e => updateIncome(index, 'taxed', e.target.checked)}
        />
        Subject to Tax
      </label>

      <label className="block text-sm font-medium mt-2">
        <input
          type="checkbox"
          checked={income.active}
          onChange={e => updateIncome(index, 'active', e.target.checked)}
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
