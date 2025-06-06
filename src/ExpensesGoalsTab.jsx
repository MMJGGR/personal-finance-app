// src/ExpensesGoalsTab.jsx

import React, { useMemo, useEffect } from 'react'
import { useFinance } from './FinanceContext'
import { calculatePV } from './utils/financeUtils'
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
      if (['name', 'frequency', 'category'].includes(field)) {
        return { ...e, [field]: raw }
      }
      return { ...e, [field]: clamp(parseFloat(raw)) }
    }))
  }
  const addExpense = () => {
    setExpensesList([...expensesList, {
      name: '', amount: 0, frequency: 'Monthly', growth: 0, category: 'Fixed'
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
    setLiabilitiesList(liabilitiesList.map((l, idx) => {
      if (idx !== i) return l
      let updated = { ...l }
      if (field === 'name') updated.name = raw
      else if (['principal', 'interestRate'].includes(field)) {
        updated[field] = clamp(parseFloat(raw))
      } else if (['termYears', 'paymentsPerYear'].includes(field)) {
        updated[field] = Math.max(1, parseInt(raw) || 1)
      } else if (field === 'payment') {
        updated.payment = clamp(parseFloat(raw))
        if (!validatePayment(updated)) return l
      }
      return updated
    }))
  }
  const addLiability = () =>
    setLiabilitiesList([...liabilitiesList, {
      name: '', principal: 0, interestRate: 0, termYears: 1, paymentsPerYear: 12, payment: 0
    }])
  const removeLiability = i =>
    setLiabilitiesList(liabilitiesList.filter((_, idx) => idx !== i))

  // --- 1) Remaining lifetime horizon ---
  const lifeYears = Math.max(0, Math.floor(profile.lifeExpectancy - profile.age))

  // --- 2) PV of Expenses over lifeYears ---
  const pvExpensesLife = useMemo(() => {
    const freqMap = { Monthly: 12, Annual: 1, OneTime: 0 }
    return expensesList.reduce((sum, e) => {
      const freq = freqMap[e.frequency] || 0
      return sum + calculatePV(e.amount, freq, e.growth, discountRate, lifeYears)
    }, 0)
  }, [expensesList, discountRate, lifeYears])

  useEffect(() => {
    setExpensesPV(pvExpensesLife)
    localStorage.setItem('expensesPV', pvExpensesLife.toString())
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
      const n = l.termYears * l.paymentsPerYear
      const i = (l.interestRate / 100) / l.paymentsPerYear
      const computedPayment = i === 0
        ? l.principal / n
        : (i * l.principal) / (1 - Math.pow(1 + i, -n))
      const pv = computedPayment * (1 - Math.pow(1 + i, -n)) / i

      // Annual amort schedule
      let balance = l.principal
      const schedule = Array.from({ length: l.termYears }, (_, yr) => {
        let intSum = 0, prinSum = 0
        for (let p = 0; p < l.paymentsPerYear; p++) {
          const interest = balance * i
          const principal = computedPayment - interest
          intSum += interest
          prinSum += principal
          balance -= principal
        }
        return {
          year: currentYear + yr + 1,
          principalPaid: prinSum,
          interestPaid: intSum,
          remaining: balance
        }
      })

      return { ...l, computedPayment, pv, schedule }
    })
  }, [liabilitiesList, currentYear])

  const totalLiabilitiesPV = liabilityDetails.reduce((s, l) => s + l.pv, 0)
  const totalRequired = pvExpensesLife + pvGoals + totalLiabilitiesPV

  // --- 5) PV Summary data ---
  const pvSummaryData = [
    { category: 'Expenses',     value: pvExpensesLife },
    { category: 'Goals',        value: pvGoals },
    { category: 'Liabilities',  value: totalLiabilitiesPV }
  ]

  // --- Export JSON ---
  const exportJSON = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      profile,
      assumptions: { discountRate, lifeYears },
      expenses:      expensesList, pvExpenses: pvExpensesLife,
      goals:         goalsList,    pvGoals,
      liabilities:   liabilityDetails.map(l => {
        const { schedule: _unused, ...rest } = l;
        return rest;
      }),
      totalLiabilitiesPV, totalRequired
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'financial-plan.json'
    a.click()
  }

  const COLORS = ['#fbbf24','#f59e0b','#fcd34d','#fde68a','#eab308']

  return (
    <div className="space-y-8 p-6">

      {/* Expenses CRUD */}
      <section>
        <h2 className="text-2xl font-bold text-amber-700 mb-2">Expenses</h2>
        <div className="grid grid-cols-6 gap-2 font-semibold text-gray-700 mb-1">
          <div>Name</div>
          <div className="text-right">Amt ({settings.currency})</div>
          <div>Freq</div>
          <div className="text-right">Growth %</div>
          <div>Category</div>
          <div></div>
        </div>
        {expensesList.map((e, i) => (
          <div key={i} className="grid grid-cols-6 gap-2 items-center mb-1">
            <input
              className="border p-2 rounded-md"
              placeholder="Rent"
              value={e.name}
              onChange={ev => handleExpenseChange(i, 'name', ev.target.value)}
            />
            <input
              className="border p-2 rounded-md text-right"
              type="number" min="0"
              placeholder="0"
              value={e.amount}
              onChange={ev => handleExpenseChange(i, 'amount', ev.target.value)}
            />
            <select
              className="border p-2 rounded-md"
              value={e.frequency}
              onChange={ev => handleExpenseChange(i, 'frequency', ev.target.value)}
            >
              <option>Monthly</option>
              <option>Annual</option>
              <option>OneTime</option>
            </select>
            <input
              className="border p-2 rounded-md text-right"
              type="number" min="0" step="0.1"
              placeholder="0"
              value={e.growth}
              onChange={ev => handleExpenseChange(i, 'growth', ev.target.value)}
            />
            <select
              className="border p-2 rounded-md"
              value={e.category}
              onChange={ev => handleExpenseChange(i, 'category', ev.target.value)}
            >
              <option>Fixed</option>
              <option>Discretionary</option>
              <option>Other</option>
            </select>
            <button
              onClick={() => removeExpense(i)}
              className="text-red-600 hover:text-red-800"
              aria-label="Remove expense"
            >✖</button>
          </div>
        ))}
        <button
          onClick={addExpense}
          className="mt-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md"
        >+ Add Expense</button>
      </section>

      {/* Goals CRUD */}
      <section>
        <h2 className="text-2xl font-bold text-amber-700 mb-2">Goals</h2>
        <div className="grid grid-cols-4 gap-2 font-semibold text-gray-700 mb-1">
          <div>Name</div>
          <div className="text-right">Amt ({settings.currency})</div>
          <div className="text-right">Target Yr</div>
          <div></div>
        </div>
        {goalsList.map((g, i) => (
          <div key={i} className="grid grid-cols-4 gap-2 items-center mb-1">
            <input
              className="border p-2 rounded-md"
              placeholder="Vacation"
              value={g.name}
              onChange={ev => handleGoalChange(i, 'name', ev.target.value)}
            />
            <input
              className="border p-2 rounded-md text-right"
              type="number" min="0"
              placeholder="0"
              value={g.amount}
              onChange={ev => handleGoalChange(i, 'amount', ev.target.value)}
            />
            <input
              className="border p-2 rounded-md text-right"
              type="number" min={currentYear}
              placeholder={String(currentYear)}
              value={g.targetYear}
              onChange={ev => handleGoalChange(i, 'targetYear', ev.target.value)}
            />
            <button
              onClick={() => removeGoal(i)}
              className="text-red-600 hover:text-red-800"
              aria-label="Remove goal"
            >✖</button>
          </div>
        ))}
        <button
          onClick={addGoal}
          className="mt-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md"
        >+ Add Goal</button>
      </section>

      {/* Liabilities CRUD */}
      <section>
        <h2 className="text-2xl font-bold text-amber-700 mb-2">Liabilities (Loans)</h2>
        <div className="grid grid-cols-9 gap-2 font-semibold text-gray-700 mb-1">
          <div>Name</div>
          <div className="text-right">Principal</div>
          <div className="text-right">Interest %</div>
          <div className="text-right">Term yrs</div>
          <div>Pay/Yr</div>
          <div className="text-right">Payment</div>
          <div className="text-right">PMT</div>
          <div className="text-right">PV</div>
          <div></div>
        </div>
        {liabilityDetails.map((l, i) => (
          <div key={i} className="grid grid-cols-9 gap-2 items-center mb-1">
            <input
              className="border p-2 rounded-md"
              placeholder="Car Loan"
              value={l.name}
              onChange={ev => handleLiabilityChange(i, 'name', ev.target.value)}
            />
            <input
              className="border p-2 rounded-md text-right"
              type="number" min="0"
              placeholder="0"
              value={l.principal}
              onChange={ev => handleLiabilityChange(i, 'principal', ev.target.value)}
            />
            <input
              className="border p-2 rounded-md text-right"
              type="number" min="0" step="0.1"
              placeholder="0"
              value={l.interestRate}
              onChange={ev => handleLiabilityChange(i, 'interestRate', ev.target.value)}
            />
            <input
              className="border p-2 rounded-md text-right"
              type="number" min="1"
              placeholder="1"
              value={l.termYears}
              onChange={ev => handleLiabilityChange(i, 'termYears', ev.target.value)}
            />
          <select
            className="border p-2 rounded-md"
            value={l.paymentsPerYear}
            onChange={ev => handleLiabilityChange(i, 'paymentsPerYear', ev.target.value)}
          >
            <option value={12}>Monthly</option>
            <option value={4}>Quarterly</option>
            <option value={1}>Annually</option>
          </select>
            <input
              className="border p-2 rounded-md text-right"
              type="number" min="0" step="0.01"
              placeholder="0"
              value={l.payment}
              onChange={ev => handleLiabilityChange(i, 'payment', ev.target.value)}
            />
            <div className="text-right">{l.computedPayment.toFixed(2)}</div>
            <div className="text-right">{l.pv.toFixed(2)}</div>
            <button
              onClick={() => removeLiability(i)}
              className="text-red-600 hover:text-red-800"
              aria-label="Remove liability"
            >✖</button>
          </div>
        ))}
        <button
          onClick={addLiability}
          className="mt-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md"
        >+ Add Liability</button>
      </section>

      {/* PV Summary Bar Chart */}
      <section>
        <h2 className="text-xl font-bold text-amber-700 mb-2">PV Summary</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={pvSummaryData} margin={{ top:20, right:30, left:0, bottom:20 }}>
            <XAxis dataKey="category" />
            <YAxis tickFormatter={v =>
              v.toLocaleString(settings.locale,{style:'currency',currency:settings.currency})
            }/>
            <Tooltip formatter={v =>
              v.toLocaleString(settings.locale,{style:'currency',currency:settings.currency})
            }/>
            <Legend />
            <Bar dataKey="value" fill={COLORS[1]} name="Present Value" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Amortization Schedules */}
      <section>
        <h2 className="text-xl font-bold text-amber-700 mb-4">Loan Amortization</h2>
        {liabilityDetails.map((l, idx) => (
          <div key={idx} className="mb-8">
            <h3 className="text-lg font-semibold">{l.name}</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={l.schedule}>
                <XAxis dataKey="year" />
                <YAxis tickFormatter={v =>
                  v.toLocaleString(settings.locale,{style:'currency',currency:settings.currency})
                }/>
                <Tooltip formatter={v =>
                  v.toLocaleString(settings.locale,{style:'currency',currency:settings.currency})
                }/>
                <Legend verticalAlign="bottom" />
                <Bar dataKey="principalPaid" stackId="a" name="Principal" fill={COLORS[2]} />
                <Bar dataKey="interestPaid"  stackId="a" name="Interest"  fill={COLORS[3]} />
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
              {it.value.toLocaleString(settings.locale,{
                style:'currency',currency:settings.currency,maximumFractionDigits:0
              })}
            </span>
          </div>
        ))}
      </section>

      {/* Export */}
      <div className="text-right">
        <button
          onClick={exportJSON}
          className="mt-4 border border-amber-600 px-4 py-2 rounded-md hover:bg-amber-50"
        >📁 Export to JSON</button>
      </div>
    </div>
  )
}
