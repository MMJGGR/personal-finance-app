// src/ProfileTab.jsx
import React, { useState, useEffect } from 'react'
import { useFinance } from './FinanceContext'

export default function ProfileTab() {
  const { profile, updateProfile, riskScore } = useFinance()
  const [form, setForm] = useState(profile)

  // Whenever the context’s profile changes, reset the form
  useEffect(() => {
    setForm(profile)
  }, [profile])

  // Handle any field change locally, then persist via context
  const handleChange = (field, value) => {
    const updated = { ...form, [field]: value }

    if (field === 'lifeExpectancy' && value <= updated.age) {
      updated.lifeExpectancy = updated.age + 1
    } else if (field === 'age' && updated.lifeExpectancy <= value) {
      updated.lifeExpectancy = value + 1
    }

    setForm(updated)
    updateProfile(updated)
  }

  const remainingYears = form.lifeExpectancy - form.age

  // Map numeric riskScore to a category label
  const scoreCategory = (s) => {
    if (s <= 6) return 'Conservative'
    if (s <= 12) return 'Balanced'
    return 'Growth'
  }

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold text-amber-700">
        Client Profile & Risk Assessment
      </h2>

      {/* Live Risk Score Display */}
      <div className="bg-amber-100 p-4 rounded-md">
        <p className="text-lg">
          Risk Score: <span className="font-semibold">{riskScore}</span> —{' '}
          <span className="ml-2 font-medium">{scoreCategory(riskScore)}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal & KYC Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-700">
            Personal & KYC Information
          </h3>
          {[
            ['Full Name', 'name', 'text'],
            ['Email Address', 'email', 'email'],
            ['Phone Number', 'phone', 'tel'],
            ['Age', 'age', 'number'],
            ['Life Expectancy', 'lifeExpectancy', 'number'],
            ['Marital Status', 'maritalStatus', 'select', ['', 'Single', 'Married', 'Divorced', 'Widowed']],
            ['Dependents', 'numDependents', 'number']
          ].map(([label, field, type, options]) => (
            <label key={field} className="block">
              <span className="text-sm text-slate-600">{label}</span>
              {type === 'select' ? (
                <select
                  value={form[field]}
                  onChange={e => handleChange(field, e.target.value)}
                  className="w-full border rounded-md p-2"
                  title={label}
                >
                  {options.map(o => (
                    <option key={o} value={o}>
                      {o || 'Select…'}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={type}
                  value={form[field]}
                  onChange={e =>
                    handleChange(
                      field,
                      type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                    )
                  }
                  className="w-full border rounded-md p-2"
                  title={label}
                />
              )}
            </label>
          ))}
          {remainingYears <= 0 && (
            <p className="text-red-600 text-sm">Life expectancy must exceed age.</p>
          )}

          {[
            ['Residential Address', 'residentialAddress'],
            ['Nationality', 'nationality'],
            ['ID / Passport #', 'idNumber'],
            ['Tax Residence', 'taxResidence'],
            ['Employment Status', 'employmentStatus']
          ].map(([label, field]) => (
            <label key={field} className="block">
              <span className="text-sm text-slate-600">{label}</span>
              <input
                type="text"
                value={form[field]}
                onChange={e => handleChange(field, e.target.value)}
                className="w-full border rounded-md p-2"
                title={label}
              />
            </label>
          ))}

          {[
            ['Annual Income (KES)', 'annualIncome'],
            ['Liquid Net Worth (KES)', 'liquidNetWorth']
          ].map(([label, field]) => (
            <label key={field} className="block">
              <span className="text-sm text-slate-600">{label}</span>
              <input
                type="number"
                value={form[field]}
                onChange={e => handleChange(field, parseFloat(e.target.value) || 0)}
                className="w-full border rounded-md p-2"
                title={label}
              />
            </label>
          ))}

          <label className="block">
            <span className="text-sm text-slate-600">Source of Funds</span>
            <textarea
              value={form.sourceOfFunds}
              onChange={e => handleChange('sourceOfFunds', e.target.value)}
              className="w-full border rounded-md p-2"
              rows={3}
              title="Source of funds"
            />
          </label>
        </div>

        {/* Risk Tolerance Questionnaire */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-700">
            Risk Tolerance Questionnaire
          </h3>
          {[
            ['Investment Knowledge', 'investmentKnowledge', ['', 'None', 'Basic', 'Moderate', 'Advanced']],
            ['Reaction to 20% Loss', 'lossResponse', ['', 'Sell', 'Wait', 'BuyMore']],
            ['Investment Horizon', 'investmentHorizon', ['', '<3 years', '3–7 years', '>7 years']],
            ['Investment Goal', 'investmentGoal', ['', 'Preservation', 'Income', 'Growth']]
          ].map(([label, field, options]) => (
            <label key={field} className="block">
              <span className="text-sm text-slate-600">{label}</span>
              <select
                value={form[field]}
                onChange={e => handleChange(field, e.target.value)}
                className="w-full border rounded-md p-2"
                title={label}
              >
                {options.map(o => (
                  <option key={o} value={o}>
                    {o || 'Select…'}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </div>

      <div className="text-right text-sm text-slate-500 italic">
        All data is auto-saved and can be exported for KYC or broker integrations.
      </div>
    </div>
  )
}
