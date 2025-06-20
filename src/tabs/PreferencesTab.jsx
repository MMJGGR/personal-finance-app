// src/PreferencesTab.jsx
import React, { useState, useEffect } from 'react'
import { useFinance } from '../FinanceContext'
import sanitize from '../utils/sanitize'

export default function PreferencesTab() {
  const {
    settings,
    updateSettings,
    includeMediumPV,
    setIncludeMediumPV,
    includeLowPV,
    setIncludeLowPV,
    includeGoalsPV,
    setIncludeGoalsPV,
    includeLiabilitiesNPV,
    setIncludeLiabilitiesNPV,
  } = useFinance()
  const [form, setForm] = useState(settings)

  // Whenever persisted settings change, reset the form
  useEffect(() => {
    setForm(settings)
  }, [settings])

  // Update both local form state and context (which persists to localStorage)
  const handleChange = (field, value) => {
    const clean = typeof value === 'string' ? sanitize(value) : value
    const updated = { ...form, [field]: clean }
    setForm(updated)
    updateSettings(updated)
  }

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold text-amber-800">Global Settings</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inflation Rate */}
        <label className="block">
          <span className="text-sm text-slate-600">Inflation Rate (%)</span>
          <input
            type="number"
            value={form.inflationRate}
            onChange={e => handleChange('inflationRate', parseFloat(e.target.value) || 0)}
            className="w-full border rounded-md p-2"
            title="Inflation rate"
          />
        </label>

        {/* Expected Return */}
        <label className="block">
          <span className="text-sm text-slate-600">Expected Annual Return (%)</span>
          <input
            type="number"
            value={form.expectedReturn}
            onChange={e => handleChange('expectedReturn', parseFloat(e.target.value) || 0)}
            className="w-full border rounded-md p-2"
            title="Expected annual return"
          />
        </label>

        {/* Currency */}
        <label className="block">
          <span className="text-sm text-slate-600">Default Currency</span>
          <select
            value={form.currency}
            onChange={e => handleChange('currency', e.target.value)}
            className="w-full border rounded-md p-2"
            title="Default currency"
          >
            <option value="KES">KES</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </label>

        {/* Locale */}
        <label className="block">
          <span className="text-sm text-slate-600">Locale</span>
          <select
            value={form.locale}
            onChange={e => handleChange('locale', e.target.value)}
            className="w-full border rounded-md p-2"
            title="Locale"
          >
            <option value="en-KE">English (Kenya)</option>
            <option value="en-US">English (US)</option>
            <option value="fr-FR">Français (France)</option>
          </select>
        </label>

        {/* Discretionary Warning Threshold */}
        <label className="block">
          <span className="text-sm text-slate-600">Discretionary Warning Threshold (%)</span>
          <input
            type="number"
            min={0}
            max={100}
            value={form.discretionaryCutThreshold}
            onChange={e =>
              handleChange(
                'discretionaryCutThreshold',
                Math.min(100, Math.max(0, parseFloat(e.target.value) || 0))
              )
            }
            className="w-full border rounded-md p-2"
            title="Threshold as % of monthly expenses"
          />
        </label>

        {/* Survival Threshold Months */}
        <label className="block">
          <span className="text-sm text-slate-600">Survival Threshold (months)</span>
          <input
            type="number"
            min={0}
            value={form.survivalThresholdMonths}
            onChange={e =>
              handleChange('survivalThresholdMonths', Math.max(0, parseInt(e.target.value) || 0))
            }
            className="w-full border rounded-md p-2"
            title="Survival threshold months"
          />
        </label>

        {/* Retirement Age */}
        <label className="block">
          <span className="text-sm text-slate-600">Retirement Age</span>
          <input
            type="number"
            min={0}
            value={form.retirementAge}
            onChange={e =>
              handleChange('retirementAge', Math.max(0, parseInt(e.target.value) || 0))
            }
            className="w-full border rounded-md p-2"
            title="Retirement age"
          />
        </label>

        {/* Buffer Percentage */}
        <label className="block">
          <span className="text-sm text-slate-600">Buffer Percentage (%)</span>
          <input
            type="number"
            min={0}
            max={100}
            value={form.bufferPct}
            onChange={e =>
              handleChange('bufferPct', Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))
            }
            className="w-full border rounded-md p-2"
            title="Buffer percentage"
          />
        </label>

        {/* PV Inclusion Options */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="mr-2"
              checked={includeMediumPV}
              onChange={e => setIncludeMediumPV(e.target.checked)}
            />
            Include Medium Priority PV
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="mr-2"
              checked={includeLowPV}
              onChange={e => setIncludeLowPV(e.target.checked)}
            />
            Include Low Priority PV
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="mr-2"
              checked={includeGoalsPV}
              onChange={e => setIncludeGoalsPV(e.target.checked)}
            />
            Include Goals PV
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="mr-2"
              checked={includeLiabilitiesNPV}
              onChange={e => setIncludeLiabilitiesNPV(e.target.checked)}
            />
            Include Liabilities NPV
          </label>
        </div>

        {/* API Endpoint */}
        <label className="block md:col-span-2">
          <span className="text-sm text-slate-600">API Endpoint (for exports)</span>
          <input
            type="url"
            value={form.apiEndpoint}
            onChange={e => handleChange('apiEndpoint', e.target.value)}
            placeholder="https://api.your-backend.com/submit"
            className="w-full border rounded-md p-2"
            title="API endpoint"
          />
        </label>
      </div>

      <div className="text-right text-sm text-slate-500 italic">
        Settings auto–save on change and feed into all calculations (e.g., PV, projections, currency formatting).
      </div>
    </div>
  )
}
