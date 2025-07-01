// src/PreferencesTab.jsx
import React, { useState, useEffect, useCallback } from 'react'
import { useFinance } from '../FinanceContext'
import { usePersona } from '../PersonaContext.jsx'
import storage from '../utils/storage'
import { appendAuditLog } from '../utils/auditLog'
import sanitize from '../utils/sanitize'
import { preferencesSchema } from '../utils/validationSchemas'
import Tooltip from '../components/Tooltip.jsx'
import TaxBracketEditor from '../components/TaxBracketEditor.jsx'

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
  const [scenarioName, setScenarioName] = useState('Default')
  const [savedScenarios, setSavedScenarios] = useState(() => {
    const storedScenarios = localStorage.getItem('savedScenarios')
    return storedScenarios ? safeParse(storedScenarios, {}) : {}
  })

  // Whenever persisted settings change, reset the form
  useEffect(() => {
    setForm(settings)
  }, [settings])

  // Update both local form state and context (which persists to localStorage)
  const [errors, setErrors] = useState({})

  const handleChange = (field, value) => {
    const clean = typeof value === 'string' ? sanitize(value) : value
    let updatedForm = { ...form, [field]: clean }

    const result = preferencesSchema.safeParse(updatedForm)
    if (!result.success) {
      const newErrors = {}
      for (const issue of result.error.issues) {
        newErrors[issue.path[0]] = issue.message
      }
      setErrors(newErrors)
    } else {
      setErrors({})
      updatedForm = result.data
    }

    appendAuditLog(storage, {
      field: `settings.${field}`,
      oldValue: form[field],
      newValue: clean,
    }, currentPersonaId)

    setForm(updatedForm)
    updateSettings(updatedForm)
  }

  const handleSaveScenario = useCallback(() => {
    setSavedScenarios(prev => {
      const newScenarios = { ...prev, [scenarioName]: form }
      localStorage.setItem('savedScenarios', JSON.stringify(newScenarios))
      return newScenarios
    })
  }, [scenarioName, form])

  const handleLoadScenario = useCallback(() => {
    const scenario = savedScenarios[scenarioName]
    if (scenario) {
      setForm(scenario)
      updateSettings(scenario)
    }
  }, [scenarioName, savedScenarios, updateSettings])

  const handleDeleteScenario = useCallback(() => {
    setSavedScenarios(prev => {
      const newScenarios = { ...prev }
      delete newScenarios[scenarioName]
      localStorage.setItem('savedScenarios', JSON.stringify(newScenarios))
      return newScenarios
    })
    setScenarioName('Default')
  }, [scenarioName])

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

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-700">Scenario Management</h3>
        <div className="flex space-x-2">
          <input
            type="text"
            value={scenarioName}
            onChange={e => setScenarioName(e.target.value)}
            placeholder="Scenario Name"
            className="border rounded-md p-2 flex-1"
          />
          <button
            onClick={handleSaveScenario}
            className="bg-green-500 text-white px-4 py-2 rounded-md"
          >
            Save
          </button>
          <select
            value={scenarioName}
            onChange={e => setScenarioName(e.target.value)}
            className="border rounded-md p-2 flex-1"
          >
            <option value="">Load Scenario...</option>
            {Object.keys(savedScenarios).map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <button
            onClick={handleLoadScenario}
            className="bg-blue-500 text-white px-4 py-2 rounded-md"
          >
            Load
          </button>
          <button
            onClick={handleDeleteScenario}
            className="bg-red-500 text-white px-4 py-2 rounded-md"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inflation Rate */}
        <label className="block">
          <span className="text-sm text-slate-600">Inflation Rate (%)</span>
          <Tooltip content="The annual rate at which the cost of goods and services is expected to increase." />
          <input
            type="number"
            value={form.inflationRate}
            onChange={e => handleChange('inflationRate', parseFloat(e.target.value) || 0)}
            className="w-full border rounded-md p-2"
            title="Inflation rate"
          />
          {errors.inflationRate && <p className="text-red-500 text-xs mt-1">{errors.inflationRate}</p>}
        </label>

        {/* Expected Return */}
        <label className="block">
          <span className="text-sm text-slate-600">Expected Annual Return (%)</span>
          <Tooltip content="The average annual rate of return expected on investments." />
          <input
            type="number"
            value={form.expectedReturn}
            onChange={e => handleChange('expectedReturn', parseFloat(e.target.value) || 0)}
            className="w-full border rounded-md p-2"
            title="Expected annual return"
          />
          {errors.expectedReturn && <p className="text-red-500 text-xs mt-1">{errors.expectedReturn}</p>}
        </label>

        {/* Discount Rate */}
        <label className="block">
          <span className="text-sm text-slate-600">Discount Rate (%)</span>
          <Tooltip content="The rate used to calculate the present value of future cash flows." />
          <input
            type="number"
            value={form.discountRate}
            onChange={e => handleChange('discountRate', parseFloat(e.target.value) || 0)}
            className="w-full border rounded-md p-2"
            title="Discount rate"
          />
          {errors.discountRate && <p className="text-red-500 text-xs mt-1">{errors.discountRate}</p>}
        </label>

        {/* Projection Years */}
        <label className="block">
          <span className="text-sm text-slate-600">Projection Years</span>
          <Tooltip content="The number of years into the future for financial projections." />
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
          {errors.projectionYears && <p className="text-red-500 text-xs mt-1">{errors.projectionYears}</p>}
        </label>

        {/* Currency */}
        <label className="block">
          <span className="text-sm text-slate-600">Default Currency</span>
          <Tooltip content="The primary currency used for all financial calculations and displays." />
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
          {errors.currency && <p className="text-red-500 text-xs mt-1">{errors.currency}</p>}
        </label>

        {/* Locale */}
        <label className="block">
          <span className="text-sm text-slate-600">Locale</span>
          <Tooltip content="The locale used for number and date formatting." />
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
          {errors.locale && <p className="text-red-500 text-xs mt-1">{errors.locale}</p>}
        </label>

        {/* Discretionary Warning Threshold */}
        <label className="block">
          <span className="text-sm text-slate-600">Discretionary Warning Threshold (%)</span>
          <Tooltip content="The percentage of monthly expenses above which a warning is triggered for discretionary spending." />
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
          {errors.discretionaryCutThreshold && <p className="text-red-500 text-xs mt-1">{errors.discretionaryCutThreshold}</p>}
        </label>

        {/* Survival Threshold Months */}
        <label className="block">
          <span className="text-sm text-slate-600">Survival Threshold (months)</span>
          <Tooltip content="The minimum number of months of expenses that should be covered by liquid assets." />
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
          {errors.survivalThresholdMonths && <p className="text-red-500 text-xs mt-1">{errors.survivalThresholdMonths}</p>}
        </label>

        {/* Retirement Age */}
        <label className="block">
          <span className="text-sm text-slate-600">Retirement Age</span>
          <Tooltip content="The age at which retirement planning calculations are based." />
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
          {errors.retirementAge && <p className="text-red-500 text-xs mt-1">{errors.retirementAge}</p>}
        </label>

        {/* Buffer Percentage */}
        <label className="block">
          <span className="text-sm text-slate-600">Buffer Percentage (%)</span>
          <Tooltip content="A percentage of income or expenses to keep as a safety buffer." />
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
          {errors.bufferPct && <p className="text-red-500 text-xs mt-1">{errors.bufferPct}</p>}
        </label>

        {/* Risk Capacity Score */}
        <label className="block">
          <span className="text-sm text-slate-600">Risk Capacity Score</span>
          <Tooltip content="Your ability to take financial risks, based on factors like income stability and net worth." />
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
          {errors.riskCapacityScore && <p className="text-red-500 text-xs mt-1">{errors.riskCapacityScore}</p>}
        </label>

        {/* Risk Willingness Score */}
        <label className="block">
          <span className="text-sm text-slate-600">Risk Willingness Score</span>
          <Tooltip content="Your psychological comfort with taking financial risks." />
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
          {errors.riskWillingnessScore && <p className="text-red-500 text-xs mt-1">{errors.riskWillingnessScore}</p>}
        </label>

        {/* Liquidity Bucket Days */}
        <label className="block">
          <span className="text-sm text-slate-600">Liquidity Bucket Days</span>
          <Tooltip content="The number of days of expenses that should be held in highly liquid assets." />
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
          {errors.liquidityBucketDays && <p className="text-red-500 text-xs mt-1">{errors.liquidityBucketDays}</p>}
        </label>

        {/* Tax Brackets */}
        <div className="block md:col-span-2">
          <span className="text-sm text-slate-600">Tax Brackets</span>
          <Tooltip content="Define your tax brackets here. Ensure min values are ascending and max values are greater than min values." />
          <TaxBracketEditor
            taxBrackets={form.taxBrackets}
            onChange={newBrackets => handleChange('taxBrackets', newBrackets)}
          />
          {errors.taxBrackets && <p className="text-red-500 text-xs mt-1">{errors.taxBrackets}</p>}
        </div>

        {/* Pension Contribution Relief (%) */}
        <label className="block">
          <span className="text-sm text-slate-600">Pension Contribution Relief (%)</span>
          <Tooltip content="The percentage of pension contributions eligible for tax relief." />
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
          {errors.pensionContributionReliefPct && <p className="text-red-500 text-xs mt-1">{errors.pensionContributionReliefPct}</p>}
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
            <Tooltip content="Include expenses with medium priority in Present Value calculations." />
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="mr-2"
              checked={includeLowPV}
              onChange={e => setIncludeLowPV(e.target.checked)}
            />
            Include Low Priority PV
            <Tooltip content="Include expenses with low priority in Present Value calculations." />
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="mr-2"
              checked={includeGoalsPV}
              onChange={e => setIncludeGoalsPV(e.target.checked)}
            />
            Include Goals PV
            <Tooltip content="Include financial goals in Present Value calculations." />
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="mr-2"
              checked={includeLiabilitiesNPV}
              onChange={e => setIncludeLiabilitiesNPV(e.target.checked)}
            />
            Include Liabilities NPV
            <Tooltip content="Include Net Present Value of liabilities in overall financial calculations." />
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
          {errors.apiEndpoint && <p className="text-red-500 text-xs mt-1">{errors.apiEndpoint}</p>}
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm text-slate-600">Auth Token (for API)</span>
          <input
            type="password"
            value={form.authToken || ''}
            onChange={e => handleChange('authToken', e.target.value)}
            placeholder="••••••••••••••••"
            className="w-full border rounded-md p-2"
            title="Auth token"
          />
          {errors.authToken && <p className="text-red-500 text-xs mt-1">{errors.authToken}</p>}
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
