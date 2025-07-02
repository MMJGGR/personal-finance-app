// src/ProfileTab.jsx
import React, { useState, useEffect } from 'react'
import { useFinance } from '../../FinanceContext'
import storage from '../../utils/storage'
import sanitize from '../../utils/sanitize'
import { record, flush } from '../../utils/auditLog'
import RiskSummary from './RiskSummary.jsx'
import { calculateRiskScore, deriveCategory, computeSurveyScore } from '../../utils/riskUtils'
import { riskSurveyQuestions } from '../../config/riskSurvey'
import { profileSchema } from '../../validation/profileSchema.js'

export default function ProfileTab() {
  const {
    profile,
    updateProfile,
    clearProfile,
    resetProfile,
    riskScore: _riskScore,
  } = useFinance()
  const [form, setForm] = useState(profile)
  const [riskScoreValue, setRiskScoreValue] = useState(0)
  const [riskCategory, setRiskCategory] = useState('balanced')
  const [errors, setErrors] = useState({})

  // Whenever the context’s profile changes, reset the form
  useEffect(() => {
    setForm(profile)
  }, [profile])

  useEffect(() => {
    const score = calculateRiskScore(form)
    setRiskScoreValue(score)
    setRiskCategory(deriveCategory(score))
  }, [form])

  // Handle any field change locally, then persist via context
  const handleChange = (field, value) => {
    const clean = typeof value === 'string' ? sanitize(value) : value
    const updated = { ...form, [field]: clean }
    record(storage, `profile.${field}`, form[field], clean)

    if (field === 'lifeExpectancy' && value <= updated.age) {
      updated.lifeExpectancy = updated.age + 1
    } else if (field === 'age' && updated.lifeExpectancy <= value) {
      updated.lifeExpectancy = value + 1
    } else if (field === 'birthDate') {
      const dob = new Date(value)
      if (!isNaN(dob)) {
        const diff = Date.now() - dob.getTime()
        const ageDt = new Date(diff)
        const years = Math.abs(ageDt.getUTCFullYear() - 1970)
        updated.age = years
        if (updated.lifeExpectancy <= years) {
          updated.lifeExpectancy = years + 1
        }
      }
    }

    const result = profileSchema.safeParse(updated)
    if (!result.success) {
      const errs = Object.fromEntries(
        Object.entries(result.error.flatten().fieldErrors).filter(([, v]) => v && v[0]).map(([k, v]) => [k, v[0]])
      )
      setErrors(errs)
    } else {
      setErrors({})
    }
    setForm(updated)
    updateProfile(updated)
  }

  const handleSurveyChange = (idx, value) => {
    const answers = Array.isArray(form.riskSurvey)
      ? [...form.riskSurvey]
      : Array(riskSurveyQuestions.length).fill(0)
    answers[idx] = Number(value)
    const score = computeSurveyScore(answers)
    const updated = { ...form, riskSurvey: answers, surveyScore: score }
    const result = profileSchema.safeParse(updated)
    if (!result.success) {
      const errs = Object.fromEntries(
        Object.entries(result.error.flatten().fieldErrors)
          .filter(([, v]) => v && v[0])
          .map(([k, v]) => [k, v[0]])
      )
      setErrors(errs)
    } else {
      setErrors({})
    }
    setForm(updated)
    updateProfile(updated)
  }

  useEffect(() => {
    return () => flush(storage)
  }, [])

  const remainingYears = form.lifeExpectancy - form.age

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold text-amber-800">
        Client Profile & Risk Assessment
      </h2>

      {/* Live Risk Score Display */}
      <RiskSummary score={riskScoreValue} category={riskCategory} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal & KYC Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-700">
            Personal & KYC Information
          </h3>
          {[
            ['First Name', 'firstName', 'text'],
            ['Last Name', 'lastName', 'text'],
            ['Email Address', 'email', 'email'],
            ['Phone Number', 'phone', 'tel'],
            ['Address', 'address', 'text'],
            ['City', 'city', 'text'],
            ['Country', 'country', 'text'],
            ['Tax Country', 'taxCountry', 'text'],
            ['Tax ID', 'taxId', 'text'],
            ['Employment Status', 'employmentStatus', 'text'],
            ['Employer Name', 'employerName', 'text'],
            ['Birth Date', 'birthDate', 'date'],
            ['Age', 'age', 'number'],
            ['Life Expectancy', 'lifeExpectancy', 'number'],
            ['Dependents', 'numDependents', 'number'],
            ['Education', 'education', 'text']
          ].map(([label, field, type, options]) => (
            <label key={field} className="block space-y-1">
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
              {errors[field] && (
                <span className="text-xs text-red-600">{errors[field]}</span>
              )}
            </label>
          ))}
          {remainingYears <= 0 && (
            <p className="text-red-600 text-sm">Life expectancy must exceed age.</p>
          )}


          {[
            ['Annual Income (KES)', 'annualIncome'],
            ['Liquid Net Worth (KES)', 'liquidNetWorth']
          ].map(([label, field]) => (
            <label key={field} className="block space-y-1">
              <span className="text-sm text-slate-600">{label}</span>
              <input
                type="number"
                value={form[field]}
                onChange={e => handleChange(field, parseFloat(e.target.value) || 0)}
                className="w-full border rounded-md p-2"
                title={label}
              />
              {errors[field] && (
                <span className="text-xs text-red-600">{errors[field]}</span>
              )}
            </label>
          ))}

          <label className="block">
            <span className="text-sm text-slate-600">Source of Funds</span>{/* FIXME: unused - pending integration */}
            <textarea
              value={form.sourceOfFunds}
              onChange={e => handleChange('sourceOfFunds', e.target.value)}
              className="w-full border rounded-md p-2"
              rows={3}
              title="Source of funds"
            />
          </label>

          <label className="block">
            <span className="text-sm text-slate-600">Primary Financial Challenge</span>
            <input
              type="text"
              value={form.financialChallenge}
              onChange={e => handleChange('financialChallenge', e.target.value)}
              className="w-full border rounded-md p-2"
              title="Primary Financial Challenge"
            />
          </label>

          <div className="space-y-2">
            <span className="text-sm text-slate-600 font-medium">Behavioural Profile</span>
            <label className="block">
              <span className="text-sm text-slate-600">Spending Habits</span>
              <input
                type="text"
                value={form.behaviouralProfile?.spendingHabits || ''}
                onChange={e =>
                  handleChange('behaviouralProfile', {
                    ...form.behaviouralProfile,
                    spendingHabits: e.target.value
                  })
                }
                className="w-full border rounded-md p-2"
                title="Spending Habits"
              />
            </label>
            <label className="block">
              <span className="text-sm text-slate-600">Biases</span>
              <input
                type="text"
                value={(form.behaviouralProfile?.biases || []).join(', ')}
                onChange={e =>
                  handleChange('behaviouralProfile', {
                    ...form.behaviouralProfile,
                    biases: e.target.value
                      .split(',')
                      .map(b => b.trim())
                      .filter(Boolean)
                  })
                }
                className="w-full border rounded-md p-2"
                title="Biases"
              />
            </label>
            <label className="block">
              <span className="text-sm text-slate-600">Financial Worries</span>
              <input
                type="text"
                value={form.behaviouralProfile?.financialWorries || ''}
                onChange={e =>
                  handleChange('behaviouralProfile', {
                    ...form.behaviouralProfile,
                    financialWorries: e.target.value
                  })
                }
                className="w-full border rounded-md p-2"
                title="Financial Worries"
              />
            </label>
          </div>
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

        {/* Risk Survey */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-700">Risk Survey</h3>
          {riskSurveyQuestions.map((q, idx) => (
            <label key={idx} className="block">
              <span className="text-sm text-slate-600">{q.text}</span>
              <select
                value={form.riskSurvey?.[idx] || 0}
                onChange={e => handleSurveyChange(idx, e.target.value)}
                className="w-full border rounded-md p-2 mt-1"
                title={`Risk Survey Q${idx + 1}`}
              >
                <option value={0}>Select…</option>
                {[1, 2, 3, 4, 5].map(v => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </div>

      <div className="text-right space-x-2">
        <button
          onClick={clearProfile}
          className="mt-2 border border-amber-600 px-4 py-1 rounded-md text-sm hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Clear profile form"
        >
          Clear
        </button>
        <button
          onClick={resetProfile}
          className="mt-2 border border-amber-600 px-4 py-1 rounded-md text-sm hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Reset profile to defaults"
        >
          Reset to Defaults
        </button>
      </div>

      <div className="text-right text-sm text-slate-500 italic mt-2">
        All data is auto-saved and can be exported for KYC or broker integrations.
      </div>
    </div>
  )
}
