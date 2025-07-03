// src/PreferencesTab.jsx
import React, { useState, useEffect } from 'react'
import { useFinance } from '../FinanceContext'
import { usePersona } from '../PersonaContext.jsx'
import sanitize from '../utils/sanitize'

function safeParse(str, fallback) {
  try {
    return JSON.parse(str)
  } catch {
    return fallback
  }
}

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
    profile,
  } = useFinance()
  const { currentData } = usePersona()
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

  const resetDefaults = () => {
    const base = {
      startYear: new Date().getFullYear(),
      projectionYears: profile.lifeExpectancy - profile.age,
      chartView: 'nominal',
      discountRate: 0,
      inflationRate: 5,
      expectedReturn: 8,
      standardDeviation: 15,
      currency: '',
      locale: 'en-KE',
      apiEndpoint: '',
      discretionaryCutThreshold: 0,
      survivalThresholdMonths: 0,
      bufferPct: 0,
      retirementAge: 65,
      riskCapacityScore: 0,
      riskWillingnessScore: 0,
      liquidityBucketDays: 0,
      taxBrackets: [],
      pensionContributionReliefPct: 0,
      pensionType: 'Annuity',
    }
    const persona = currentData?.settings || {}
    const merged = { ...base, ...persona }
    setForm(merged)
    updateSettings(merged)
    setIncludeMediumPV(
      currentData?.includeMediumPV ?? true
    )
    setIncludeLowPV(currentData?.includeLowPV ?? true)
    setIncludeGoalsPV(currentData?.includeGoalsPV ?? false)
    setIncludeLiabilitiesNPV(currentData?.includeLiabilitiesNPV ?? false)
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

        {/* Discount Rate */}
        <label className="block">
          <span className="text-sm text-slate-600">Discount Rate (%)</span>
          <input
            type="number"
            value={form.discountRate}
            onChange={e => handleChange('discountRate', parseFloat(e.target.value) || 0)}
            className="w-full border rounded-md p-2"
            title="Discount rate"
          />
        </label>

        {/* Projection Years */}
        <label className="block">
          <span className="text-sm text-slate-600">Projection Years</span>
          <input
            type="number"
            min={1}
            value={form.projectionYears}
            onChange={e =>
              handleChange(
                'projectionYears',
                Math.max(1, parseInt(e.target.value) || 1)
              )
            }
            className="w-full border rounded-md p-2"
            title="Projection years"
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

        {/* Risk Capacity Score */}
        <label className="block">
          <span className="text-sm text-slate-600">Risk Capacity Score</span>
          <input
            type="number"
            min={0}
            value={form.riskCapacityScore}
            onChange={e =>
              handleChange('riskCapacityScore', parseFloat(e.target.value) || 0)
            }
            className="w-full border rounded-md p-2"
            title="Risk capacity score"
          />
        </label>

        {/* Risk Willingness Score */}
        <label className="block">
          <span className="text-sm text-slate-600">Risk Willingness Score</span>
          <input
            type="number"
            min={0}
            value={form.riskWillingnessScore}
            onChange={e =>
              handleChange('riskWillingnessScore', parseFloat(e.target.value) || 0)
            }
            className="w-full border rounded-md p-2"
            title="Risk willingness score"
          />
        </label>

        {/* Liquidity Bucket Days */}
        <label className="block">
          <span className="text-sm text-slate-600">Liquidity Bucket Days</span>
          <input
            type="number"
            min={0}
            value={form.liquidityBucketDays}
            onChange={e =>
              handleChange('liquidityBucketDays', Math.max(0, parseInt(e.target.value) || 0))
            }
            className="w-full border rounded-md p-2"
            title="Liquidity bucket days"
          />
        </label>

        {/* Tax Brackets */}
        <label className="block md:col-span-2">
          <span className="text-sm text-slate-600">Tax Brackets (JSON)</span>
          <textarea
            value={JSON.stringify(form.taxBrackets || [], null, 2)}
            onChange={e => handleChange('taxBrackets', safeParse(e.target.value, []))}
            className="w-full border rounded-md p-2 font-mono"
            rows={3}
            title="Tax brackets"
          />
        </label>

        {/* Pension Contribution Relief (%) */}
        <label className="block">
          <span className="text-sm text-slate-600">Pension Contribution Relief (%)</span>
          <input
            type="number"
            min={0}
            max={100}
            value={form.pensionContributionReliefPct}
            onChange={e =>
              handleChange(
                'pensionContributionReliefPct',
                Math.min(100, Math.max(0, parseFloat(e.target.value) || 0))
              )
            }
            className="w-full border rounded-md p-2"
            title="Pension contribution relief"
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

      <div className="text-right">
        <button
          onClick={resetDefaults}
          className="mt-2 border border-amber-600 px-4 py-1 rounded-md text-sm hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Reset settings to defaults"
        >
          Reset Defaults
        </button>
      </div>

      <div className="text-right text-sm text-slate-500 italic">
        Settings auto–save on change and feed into all calculations (e.g., PV, projections, currency formatting).
      </div>
    </div>
  )
}
