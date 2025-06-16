// src/ExpensesGoalsTab.jsx

import React, { useMemo, useEffect } from 'react'
import { formatCurrency } from '../../utils/formatters'
import { useFinance } from '../../FinanceContext'
import { calculatePV, calculateLoanNPV } from '../../utils/financeUtils'
import { FREQUENCIES, FREQUENCY_LABELS } from '../../constants'
import suggestLoanStrategies from '../../utils/suggestLoanStrategies'
import { buildPlanJSON, buildPlanCSV, submitProfile } from '../../utils/exportHelpers'
import storage from '../../utils/storage'
import {
  PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend
} from 'recharts'

/**
 * ExpensesGoalsTab
 *
 * - CRUD for recurring Expenses, one-time Goals, and Loan Liabilities
 * - PV of Expenses over remaining lifetime (lifeExpectancy – age)
 * - PV of lump-sum Goals
 * - Loan PMT, PV, and annual amortization schedule
 * - Pie & Bar charts for allocation, PV summary, and amortization
 * - KPI cards and JSON export
 */
export default function ExpensesGoalsTab() {
  const currentYear = new Date().getFullYear()
  const { 
    discountRate,
    expensesList, setExpensesList,
    goalsList,    setGoalsList,
    liabilitiesList, setLiabilitiesList,
    setExpensesPV,
    profile,
    settings
  } = useFinance()


  // --- Helpers ---
  const clamp = (v, min = 0) => isNaN(v) || v < min ? min : v

  // --- CRUD Handlers ---
  // Expenses
  const handleExpenseChange = (i, field, raw) => {
    setExpensesList(expensesList.map((e, idx) => {
      if (idx !== i) return e
      if (['name', 'category'].includes(field)) {
        return { ...e, [field]: raw }
      }
      if (field === 'paymentsPerYear') {
        const ppy = parseInt(raw)
        if (!ppy || ppy < 1) {
          alert('One-time outflows should be entered as Goals instead of Expenses')
          return e
        }
        return { ...e, paymentsPerYear: ppy }
      }
      if (field === 'priority') {
        const val = parseInt(raw)
        return { ...e, priority: val >= 1 && val <= 3 ? val : 2 }
      }
      return { ...e, [field]: clamp(parseFloat(raw)) }
    }))
  }
  const addExpense = () => {
    setExpensesList([...expensesList, {
      name: '', amount: 0, paymentsPerYear: 12, growth: 0, category: 'Fixed', priority: 2
    }])
  }
  const removeExpense = i =>
    setExpensesList(expensesList.filter((_, idx) => idx !== i))

  // Goals
  const handleGoalChange = (i, field, raw) => {
    setGoalsList(goalsList.map((g, idx) => {
      if (idx !== i) return g
      if (field === 'name') return { ...g, name: raw }
      if (field === 'targetYear') {
        const yr = parseInt(raw) || currentYear
        return { ...g, targetYear: Math.max(currentYear, yr) }
      }
      return { ...g, amount: clamp(parseFloat(raw)) }
    }))
  }
  const addGoal = () => {
    setGoalsList([...goalsList, {
      name: '', amount: 0, targetYear: currentYear
    }])
  }
  const removeGoal = i =>
    setGoalsList(goalsList.filter((_, idx) => idx !== i))

  // Liabilities
  const validatePayment = (l) => {
    const r = l.interestRate / 100 / l.paymentsPerYear
    const n = l.termYears * l.paymentsPerYear
    const expected = (r * l.principal) / (1 - Math.pow(1 + r, -n))
    if (Math.abs(expected - l.payment) > 5) {
      alert('Payment doesn\u2019t match amortisation schedule. Did you mistype?')
      return false
    }
    return true
  }

  const handleLiabilityChange = (i, field, raw) => {
    setLiabilitiesList(
      liabilitiesList.map((l, idx) => {
        if (idx !== i) return l
        let updated = { ...l }
        if (field === 'name') updated.name = raw
        else if (['principal', 'interestRate'].includes(field)) {
          updated[field] = clamp(parseFloat(raw))
        } else if (['termYears', 'paymentsPerYear'].includes(field)) {
          updated[field] = Math.max(1, parseInt(raw) || 1)
        } else if (field === 'remainingMonths') {
          const months = Math.max(1, parseInt(raw) || 1)
          updated.remainingMonths = months
          updated.termYears = Math.ceil(months / 12)
        } else if (field === 'payment') {
          updated.payment = clamp(parseFloat(raw))
          if (!validatePayment(updated)) return l
        }
        return updated
      })
    )
  }
  const addLiability = () =>
    setLiabilitiesList([...liabilitiesList, {
      id: crypto.randomUUID(),
      name: '', principal: 0, interestRate: 0, termYears: 1,
      remainingMonths: 12, paymentsPerYear: 12, payment: 0
    }])
  const removeLiability = i =>
    setLiabilitiesList(liabilitiesList.filter((_, idx) => idx !== i))

  // --- 1) Remaining lifetime horizon ---
  const lifeYears = Math.max(1, Math.floor(profile.lifeExpectancy - profile.age))

  // --- 2) PV of Expenses over lifeYears ---
  const pvExpensesLife = useMemo(() => {
    return expensesList.reduce((sum, e) => {
      return sum + calculatePV(
        e.amount,
        e.paymentsPerYear,
        e.growth,
        discountRate,
        lifeYears
      )
    }, 0)
  }, [expensesList, discountRate, lifeYears])

  useEffect(() => {
    setExpensesPV(pvExpensesLife)
    storage.set('expensesPV', pvExpensesLife.toString())
  }, [pvExpensesLife, setExpensesPV])

  // --- 3) PV of Goals ---
  const pvGoals = useMemo(() => {
    return goalsList.reduce((sum, g) => {
      const yrs = Math.max(0, g.targetYear - currentYear)
      return sum + g.amount / Math.pow(1 + discountRate/100, yrs)
    }, 0)
  }, [goalsList, discountRate, currentYear])

  // --- 4) Loan details & amortization ---
  const liabilityDetails = useMemo(() => {
    return liabilitiesList.map(l => {
      const monthsPerPayment = 12 / l.paymentsPerYear
      const n = l.remainingMonths / monthsPerPayment
      const i = (l.interestRate / 100) / l.paymentsPerYear
      const computedPayment = i === 0
        ? l.principal / n
        : (i * l.principal) / (1 - Math.pow(1 + i, -n))
      const pv = calculateLoanNPV(
        l.principal,
        l.interestRate,
        l.remainingMonths / 12,
        l.paymentsPerYear,
        discountRate
      ) + l.principal

      // Monthly amort schedule aggregated yearly
      let balance = l.principal
      let yearInterest = 0, yearPrincipal = 0, payInterest = 0
      const schedule = []
      for (let m = 0; m < l.remainingMonths; m++) {
        const interest = balance * (l.interestRate / 100) / 12
        payInterest += interest
        yearInterest += interest
        const isPayment = (m + 1) % monthsPerPayment === 0 || m === l.remainingMonths - 1
        if (isPayment) {
          const principal = computedPayment - payInterest
          yearPrincipal += principal
          balance -= principal
          payInterest = 0
        }
        const isYearEnd = (m + 1) % 12 === 0 || m === l.remainingMonths - 1
        if (isYearEnd) {
          schedule.push({
            year: currentYear + Math.floor(m / 12) + 1,
            principalPaid: yearPrincipal,
            interestPaid: yearInterest,
            remaining: balance
          })
          yearInterest = 0
          yearPrincipal = 0
        }
      }

      return { ...l, computedPayment, pv, schedule }
    })
  }, [liabilitiesList, currentYear, discountRate])

  const totalLiabilitiesPV = liabilityDetails.reduce((s, l) => s + l.pv, 0)
  const totalRequired = pvExpensesLife + pvGoals + totalLiabilitiesPV


  const loanStrategies = useMemo(
    () => suggestLoanStrategies(liabilityDetails),
    [liabilityDetails]
  )

  // --- 5) PV Summary data ---
  const pvSummaryData = [
    { category: 'Expenses',     value: pvExpensesLife },
    { category: 'Goals',        value: pvGoals },
    { category: 'Liabilities',  value: totalLiabilitiesPV }
  ]

  // --- Export JSON ---
  const exportJSON = () => {
    const payload = buildPlanJSON(
      profile,
      discountRate,
      lifeYears,
      expensesList,
      pvExpensesLife,
      goalsList,
      pvGoals,
      liabilityDetails,
      totalLiabilitiesPV,
      totalRequired
    )
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'financial-plan.json'
    a.click()
  }

  const exportCSV = () => {
    const csv = buildPlanCSV(profile, pvSummaryData)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'financial-plan.csv'
    a.click()
  }

  const submitToAPI = () => {
    const payload = buildPlanJSON(
      profile,
      discountRate,
      lifeYears,
      expensesList,
      pvExpensesLife,
      goalsList,
      pvGoals,
      liabilityDetails,
      totalLiabilitiesPV,
      totalRequired
    )
    submitProfile(payload, settings)
  }

  const COLORS = ['#fbbf24','#f59e0b','#fcd34d','#fde68a','#eab308']
  const PRINCIPAL_COLOR = '#34d399'
  const INTEREST_COLOR  = '#f87171'

  return (
    <div className="space-y-8 p-6">

      {/* Expenses CRUD */}
      <section>
        <h2 className="text-2xl font-bold text-amber-700 mb-2">Expenses</h2>
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-2 font-semibold text-gray-700 mb-1">
          <div>Name</div>
          <div className="text-right">Amt ({settings.currency})</div>
          <div>Pay/Yr</div>
          <div className="text-right">Growth %</div>
          <div>Category</div>
          <div>Priority</div>
          <div></div>
        </div>
        {expensesList.length === 0 && (
          <p className="italic text-slate-500 col-span-full mb-2">No expenses added</p>
        )}
        {expensesList.map((e, i) => (
          <div key={i} className="grid grid-cols-1 sm:grid-cols-7 gap-2 items-center mb-1">
            <input
              className="border p-2 rounded-md"
              placeholder="Rent"
              value={e.name}
              onChange={ev => handleExpenseChange(i, 'name', ev.target.value)}
              title="Expense name"
            />
            <input
              className="border p-2 rounded-md text-right"
              type="number" min="0"
              placeholder="0"
              value={e.amount}
              onChange={ev => handleExpenseChange(i, 'amount', ev.target.value)}
              title="Expense amount"
            />
            <input
              className="border p-2 rounded-md text-right"
              type="number" min="1" step="1"
              value={e.paymentsPerYear}
              onChange={ev => handleExpenseChange(i, 'paymentsPerYear', ev.target.value)}
              title="Payments per year (use a Goal for one-off outflows)"
            />
            <input
              className="border p-2 rounded-md text-right"
              type="number" min="0" step="0.1"
              placeholder="0"
              value={e.growth}
              onChange={ev => handleExpenseChange(i, 'growth', ev.target.value)}
              title="Growth rate"
            />
            <select
              className="border p-2 rounded-md"
              value={e.category}
              onChange={ev => handleExpenseChange(i, 'category', ev.target.value)}
              aria-label="Expense category"
              title="Expense category"
            >
              <option>Fixed</option>
              <option>Discretionary</option>
              <option>Other</option>
            </select>
            <select
              className="border p-2 rounded-md"
              value={e.priority}
              onChange={ev => handleExpenseChange(i, 'priority', ev.target.value)}
              aria-label="Expense priority"
              title="Expense priority"
            >
              <option value={1}>High</option>
              <option value={2}>Medium</option>
              <option value={3}>Low</option>
            </select>
            <button
              onClick={() => removeExpense(i)}
              className="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label="Remove expense"
            >✖</button>
          </div>
        ))}
        <button
          onClick={addExpense}
          className="mt-2 bg-amber-400 hover:bg-amber-300 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Add expense"
          title="Add expense"
        >
          + Add Expense
        </button>
      </section>

      {/* Goals CRUD */}
      <section>
        <h2 className="text-2xl font-bold text-amber-700 mb-2">Goals</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 font-semibold text-gray-700 mb-1">
          <div>Name</div>
          <div className="text-right">Amt ({settings.currency})</div>
          <div className="text-right">Target Yr</div>
          <div></div>
        </div>
        {goalsList.length === 0 && (
          <p className="italic text-slate-500 col-span-full mb-2">No goals added</p>
        )}
        {goalsList.map((g, i) => (
          <div key={i} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center mb-1">
            <input
              className="border p-2 rounded-md"
              placeholder="Vacation"
              value={g.name}
              onChange={ev => handleGoalChange(i, 'name', ev.target.value)}
              title="Goal name"
            />
            <input
              className="border p-2 rounded-md text-right"
              type="number" min="0"
              placeholder="0"
              value={g.amount}
              onChange={ev => handleGoalChange(i, 'amount', ev.target.value)}
              title="Goal amount"
            />
            <input
              className="border p-2 rounded-md text-right"
              type="number" min={currentYear}
              placeholder={String(currentYear)}
              value={g.targetYear}
              onChange={ev => handleGoalChange(i, 'targetYear', ev.target.value)}
              title="Target year"
            />
            <button
              onClick={() => removeGoal(i)}
              className="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label="Remove goal"
            >✖</button>
          </div>
        ))}
        <button
          onClick={addGoal}
          className="mt-2 bg-amber-400 hover:bg-amber-300 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Add goal"
          title="Add goal"
        >
          + Add Goal
        </button>
      </section>

      {/* Liabilities CRUD */}
      <section>
        <h2 className="text-2xl font-bold text-amber-700 mb-2">Liabilities (Loans)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-10 gap-2 font-semibold text-gray-700 mb-1">
          <div>Name</div>
          <div className="text-right">Principal</div>
          <div className="text-right">Interest %</div>
          <div className="text-right">Term yrs</div>
          <div className="text-right">Months Left</div>
          <div>Pay/Yr</div>
          <div className="text-right">Payment</div>
          <div className="text-right">PMT</div>
          <div className="text-right">PV</div>
          <div></div>
        </div>
        {liabilityDetails.length === 0 && (
          <p className="italic text-slate-500 col-span-full mb-2">No loans added</p>
        )}
        {liabilityDetails.map((l, i) => (
          <div key={l.id} className="grid grid-cols-1 sm:grid-cols-10 gap-2 items-center mb-1">
            <input
              className="border p-2 rounded-md"
              placeholder="Car Loan"
              value={l.name}
              onChange={ev => handleLiabilityChange(i, 'name', ev.target.value)}
              title="Loan name"
            />
            <input
              className="border p-2 rounded-md text-right"
              type="number" min="0"
              placeholder="0"
              value={l.principal}
              onChange={ev => handleLiabilityChange(i, 'principal', ev.target.value)}
              title="Principal"
            />
            <input
              className="border p-2 rounded-md text-right"
              type="number" min="0" step="0.1"
              placeholder="0"
              value={l.interestRate}
              onChange={ev => handleLiabilityChange(i, 'interestRate', ev.target.value)}
              title="Interest rate"
            />
            <input
              className="border p-2 rounded-md text-right"
              type="number" min="1"
              placeholder="1"
              value={l.termYears}
              onChange={ev => handleLiabilityChange(i, 'termYears', ev.target.value)}
              title="Term years"
            />
            <input
              className="border p-2 rounded-md text-right"
              type="number" min="1" step="1"
              value={l.remainingMonths}
              onChange={ev => handleLiabilityChange(i, 'remainingMonths', ev.target.value)}
              title="Remaining months"
            />
          <select
            className="border p-2 rounded-md"
            value={l.paymentsPerYear}
            onChange={ev => handleLiabilityChange(i, 'paymentsPerYear', ev.target.value)}
            title="Payments per year"
          >
            {FREQUENCY_LABELS.map(label => (
              <option key={label} value={FREQUENCIES[label]}>{label}</option>
            ))}
          </select>
            <input
              className="border p-2 rounded-md text-right"
              type="number" min="0" step="0.01"
              placeholder="0"
              value={l.payment}
              onChange={ev => handleLiabilityChange(i, 'payment', ev.target.value)}
              title="Actual payment"
            />
            <div className="text-right">{l.computedPayment.toFixed(2)}</div>
            <div className="text-right">{l.pv.toFixed(2)}</div>
            <button
              onClick={() => removeLiability(i)}
              className="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label="Remove liability"
            >✖</button>
          </div>
        ))}
        <button
          onClick={addLiability}
          className="mt-2 bg-amber-400 hover:bg-amber-300 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Add liability"
          title="Add liability"
        >
          + Add Liability
        </button>
      </section>

      {/* PV Summary Bar Chart */}
      <section>
        <h2 className="text-xl font-bold text-amber-700 mb-2">PV Summary</h2>
        <ResponsiveContainer width="100%" height={300} role="img" aria-label="PV summary bar chart">
          <BarChart data={pvSummaryData} margin={{ top:20, right:30, left:0, bottom:20 }}>
            <XAxis dataKey="category" />
            <YAxis tickFormatter={v =>
              formatCurrency(v, settings.locale, settings.currency)
            }/>
            <Tooltip formatter={v =>
              formatCurrency(v, settings.locale, settings.currency)
            }/>
            <Legend />
            <Bar dataKey="value" fill={COLORS[1]} name="Present Value" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Amortization Schedules */}
      <section>
        <h2 className="text-xl font-bold text-amber-700 mb-4">Loan Amortization</h2>
        {liabilityDetails.map(l => (
          <div key={l.id} className="mb-8">
            <h3 className="text-lg font-semibold">{l.name}</h3>
            <ResponsiveContainer width="100%" height={200} role="img" aria-label="Loan amortization chart">
              <BarChart data={l.schedule}>
                <XAxis dataKey="year" />
                <YAxis tickFormatter={v =>
                  formatCurrency(v, settings.locale, settings.currency)
                }/>
                <Tooltip formatter={v =>
                  formatCurrency(v, settings.locale, settings.currency)
                }/>
                <Legend verticalAlign="bottom" />
                <Bar dataKey="principalPaid" stackId="a" name="Principal" fill={PRINCIPAL_COLOR} />
                <Bar dataKey="interestPaid"  stackId="a" name="Interest"  fill={INTEREST_COLOR} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}
      </section>

      {/* KPI Cards */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'PV of Expenses',    value: pvExpensesLife },
          { label:'PV of Goals',       value: pvGoals },
          { label:'PV of Liabilities', value: totalLiabilitiesPV },
          { label:'Total Required PV', value: totalRequired }
        ].map((it, i) => (
          <div key={i} className="bg-white rounded-xl shadow p-4 flex flex-col items-center">
            <span className="text-sm text-gray-500">{it.label}</span>
            <span className="mt-2 text-lg font-semibold text-amber-700">
              {formatCurrency(it.value, settings.locale, settings.currency)}
            </span>
          </div>
        ))}
      </section>

      {loanStrategies.length > 0 && (
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="text-lg font-bold text-amber-700 mb-2">Loan Advisor</h3>
          <ul className="list-disc pl-5 text-sm space-y-1">
            {loanStrategies.map((s, i) => (
              <li key={i}>
                Pay <strong>{s.name}</strong> early to save&nbsp;
                <span className="text-amber-700 font-semibold">
                  {formatCurrency(s.interestSaved, settings.locale, settings.currency)}
                </span>
                {s.paymentsSaved > 0 && ` and cut ${s.paymentsSaved} payments`}
                .
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Export */}
      <div className="text-right">
        <button
          onClick={exportJSON}
          className="mt-4 border border-amber-600 px-4 py-2 rounded-md hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Export to JSON"
          title="Export to JSON"
        >
          📁 Export to JSON
        </button>
        <button
          onClick={exportCSV}
          className="ml-2 mt-4 border border-amber-600 px-4 py-2 rounded-md hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Export to CSV"
          title="Export to CSV"
        >
          📊 Export to CSV
        </button>
        <button
          onClick={submitToAPI}
          className="ml-2 mt-4 border border-amber-600 px-4 py-2 rounded-md hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Submit plan to API"
          title="Submit plan to API"
        >
          🚀 Submit to API
        </button>
      </div>
    </div>
  )
}
