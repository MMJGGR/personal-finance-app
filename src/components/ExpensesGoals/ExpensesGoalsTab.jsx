// src/ExpensesGoalsTab.jsx

import React, { useMemo, useEffect, useState } from 'react'
import { formatCurrency } from '../../utils/formatters'
import { useFinance } from '../../FinanceContext'
import { calculateLoanSchedule } from '../../modules/loan/loanCalculator.js'
import { presentValue } from '../../utils/financeUtils'
import { buildPlanJSON, buildPlanCSV, submitProfile } from '../../utils/exportHelpers'
import storage from '../../utils/storage'
import { appendAuditLog } from '../../utils/auditLog'
import sanitize from '../../utils/sanitize'
import { expenseItemSchema, goalItemSchema } from '../../schemas/expenseGoalSchemas.js'
import { frequencyToPayments } from '../../utils/financeUtils'
import { calculateAmortizedPayment } from '../../utils/financeUtils'
import { ResponsiveContainer } from 'recharts'
import LifetimeStackedChart from './LifetimeStackedChart'
import ExpensesStackedBarChart from '../ExpensesStackedBarChart.jsx'
import buildTimeline from '../../selectors/timeline'
import { annualAmountForYear } from '../../utils/streamHelpers'
import { Card, CardHeader, CardBody } from '../common/Card.jsx'
import AssumptionsModal from '../AssumptionsModal.jsx'
import ExpenseRow from '../ExpenseRow.jsx'
import { usePersona } from '../../PersonaContext.jsx'
import {
  defaultExpenses,
  defaultGoals,
  defaultLiabilities,
} from './defaults.js'

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
    investmentContributions, setInvestmentContributions,
    pensionStreams, setPensionStreams,
    setExpensesPV,
    setGoalsPV,
    profile,
    settings,
    startYear,
    years,
    annualIncome,
    includeMediumPV,
    includeLowPV,
    includeGoalsPV,
    includeLiabilitiesNPV
  } = useFinance()
  const { currentData } = usePersona()
  const horizon = Math.max(1, profile.lifeExpectancy - profile.age)
  const defaultStart = currentYear
  const defaultEnd = currentYear + horizon

  const birthYear = currentYear - (profile.age ?? 0)
  const retirementYear = birthYear + (currentData.settings?.retirementAge ?? settings.retirementAge ?? 65)

  const [showExpenses, setShowExpenses] = useState(true)
  const [showGoals, setShowGoals] = useState(true)
  const [showLiabilities, setShowLiabilities] = useState(true)
  const [showAssumptions, setShowAssumptions] = useState(false)
  const [_expenseErrors, setExpenseErrors] = useState({})
  const [goalErrors, setGoalErrors] = useState({})

  const filteredExpenses = useMemo(
    () =>
      expensesList.filter(e => {
        if (e.include === false) return false
        if (e.priority === 2 && !includeMediumPV) return false
        if (e.priority > 2 && !includeLowPV) return false
        return true
      }),
    [expensesList, includeMediumPV, includeLowPV]
  )

  const filteredGoals = useMemo(
    () => (includeGoalsPV ? goalsList : []),
    [goalsList, includeGoalsPV]
  )

  // Populate defaults on first mount when no data is present
  useEffect(() => {
    if (expensesList.length === 0) {
      const list = defaultExpenses(defaultStart, defaultEnd)
      setExpensesList(list)
      storage.set('expensesList', JSON.stringify(list))
    }
    if (goalsList.length === 0) {
      const list = defaultGoals(defaultStart)
      setGoalsList(list)
      storage.set('goalsList', JSON.stringify(list))
    }
    if (liabilitiesList.length === 0) {
      const list = defaultLiabilities(defaultStart)
      setLiabilitiesList(list)
      storage.set('liabilitiesList', JSON.stringify(list))
    }
    if (investmentContributions.length === 0) {
      const list = [
        {
          id: crypto.randomUUID(),
          name: 'Mutual Fund',
          amount: 500,
          frequency: 12,
          growth: 0,
          startYear: defaultStart,
          endYear: defaultStart + 5,
        },
      ]
      setInvestmentContributions(list)
      storage.set('investmentContributions', JSON.stringify(list))
    }
    if (pensionStreams.length === 0) {
      const list = [
        {
          id: crypto.randomUUID(),
          name: 'Pension',
          amount: 15000,
          frequency: 12,
          growth: 0,
          startYear: defaultStart + 30,
          endYear: defaultStart + 50,
        },
      ]
      setPensionStreams(list)
      storage.set('pensionStreams', JSON.stringify(list))
    }
  }, [])

  // --- Helpers ---

  // --- CRUD Handlers ---
  // Expenses
  const handleExpenseChange = (id, field, raw) => {
    const value = typeof raw === 'string' ? sanitize(raw) : raw
    const oldValue = expensesList.find(e => e.id === id)?.[field]
    setExpensesList(prev =>
      prev.map(exp => {
        if (exp.id !== id) return exp
        let updated
        if (field === 'frequency') {
          const ppy = frequencyToPayments(value) || 1
          updated = { ...exp, frequency: value, paymentsPerYear: ppy }
        } else {
          updated = { ...exp, [field]: value }
        }
        const parsed = expenseItemSchema.safeParse(updated)
        if (parsed.success) {
          setExpenseErrors(err => ({ ...err, [id]: {} }))
          return parsed.data
        } else {
          setExpenseErrors(err => ({
            ...err,
            [id]: parsed.error.flatten().fieldErrors,
          }))
          return updated
        }
      })
    )
    appendAuditLog(storage, {
      field: `expense.${field}`,
      oldValue,
      newValue: value,
    })
  }
  const addExpense = () => {
    setExpensesList([
      ...expensesList,
      {
        id: crypto.randomUUID(),
        name: '',
        amount: 0,
        frequency: 'Monthly',
        paymentsPerYear: 12,
        growth: 0,
        category: 'Fixed',
        priority: 2,
        include: true,
        startYear: defaultStart,
        endYear: defaultEnd,
      },
    ])
  }
  const removeExpense = id => {
    if (window.confirm('Delete this item?')) {
      setExpensesList(expensesList.filter(e => e.id !== id))
      setExpenseErrors(err => {
        const { [id]: _, ...rest } = err
        return rest
      })
    }
  }

  // Goals
  const handleGoalChange = (id, field, raw) => {
    const value = typeof raw === 'string' ? sanitize(raw) : raw
    const oldValue = goalsList.find(g => g.id === id)?.[field]
    setGoalsList(prev =>
      prev.map(goal => {
        if (goal.id !== id) return goal
        const updated = { ...goal, [field]: value }
        const parsed = goalItemSchema.safeParse(updated)
        if (parsed.success) {
          setGoalErrors(err => ({ ...err, [id]: {} }))
          return parsed.data
        } else {
          setGoalErrors(err => ({
            ...err,
            [id]: parsed.error.flatten().fieldErrors,
          }))
          return updated
        }
      })
    )
    appendAuditLog(storage, {
      field: `goal.${field}`,
      oldValue,
      newValue: value,
    })
  }
  const addGoal = () => {
    setGoalsList([
      ...goalsList,
      {
        id: crypto.randomUUID(),
        name: '',
        amount: 0,
        targetYear: currentYear,
        startYear: defaultStart,
        endYear: defaultEnd,
      },
    ])
  }
  const removeGoal = id => {
    if (window.confirm('Delete this item?')) {
      setGoalsList(goalsList.filter(g => g.id !== id))
      setGoalErrors(err => {
        const { [id]: _, ...rest } = err
        return rest
      })
    }
  }

  // Liabilities (Loans)
  const handleLiabilityChange = (id, field, valueRaw) => {
    const value = typeof valueRaw === 'string' ? sanitize(valueRaw) : valueRaw
    const oldValue = liabilitiesList.find(l => l.id === id)?.[field]
    setLiabilitiesList(prev =>
      prev.map(l => {
        if (l.id !== id) return l
        const updated = { ...l, [field]: value }
        const computedPayment = calculateAmortizedPayment(
          Number(updated.principal) || 0,
          Number(updated.interestRate) || 0,
          Number(updated.termYears) || 0,
          Number(updated.paymentsPerYear) || 1
        )
        return { ...updated, computedPayment }
      })
    )
    appendAuditLog(storage, {
      field: `liability.${field}`,
      oldValue,
      newValue: value,
    })
  }
  const addLiability = () => {
    const base = {
      id: crypto.randomUUID(),
      name: '',
      principal: 0,
      interestRate: 0,
      termYears: 1,
      paymentsPerYear: 12,
      extraPayment: 0,
      include: true,
      startYear: defaultStart,
      endYear: defaultEnd,
    }
    const computedPayment = calculateAmortizedPayment(
      base.principal,
      base.interestRate,
      base.termYears,
      base.paymentsPerYear
    )
    setLiabilitiesList([...liabilitiesList, { ...base, computedPayment }])
  }
  const removeLiability = id => {
    if (window.confirm('Delete this item?')) {
      setLiabilitiesList(liabilitiesList.filter(l => l.id !== id))
    }
  }

  const clearLists = () => {
    setExpensesList([])
    setGoalsList([])
    setLiabilitiesList([])
  }

  const resetDefaults = () => {
    setExpensesList(defaultExpenses(defaultStart, defaultEnd))
    setGoalsList(defaultGoals(defaultStart))
    setLiabilitiesList(defaultLiabilities(defaultStart))
  }

  // --- 1) Remaining lifetime horizon ---
  const lifeYears = Math.max(1, Math.floor(profile.lifeExpectancy - profile.age))

  // --- 2) PV of Expenses over lifeYears ---
  const pvExpensesLife = useMemo(() => {
    const horizonEnd = currentYear + lifeYears - 1
    return filteredExpenses.reduce((sum, e) => {
      const start = e.startYear ?? currentYear
      const end = e.endYear ?? horizonEnd
      const first = Math.max(start, currentYear)
      const last = Math.min(end, horizonEnd)
      if (last < first) return sum
      const growth = e.growth || 0
      let pv = 0
      const ppy = e.paymentsPerYear || frequencyToPayments(e.frequency) || 1
      for (let yr = first; yr <= last; yr++) {
        const idx = yr - start
        const cash = (e.amount * ppy) * Math.pow(1 + growth / 100, idx)
        const disc = yr - currentYear + 1
        pv += cash / Math.pow(1 + discountRate / 100, disc)
      }
      return sum + pv
    }, 0)
  }, [filteredExpenses, discountRate, lifeYears, currentYear])

  useEffect(() => {
    setExpensesPV(pvExpensesLife)
    storage.set('expensesPV', pvExpensesLife.toString())
  }, [pvExpensesLife, setExpensesPV])

  // --- 3) PV of Goals ---
  const pvGoals = useMemo(() => {
    if (!includeGoalsPV) return 0
    const horizonEnd = currentYear + lifeYears - 1
    return goalsList.reduce((sum, g) => {
      const target = g.targetYear ?? g.startYear ?? currentYear
      if (target < currentYear || target > horizonEnd) return sum
      const yrs = target - currentYear
      return sum + g.amount / Math.pow(1 + discountRate / 100, yrs)
    }, 0)
  }, [goalsList, includeGoalsPV, discountRate, currentYear, lifeYears])

  // --- 4) Loan details & amortization ---
  const liabilityDetails = useMemo(() => {
    return liabilitiesList.filter(l => l.include !== false).map(l => {
      const start = new Date((l.startYear ?? currentYear), 0, 1).getTime()
      const sched = calculateLoanSchedule({
        principal: Number(l.principal) || 0,
        annualRate: (Number(l.interestRate) || 0) / 100,
        termYears: Number(l.termYears) || 0,
        paymentsPerYear: l.paymentsPerYear,
        extraPayment: Number(l.extraPayment) || 0
      }, start)
      const pv = presentValue(
        sched.payments.map(p => p.payment),
        (discountRate / 100) / l.paymentsPerYear
      )
      const scheduleMap = {}
      sched.payments.forEach(p => {
        const y = new Date(p.date).getFullYear()
        if (!scheduleMap[y]) {
          scheduleMap[y] = { year: y, principalPaid: 0, interestPaid: 0, remaining: p.balance }
        }
        scheduleMap[y].principalPaid += p.principalPaid
        scheduleMap[y].interestPaid += p.interestPaid
        scheduleMap[y].remaining = p.balance
      })
      const schedule = Object.values(scheduleMap)
      return { ...l, pv, schedule }
    })
  }, [liabilitiesList, currentYear, discountRate])

  const totalLiabilitiesPV = includeLiabilitiesNPV
    ? liabilityDetails.reduce((s, l) => s + l.pv, 0)
    : 0
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
      if (!includeLiabilitiesNPV) return 0
      return liabilityDetails.reduce((sum, l) => {
        const match = l.schedule.find(sc => sc.year === y)
        return match ? sum + match.principalPaid + match.interestPaid : sum
      }, 0)
    }
    const assumptions = {
      retirementAge: retirementYear - 1,
      deathAge: startYear + (profile.lifeExpectancy - profile.age) - 1,
    }
    const rows = buildTimeline(
      minYear,
      maxYear,
      incomeFn,
      filteredExpenses,
      filteredGoals,
      loanForYear
    )
    let running = 0
    return rows.map(row => {
      const invest = annualAmountForYear(investmentContributions, row.year, assumptions)
      const pension = annualAmountForYear(pensionStreams, row.year, assumptions)
      const income = row.income + pension
      const net = income - row.expenses - row.goals - row.loans - invest
      running += net
      return {
        ...row,
        income,
        investments: invest,
        pension,
        debtService: row.loans,
        net,
        surplus: running,
      }
    })
  }, [
    filteredExpenses,
    filteredGoals,
    includeMediumPV,
    includeLowPV,
    includeGoalsPV,
    includeLiabilitiesNPV,
    liabilityDetails,
    annualIncome,
    startYear,
    years,
    investmentContributions,
    pensionStreams,
    retirementYear,
    profile.age,
    profile.lifeExpectancy,
  ])

  const maxSurplus = useMemo(() => {
    if (timelineData.length === 0) return 0
    return Math.max(...timelineData.map(r => r.surplus))
  }, [timelineData])

  const hasDeficit = useMemo(
    () => timelineData.some(row => row.net < 0),
    [timelineData]
  )

  useEffect(() => {
    if (typeof setGoalsPV === 'function') setGoalsPV(pvGoals)
    storage.set('goalsPV', pvGoals.toString())
  }, [pvGoals, setGoalsPV])

  useEffect(() => {
    storage.set('loansPV', totalLiabilitiesPV.toString())
  }, [totalLiabilitiesPV])

  useEffect(() => {
    const totalPV = pvExpensesLife + pvGoals + totalLiabilitiesPV
    storage.set('totalPV', totalPV.toString())
  }, [pvExpensesLife, pvGoals, totalLiabilitiesPV])

  // --- 5) PV Summary data ---
  const pvSummaryData = [
    { id: 'exp', category: 'Expenses',     value: pvExpensesLife },
    { id: 'goal', category: 'Goals',        value: pvGoals },
    { id: 'liab', category: 'Liabilities',  value: totalLiabilitiesPV }
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
    const name = profile.name.replace(/\s+/g, '_')
    a.download = `financial-plan-${name}.json`
    a.click()
  }

  const exportCSV = () => {
    const csv = buildPlanCSV(profile, pvSummaryData, liabilityDetails)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const name = profile.name.replace(/\s+/g, '_')
    a.download = `financial-plan-${name}.csv`
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
          <LifetimeStackedChart data={timelineData} locale={settings.locale} currency={settings.currency} />
        </ResponsiveContainer>
      </section>

      <Card>
        <h3 className="text-lg font-bold text-amber-800">Advisor Insights</h3>
        {hasDeficit && (
          <p className="text-red-600">⚠️ Cashflow deficit detected in some years. Consider reducing expenses or deferring goals.</p>
        )}
        <p>Peak surplus: {formatCurrency(maxSurplus, settings.locale, settings.currency)}</p>
      </Card>

      <div className="text-right space-x-2">
        <button
          onClick={clearLists}
          className="mt-2 border border-amber-600 px-4 py-1 rounded-md text-sm hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Clear lists"
        >
          Clear
        </button>
        <button
          onClick={resetDefaults}
          className="mt-2 border border-amber-600 px-4 py-1 rounded-md text-sm hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="Reset lists to defaults"
        >
          Reset Defaults
        </button>
      </div>


      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-xl font-bold text-amber-800">Expenses</h2>
          <div>
            <button
              onClick={() => setShowExpenses(v => !v)}
              className="mr-2 text-sm text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {showExpenses ? 'Hide' : 'Show'}
            </button>
            <button
              onClick={addExpense}
              className="bg-amber-400 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              aria-label="Add expense"
            >
              + Add
            </button>
          </div>
        </CardHeader>
        {showExpenses && (
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-7 gap-2 font-semibold text-gray-700 mb-1">
              <div>Name</div>
              <div className="text-right">Amt ({settings.currency})</div>
              <div>Pay/Yr</div>
              <div>Category</div>
              <div>Start</div>
              <div>End</div>
              <div>Include</div>
            </div>
            {expensesList.length === 0 && (
              <p className="italic text-slate-500 col-span-full mb-2">No expenses added</p>
            )}
            {expensesList.map(e => (
              <ExpenseRow
                key={e.id}
                id={e.id}
                name={e.name}
                amount={e.amount}
                frequency={e.frequency}
                category={e.category}
                startYear={e.startYear ?? defaultStart}
                endYear={e.endYear ?? defaultEnd}
                include={e.include !== false}
                onChange={handleExpenseChange}
                onDelete={removeExpense}
              />
            ))}
      </CardBody>
        )}
      </Card>

      <ExpensesStackedBarChart />

      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-xl font-bold text-amber-800">Goals</h2>
          <div>
            <button
              onClick={() => setShowGoals(v => !v)}
              className="mr-2 text-sm text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {showGoals ? 'Hide' : 'Show'}
            </button>
            <button
              onClick={addGoal}
              className="bg-amber-400 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              aria-label="Add goal"
            >
              + Add
            </button>
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
            {goalsList.map(g => (
              <div key={g.id} className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-center mb-1">
                <div>
                  <label htmlFor={`goal-name-${g.id}`} className="sr-only">Goal name</label>
                  <input
                    id={`goal-name-${g.id}`}
                    className="border p-2 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-md w-full"
                    placeholder="Vacation"
                    value={g.name}
                    onChange={ev => handleGoalChange(g.id, 'name', ev.target.value)}
                    title="Goal name"
                    aria-label="Goal name"
                  />
                  {goalErrors[g.id]?.name && <span className="text-red-600 text-xs">{goalErrors[g.id].name[0]}</span>}
                </div>
                <div>
                  <label htmlFor={`goal-amount-${g.id}`} className="sr-only">Goal amount</label>
                  <input
                    id={`goal-amount-${g.id}`}
                    className="border p-2 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-md text-right w-full"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={g.amount}
                    onChange={ev => handleGoalChange(g.id, 'amount', ev.target.value)}
                    title="Goal amount"
                    aria-label="Goal amount"
                  />
                  {goalErrors[g.id]?.amount && <span className="text-red-600 text-xs">{goalErrors[g.id].amount[0]}</span>}
                </div>
                <div>
                  <label htmlFor={`goal-target-${g.id}`} className="sr-only">Target year</label>
                  <input
                    id={`goal-target-${g.id}`}
                    className="border p-2 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-md text-right w-full"
                    type="number"
                    min={currentYear}
                    placeholder={String(currentYear)}
                    value={g.targetYear}
                    onChange={ev => handleGoalChange(g.id, 'targetYear', ev.target.value)}
                    title="Target year"
                    aria-label="Target year"
                  />
                  {goalErrors[g.id]?.targetYear && <span className="text-red-600 text-xs">{goalErrors[g.id].targetYear[0]}</span>}
                </div>
                <div>
                  <label htmlFor={`goal-start-${g.id}`} className="sr-only">Start year</label>
                  <input
                    id={`goal-start-${g.id}`}
                    className="border p-2 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-md text-right w-full"
                    type="number"
                    placeholder="Start Year"
                    value={g.startYear ?? defaultStart}
                    onChange={ev => handleGoalChange(g.id, 'startYear', ev.target.value)}
                    title="Start year"
                    aria-label="Start year"
                  />
                  {goalErrors[g.id]?.startYear && <span className="text-red-600 text-xs">{goalErrors[g.id].startYear[0]}</span>}
                </div>
                <div>
                  <label htmlFor={`goal-end-${g.id}`} className="sr-only">End year</label>
                  <input
                    id={`goal-end-${g.id}`}
                    className="border p-2 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-md text-right w-full"
                    type="number"
                    placeholder="End Year"
                    value={g.endYear ?? defaultEnd}
                    onChange={ev => handleGoalChange(g.id, 'endYear', ev.target.value)}
                    title="End year"
                    aria-label="End year"
                  />
                  {goalErrors[g.id]?.endYear && <span className="text-red-600 text-xs">{goalErrors[g.id].endYear[0]}</span>}
                </div>
                <button onClick={() => removeGoal(g.id)} className="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500" aria-label="Remove goal">✖</button>
              </div>
            ))}
          </CardBody>
        )}
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-xl font-bold text-amber-800">Liabilities</h2>
          <div>
            <button
              onClick={() => setShowLiabilities(v => !v)}
              className="mr-2 text-sm text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {showLiabilities ? 'Hide' : 'Show'}
            </button>
            <button
              onClick={addLiability}
              className="bg-amber-400 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              aria-label="Add liability"
            >
              + Add
            </button>
          </div>
        </CardHeader>
        {showLiabilities && (
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-8 gap-2 font-semibold text-gray-700 mb-1">
              <div>Name</div>
              <div className="text-right">Principal</div>
              <div className="text-right">Rate %</div>
              <div className="text-right">Term</div>
              <div>Pay/Yr</div>
              <div className="text-right">Extra</div>
              <div>Include</div>
              <div></div>
            </div>
            {liabilitiesList.length === 0 && (
              <p className="italic text-slate-500 col-span-full mb-2">No loans added</p>
            )}
            {liabilitiesList.map(l => (
              <div key={l.id} className="grid grid-cols-1 sm:grid-cols-8 gap-2 items-center mb-1">
                <div>
                  <label htmlFor={`liab-name-${l.id}`} className="sr-only">Liability name</label>
                  <input
                    id={`liab-name-${l.id}`}
                    className="border p-2 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-md w-full"
                    value={l.name || ''}
                    onChange={ev => handleLiabilityChange(l.id, 'name', ev.target.value)}
                    aria-label="Liability name"
                  />
                </div>
                <div>
                  <label htmlFor={`liab-principal-${l.id}`} className="sr-only">Principal</label>
                  <input
                    id={`liab-principal-${l.id}`}
                    type="number"
                    className="border p-2 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-md text-right w-full"
                    value={l.principal}
                    onChange={ev => handleLiabilityChange(l.id, 'principal', ev.target.value)}
                    aria-label="Principal"
                  />
                </div>
                <div>
                  <label htmlFor={`liab-rate-${l.id}`} className="sr-only">Interest rate</label>
                  <input
                    id={`liab-rate-${l.id}`}
                    type="number"
                    step="0.01"
                    className="border p-2 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-md text-right w-full"
                    value={l.interestRate}
                    onChange={ev => handleLiabilityChange(l.id, 'interestRate', ev.target.value)}
                    aria-label="Interest rate"
                  />
                </div>
                <div>
                  <label htmlFor={`liab-term-${l.id}`} className="sr-only">Term years</label>
                  <input
                    id={`liab-term-${l.id}`}
                    type="number"
                    className="border p-2 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-md text-right w-full"
                    value={l.termYears}
                    onChange={ev => handleLiabilityChange(l.id, 'termYears', ev.target.value)}
                    aria-label="Term years"
                  />
                </div>
                <div>
                  <label htmlFor={`liab-payments-${l.id}`} className="sr-only">Payments per year</label>
                  <input
                    id={`liab-payments-${l.id}`}
                    type="number"
                    className="border p-2 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-md text-right w-full"
                    value={l.paymentsPerYear}
                    onChange={ev => handleLiabilityChange(l.id, 'paymentsPerYear', ev.target.value)}
                    aria-label="Payments per year"
                  />
                </div>
                <div>
                  <label htmlFor={`liab-extra-${l.id}`} className="sr-only">Extra payment</label>
                  <input
                    id={`liab-extra-${l.id}`}
                    type="number"
                    className="border p-2 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-md text-right w-full"
                    value={l.extraPayment}
                    onChange={ev => handleLiabilityChange(l.id, 'extraPayment', ev.target.value)}
                    aria-label="Extra payment"
                  />
                </div>
                <div className="flex items-center mt-6 sm:mt-0">
                  <input
                    id={`liab-include-${l.id}`}
                    type="checkbox"
                    className="mr-1"
                    checked={l.include !== false}
                    onChange={ev => handleLiabilityChange(l.id, 'include', ev.target.checked)}
                    aria-label="Include liability"
                  />
                  <label htmlFor={`liab-include-${l.id}`} className="text-sm">Include</label>
                </div>
                <button
                  onClick={() => removeLiability(l.id)}
                  className="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label="Remove liability"
                >
                  ✖
                </button>
              </div>
            ))}
          </CardBody>
        )}
      </Card>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[{ id: 'exp', label: 'PV of Expenses', value: pvExpensesLife }, { id: 'goal', label: 'PV of Goals', value: pvGoals }, { id: 'liab', label: 'PV of Liabilities', value: totalLiabilitiesPV }, { id: 'total', label: 'Total Required PV', value: totalRequired }].map(it => (
          <div key={it.id} className="bg-white rounded-xl shadow p-4 flex flex-col items-center">
            <span className="text-sm text-gray-500">{it.label}</span>
            <span className="mt-2 text-lg font-semibold text-amber-800">
              {formatCurrency(it.value, settings.locale, settings.currency)}
            </span>
          </div>
        ))}
      </section>

      <div className="text-right">
        <button
          onClick={() => setShowAssumptions(true)}
          className="mt-4 border border-amber-600 px-4 py-2 rounded-md hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="View assumptions"
          title="View assumptions"
        >
          ℹ️ Assumptions
        </button>
        <button onClick={exportJSON} className="ml-2 mt-4 border border-amber-600 px-4 py-2 rounded-md hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500" aria-label="Export to JSON" title="Export to JSON">
          📁 Export to JSON
        </button>
        <button onClick={exportCSV} className="ml-2 mt-4 border border-amber-600 px-4 py-2 rounded-md hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500" aria-label="Export to CSV" title="Export to CSV">
          📊 Export to CSV
        </button>
        <button onClick={submitToAPI} className="ml-2 mt-4 border border-amber-600 px-4 py-2 rounded-md hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500" aria-label="Submit plan to API" title="Submit plan to API">
          🚀 Submit to API
        </button>
      </div>
      <AssumptionsModal open={showAssumptions} onClose={() => setShowAssumptions(false)} />
    </div>
  )
}
