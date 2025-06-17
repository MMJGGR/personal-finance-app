// src/ExpensesGoalsTab.jsx

import React, { useMemo, useEffect, useState } from 'react'
import { formatCurrency } from '../../utils/formatters'
import { useFinance } from '../../FinanceContext'
import { calculateLoanNPV } from '../../utils/financeUtils'
import { buildPlanJSON, buildPlanCSV, submitProfile } from '../../utils/exportHelpers'
import storage from '../../utils/storage'
import { expenseItemSchema, goalItemSchema } from '../../schemas/expenseGoalSchemas'
import { ResponsiveContainer } from 'recharts'
import CashflowTimelineChart from './CashflowTimelineChart'
import buildTimeline from '../../selectors/timeline'
import { Card, CardHeader, CardBody } from '../common/Card.jsx'

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
  const defaultStart = currentYear
  const defaultEnd = currentYear + 5
  const {
    discountRate,
    expensesList, setExpensesList,
    goalsList,    setGoalsList,
    liabilitiesList,
    setExpensesPV,
    setGoalsPV,
    profile,
    settings,
    startYear,
    years,
    annualIncome
  } = useFinance()

  const [showExpenses, setShowExpenses] = useState(true)
  const [showGoals, setShowGoals] = useState(true)
  const [expenseErrors, setExpenseErrors] = useState({})
  const [goalErrors, setGoalErrors] = useState({})

  // --- Helpers ---

  // --- CRUD Handlers ---
  // Expenses
  const handleExpenseChange = (i, field, raw) => {
    setExpensesList(prev => {
      const next = [...prev]
      const updated = { ...next[i], [field]: raw }
      const parsed = expenseItemSchema.safeParse(updated)
      if (parsed.success) {
        next[i] = parsed.data
        setExpenseErrors(err => ({ ...err, [i]: {} }))
      } else {
        next[i] = updated
        setExpenseErrors(err => ({
          ...err,
          [i]: parsed.error.flatten().fieldErrors,
        }))
      }
      return next
    })
  }
  const addExpense = () => {
    const now = new Date().getFullYear()
    setExpensesList([
      ...expensesList,
      {
        name: '',
        amount: 0,
        paymentsPerYear: 12,
        growth: 0,
        category: 'Fixed',
        priority: 2,
        startYear: now,
        endYear: now + 5,
      },
    ])
  }
  const removeExpense = i => {
    if (window.confirm('Delete this item?')) {
      setExpensesList(expensesList.filter((_, idx) => idx !== i))
    }
  }

  // Goals
  const handleGoalChange = (i, field, raw) => {
    setGoalsList(prev => {
      const next = [...prev]
      const updated = { ...next[i], [field]: raw }
      const parsed = goalItemSchema.safeParse(updated)
      if (parsed.success) {
        next[i] = parsed.data
        setGoalErrors(err => ({ ...err, [i]: {} }))
      } else {
        next[i] = updated
        setGoalErrors(err => ({
          ...err,
          [i]: parsed.error.flatten().fieldErrors,
        }))
      }
      return next
    })
  }
  const addGoal = () => {
    setGoalsList([
      ...goalsList,
      {
        name: '',
        amount: 0,
        targetYear: currentYear,
        startYear: currentYear,
        endYear: currentYear + 5,
      },
    ])
  }
  const removeGoal = i => {
    if (window.confirm('Delete this item?')) {
      setGoalsList(goalsList.filter((_, idx) => idx !== i))
    }
  }

  // --- 1) Remaining lifetime horizon ---
  const lifeYears = Math.max(1, Math.floor(profile.lifeExpectancy - profile.age))

  // --- 2) PV of Expenses over lifeYears ---
  const pvExpensesLife = useMemo(() => {
    const horizonEnd = currentYear + lifeYears - 1
    return expensesList.reduce((sum, e) => {
      const start = e.startYear ?? currentYear
      const end = e.endYear ?? horizonEnd
      const first = Math.max(start, currentYear)
      const last = Math.min(end, horizonEnd)
      if (last < first) return sum
      const growth = e.growth || 0
      let pv = 0
      for (let yr = first; yr <= last; yr++) {
        const idx = yr - start
        const cash = (e.amount * e.paymentsPerYear) * Math.pow(1 + growth / 100, idx)
        const disc = yr - currentYear + 1
        pv += cash / Math.pow(1 + discountRate / 100, disc)
      }
      return sum + pv
    }, 0)
  }, [expensesList, discountRate, lifeYears, currentYear])

  useEffect(() => {
    setExpensesPV(pvExpensesLife)
    storage.set('expensesPV', pvExpensesLife.toString())
  }, [pvExpensesLife, setExpensesPV])

  // --- 3) PV of Goals ---
  const pvGoals = useMemo(() => {
    const horizonEnd = currentYear + lifeYears - 1
    return goalsList.reduce((sum, g) => {
      const target = g.targetYear ?? g.startYear ?? currentYear
      if (target < currentYear || target > horizonEnd) return sum
      const yrs = target - currentYear
      return sum + g.amount / Math.pow(1 + discountRate / 100, yrs)
    }, 0)
  }, [goalsList, discountRate, currentYear, lifeYears])

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




  // --- Combined cashflow timeline ---
  const timelineData = useMemo(() => {
    const minYear = startYear
    const maxYear = startYear + years - 1
    const incomeFn = y => {
      const idx = y - startYear
      return annualIncome[idx] || 0
    }
    const loanForYear = y => {
      return liabilityDetails.reduce((sum, l) => {
        const match = l.schedule.find(sc => sc.year === y)
        return match ? sum + match.principalPaid + match.interestPaid : sum
      }, 0)
    }
    return buildTimeline(minYear, maxYear, incomeFn, expensesList, goalsList, loanForYear)
  }, [expensesList, goalsList, liabilityDetails, annualIncome, startYear, years])

  const maxSurplus = useMemo(() => {
    if (timelineData.length === 0) return 0
    return Math.max(...timelineData.map(r => r.surplus))
  }, [timelineData])

  const hasDeficit = useMemo(
    () => timelineData.some(row => row.net < 0),
    [timelineData]
  )

  useEffect(() => {
    const expPV = timelineData.reduce((sum, r) => sum + r.expenses, 0)
    const goalPV = timelineData.reduce((sum, r) => sum + r.goals, 0)
    const loanPV = timelineData.reduce((s, r) => s + r.loans, 0)
    setExpensesPV(expPV)
    if (typeof setGoalsPV === 'function') setGoalsPV(goalPV)
    storage.set('expensesPV', expPV.toString())
    storage.set('goalsPV', goalPV.toString())
    storage.set('loansPV', loanPV.toString())
    storage.set('totalPV', (expPV + goalPV + loanPV).toString())
  }, [timelineData, setExpensesPV, setGoalsPV])

  // --- 5) PV Summary data ---
  const pvSummaryData = [
    { category: 'Expenses',     value: pvExpensesLife },
    { category: 'Goals',        value: pvGoals },
    { category: 'Liabilities',  value: totalLiabilitiesPV }
  ]

  // --- Export JSON ---
  const exportJSON = () => {
    const exportPlan = {
      profile,
      assumptions: settings,
      timeline: timelineData,
      expenses: expensesList,
      goals: goalsList,
      loans: liabilitiesList,
      PV: {
        expenses: pvExpensesLife,
        goals: pvGoals,
        loans: totalLiabilitiesPV,
        total: totalRequired
      }
    }
    const blob = new Blob([JSON.stringify(exportPlan, null, 2)], { type: 'application/json' })
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
      totalRequired,
      timelineData
    )
    submitProfile(payload, settings)
  }

  const COLORS = ['#fbbf24','#f59e0b','#fcd34d','#fde68a','#eab308']
  const PRINCIPAL_COLOR = '#34d399'
  const INTEREST_COLOR  = '#f87171'
  return (
    <div className="space-y-8 p-6">
      <section>
        <ResponsiveContainer width="100%" height={400} role="img" aria-label="Cashflow timeline chart">
          <CashflowTimelineChart data={timelineData} locale={settings.locale} currency={settings.currency} />
        </ResponsiveContainer>
      </section>

      <Card>
        <h3 className="text-lg font-bold text-amber-700">Advisor Insights</h3>
        {hasDeficit && (
          <p className="text-red-600">⚠️ Cashflow deficit detected in some years. Consider reducing expenses or deferring goals.</p>
        )}
        <p>Peak surplus: {formatCurrency(maxSurplus, settings.locale, settings.currency)}</p>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-xl font-bold text-amber-700">Expenses</h2>
          <div>
            <button onClick={() => setShowExpenses(v => !v)} className="mr-2 text-sm text-amber-600">
              {showExpenses ? 'Hide' : 'Show'}
            </button>
            <button onClick={addExpense} className="bg-amber-400 text-white px-4 py-2 rounded-md">+ Add</button>
          </div>
        </CardHeader>
        {showExpenses && (
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-9 gap-2 font-semibold text-gray-700 mb-1">
              <div>Name</div>
              <div className="text-right">Amt ({settings.currency})</div>
              <div>Pay/Yr</div>
              <div className="text-right">Growth %</div>
              <div>Category</div>
              <div>Priority</div>
              <div>Start</div>
              <div>End</div>
              <div></div>
            </div>
            {expensesList.length === 0 && (
              <p className="italic text-slate-500 col-span-full mb-2">No expenses added</p>
            )}
            {expensesList.map((e, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-9 gap-2 items-center mb-1">
                <div>
                  <input className="border p-2 rounded-md w-full" placeholder="Rent" value={e.name} onChange={ev => handleExpenseChange(i, 'name', ev.target.value)} title="Expense name" />
                  {expenseErrors[i]?.name && <span className="text-red-600 text-xs">{expenseErrors[i].name[0]}</span>}
                </div>
                <div>
                  <input className="border p-2 rounded-md text-right w-full" type="number" min="0" placeholder="0" value={e.amount} onChange={ev => handleExpenseChange(i, 'amount', ev.target.value)} title="Expense amount" />
                  {expenseErrors[i]?.amount && <span className="text-red-600 text-xs">{expenseErrors[i].amount[0]}</span>}
                </div>
                <div>
                  <input className="border p-2 rounded-md text-right w-full" type="number" min="1" step="1" value={e.paymentsPerYear} onChange={ev => handleExpenseChange(i, 'paymentsPerYear', ev.target.value)} title="Payments per year (use a Goal for one-off outflows)" />
                  {expenseErrors[i]?.paymentsPerYear && <span className="text-red-600 text-xs">{expenseErrors[i].paymentsPerYear[0]}</span>}
                </div>
                <div>
                  <input className="border p-2 rounded-md text-right w-full" type="number" min="0" step="0.1" placeholder="0" value={e.growth} onChange={ev => handleExpenseChange(i, 'growth', ev.target.value)} title="Growth rate" />
                  {expenseErrors[i]?.growth && <span className="text-red-600 text-xs">{expenseErrors[i].growth[0]}</span>}
                </div>
                <div>
                  <select className="border p-2 rounded-md w-full" value={e.category} onChange={ev => handleExpenseChange(i, 'category', ev.target.value)} aria-label="Expense category" title="Expense category">
                  <option>Fixed</option>
                  <option>Discretionary</option>
                  <option>Other</option>
                </select>
                  {expenseErrors[i]?.category && <span className="text-red-600 text-xs">{expenseErrors[i].category[0]}</span>}
                </div>
                <div>
                  <select className="border p-2 rounded-md w-full" value={e.priority} onChange={ev => handleExpenseChange(i, 'priority', ev.target.value)} aria-label="Expense priority" title="Expense priority">
                  <option value={1}>High</option>
                  <option value={2}>Medium</option>
                  <option value={3}>Low</option>
                </select>
                  {expenseErrors[i]?.priority && <span className="text-red-600 text-xs">{expenseErrors[i].priority[0]}</span>}
                </div>
                <div>
                  <input className="border p-2 rounded-md text-right w-full" type="number" placeholder="Start Year" value={e.startYear ?? defaultStart} onChange={ev => handleExpenseChange(i, 'startYear', ev.target.value)} title="Start year" />
                  {expenseErrors[i]?.startYear && <span className="text-red-600 text-xs">{expenseErrors[i].startYear[0]}</span>}
                </div>
                <div>
                  <input className="border p-2 rounded-md text-right w-full" type="number" placeholder="End Year" value={e.endYear ?? defaultEnd} onChange={ev => handleExpenseChange(i, 'endYear', ev.target.value)} title="End year" />
                  {expenseErrors[i]?.endYear && <span className="text-red-600 text-xs">{expenseErrors[i].endYear[0]}</span>}
                </div>
                <button onClick={() => removeExpense(i)} className="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500" aria-label="Remove expense">✖</button>
              </div>
            ))}
          </CardBody>
        )}
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-xl font-bold text-amber-700">Goals</h2>
          <div>
            <button onClick={() => setShowGoals(v => !v)} className="mr-2 text-sm text-amber-600">
              {showGoals ? 'Hide' : 'Show'}
            </button>
            <button onClick={addGoal} className="bg-amber-400 text-white px-4 py-2 rounded-md">+ Add</button>
          </div>
        </CardHeader>
        {showGoals && (
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 font-semibold text-gray-700 mb-1">
              <div>Name</div>
              <div className="text-right">Amt ({settings.currency})</div>
              <div className="text-right">Target Yr</div>
              <div>Start</div>
              <div>End</div>
              <div></div>
            </div>
            {goalsList.length === 0 && (
              <p className="italic text-slate-500 col-span-full mb-2">No goals added</p>
            )}
            {goalsList.map((g, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-center mb-1">
                <div>
                  <input className="border p-2 rounded-md w-full" placeholder="Vacation" value={g.name} onChange={ev => handleGoalChange(i, 'name', ev.target.value)} title="Goal name" />
                  {goalErrors[i]?.name && <span className="text-red-600 text-xs">{goalErrors[i].name[0]}</span>}
                </div>
                <div>
                  <input className="border p-2 rounded-md text-right w-full" type="number" min="0" placeholder="0" value={g.amount} onChange={ev => handleGoalChange(i, 'amount', ev.target.value)} title="Goal amount" />
                  {goalErrors[i]?.amount && <span className="text-red-600 text-xs">{goalErrors[i].amount[0]}</span>}
                </div>
                <div>
                  <input className="border p-2 rounded-md text-right w-full" type="number" min={currentYear} placeholder={String(currentYear)} value={g.targetYear} onChange={ev => handleGoalChange(i, 'targetYear', ev.target.value)} title="Target year" />
                  {goalErrors[i]?.targetYear && <span className="text-red-600 text-xs">{goalErrors[i].targetYear[0]}</span>}
                </div>
                <div>
                  <input className="border p-2 rounded-md text-right w-full" type="number" placeholder="Start Year" value={g.startYear ?? defaultStart} onChange={ev => handleGoalChange(i, 'startYear', ev.target.value)} title="Start year" />
                  {goalErrors[i]?.startYear && <span className="text-red-600 text-xs">{goalErrors[i].startYear[0]}</span>}
                </div>
                <div>
                  <input className="border p-2 rounded-md text-right w-full" type="number" placeholder="End Year" value={g.endYear ?? defaultEnd} onChange={ev => handleGoalChange(i, 'endYear', ev.target.value)} title="End year" />
                  {goalErrors[i]?.endYear && <span className="text-red-600 text-xs">{goalErrors[i].endYear[0]}</span>}
                </div>
                <button onClick={() => removeGoal(i)} className="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500" aria-label="Remove goal">✖</button>
              </div>
            ))}
          </CardBody>
        )}
      </Card>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[{ label: 'PV of Expenses', value: pvExpensesLife }, { label: 'PV of Goals', value: pvGoals }, { label: 'PV of Liabilities', value: totalLiabilitiesPV }, { label: 'Total Required PV', value: totalRequired }].map((it, i) => (
          <div key={i} className="bg-white rounded-xl shadow p-4 flex flex-col items-center">
            <span className="text-sm text-gray-500">{it.label}</span>
            <span className="mt-2 text-lg font-semibold text-amber-700">
              {formatCurrency(it.value, settings.locale, settings.currency)}
            </span>
          </div>
        ))}
      </section>

      <div className="text-right">
        <button onClick={exportJSON} className="mt-4 border border-amber-600 px-4 py-2 rounded-md hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500" aria-label="Export to JSON" title="Export to JSON">
          📁 Export to JSON
        </button>
        <button onClick={exportCSV} className="ml-2 mt-4 border border-amber-600 px-4 py-2 rounded-md hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500" aria-label="Export to CSV" title="Export to CSV">
          📊 Export to CSV
        </button>
        <button onClick={submitToAPI} className="ml-2 mt-4 border border-amber-600 px-4 py-2 rounded-md hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500" aria-label="Submit plan to API" title="Submit plan to API">
          🚀 Submit to API
        </button>
      </div>
    </div>
  )
}
