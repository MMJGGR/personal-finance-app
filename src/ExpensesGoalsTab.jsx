// src/ExpensesGoalsTab.jsx
import React, { useMemo, useEffect } from 'react'
import { useFinance } from './FinanceContext'
import { calculatePV } from './utils/financeUtils'
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer
} from 'recharts'

/**
 * ExpensesGoalsTab
 *
 * Manages:
 *  - Recurring Expenses
 *  - One-Time Goals
 *  - Liabilities (loans)
 *
 * Calculates PV requirements for each, visualizes allocation/trends,
 * and exports full plan as JSON.
 */
export default function ExpensesGoalsTab() {
  const currentYear = new Date().getFullYear()
  const {
    discountRate, years, settings,
    expensesList, setExpensesList,
    goalsList,    setGoalsList,
    liabilitiesList, setLiabilitiesList,
    setMonthlyExpense,
    setExpensesPV
  } = useFinance()

  /** --- HANDLERS --- */
  // Expenses
  const handleExpenseChange = (i, field, raw) => {
    const updated = expensesList.map((e, idx) => {
      if (idx !== i) return e
      if (['name','frequency','category'].includes(field))
        return { ...e, [field]: raw }
      const v = parseFloat(raw)
      return { ...e, [field]: isNaN(v)||v<0 ? 0 : v }
    })
    setExpensesList(updated)
  }
  const addExpense    = () => setExpensesList([...expensesList, {
    name:'', amount:0, frequency:'Monthly', growth:0, category:'Fixed'
  }])
  const removeExpense = i => setExpensesList(expensesList.filter((_,j)=>j!==i))

  // Goals
  const handleGoalChange = (i, field, raw) => {
    const updated = goalsList.map((g, idx) => {
      if (idx!==i) return g
      if (field==='name')
        return { ...g, name: raw }
      if (field==='targetYear') {
        const yr = parseInt(raw) || currentYear
        return { ...g, targetYear: Math.max(currentYear, yr) }
      }
      const v = parseFloat(raw)
      return { ...g, amount: isNaN(v)||v<0 ? 0 : v }
    })
    setGoalsList(updated)
  }
  const addGoal    = () => setGoalsList([...goalsList, {
    name:'', amount:0, targetYear: currentYear
  }])
  const removeGoal = i => setGoalsList(goalsList.filter((_,j)=>j!==i))

  // Liabilities
  const handleLiabilityChange = (i, field, raw) => {
    const updated = liabilitiesList.map((l, idx) => {
      if (idx!==i) return l
      if (field==='name')
        return { ...l, name: raw }
      if (['principal','interestRate'].includes(field)) {
        const v = parseFloat(raw)
        return { ...l, [field]: isNaN(v)||v<0 ? 0 : v }
      }
      if (field==='termYears' || field==='paymentsPerYear') {
        const v = parseInt(raw) || 0
        return { ...l, [field]: Math.max(1, v) }
      }
      return l
    })
    setLiabilitiesList(updated)
  }
  const addLiability    = () => setLiabilitiesList([...liabilitiesList, {
    name:'', principal:0, interestRate:0, termYears:1, paymentsPerYear:12
  }])
  const removeLiability = i => setLiabilitiesList(liabilitiesList.filter((_,j)=>j!==i))

  /** --- DERIVED DATA --- */
  // 1) Avg monthly expense
  const freqMap = { Monthly:12, Annual:1, OneTime:0 }
  const avgMonthly = useMemo(() => {
    if (!expensesList.length) return 0
    const annualSum = expensesList.reduce((sum,e) => {
      const f = freqMap[e.frequency]||0
      return sum + (f ? e.amount*f : e.amount)
    }, 0)
    return annualSum/12
  }, [expensesList])
  useEffect(() => setMonthlyExpense(avgMonthly), [avgMonthly, setMonthlyExpense])

  // 2) BarChart data
  const barData = useMemo(() => Array.from({ length: years }, (_, i) => {
    const row = { year: currentYear + i }
    expensesList.forEach((e,j) => {
      const grown = e.amount * Math.pow(1 + e.growth/100, i)
      const total = freqMap[e.frequency]
        ? grown * freqMap[e.frequency]
        : i===0 ? e.amount : 0
      row[e.name||`Exp${j+1}`] = total
    })
    return row
  }), [expensesList, years, currentYear])

  // 3) PieChart data
  const pieData = useMemo(() => {
    return expensesList.reduce((acc,e) => {
      const yearly = e.frequency==='Monthly' ? e.amount*12 : e.amount
      const bucket = acc.find(a=>a.name===e.category)
      if (bucket) bucket.value += yearly
      else acc.push({ name:e.category, value:yearly })
      return acc
    }, [])
  }, [expensesList])

  // 4) PV of expenses (growing annuity)
  const pvExpenses = useMemo(() => {
    return barData.reduce((sum,row,i) => {
      const yearTotal = Object.entries(row)
        .filter(([k])=>k!=='year')
        .reduce((s,[,v])=>s+v,0)
      return sum + calculatePV(yearTotal, 1, 0, discountRate, i+1)
    }, 0)
  }, [barData, discountRate])

  // 5) PV of goals (lump-sum)
  const pvGoals = useMemo(() => {
    return goalsList.reduce((sum,g) => {
      const yrs = Math.max(0, g.targetYear - currentYear)
      return sum + g.amount / Math.pow(1 + discountRate/100, yrs)
    }, 0)
  }, [goalsList, discountRate, currentYear])

  // 6) Liability details: payment & PV via annuity formula
  const liabilityDetails = useMemo(() => {
    return liabilitiesList.map(l => {
      const n = l.termYears * l.paymentsPerYear
      const i = (l.interestRate/100) / l.paymentsPerYear
      const payment = i === 0
        ? l.principal / n
        : (i * l.principal) / (1 - Math.pow(1 + i, -n))
      const pv = payment * (1 - Math.pow(1 + i, -n)) / i
      return { ...l, payment, pv }
    })
  }, [liabilitiesList])

  const totalLiabilitiesPV = liabilityDetails.reduce((s,l)=>s+l.pv,0)
  const totalRequired = pvExpenses + pvGoals + totalLiabilitiesPV

  // Persist expensesPV
  useEffect(() => {
    setExpensesPV(pvExpenses)
    localStorage.setItem('expensesPV', pvExpenses.toString())
  }, [pvExpenses, setExpensesPV])

  // Export JSON
  const exportJSON = () => {
    const payload = {
      currentYear, discountRate, years,
      expenses: expensesList, pvExpenses,
      goals: goalsList,       pvGoals,
      liabilities: liabilityDetails, totalLiabilitiesPV,
      totalRequired
    }
    const blob = new Blob([JSON.stringify(payload,null,2)], { type:'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = 'financial-plan.json'; a.click()
  }

  // Tailwind amber palette
  const COLORS = ['#fbbf24','#f59e0b','#fcd34d','#fde68a','#fef3c7','#eab308','#34d399','#60a5fa']

  /** --- RENDER --- */
  return (
    <div className="space-y-8 p-6">

      {/* EXPENSES */}
      <section>
        <h2 className="text-2xl font-bold text-amber-700 mb-2">Expenses</h2>
        {/* headers */}
        <div className="grid grid-cols-6 gap-2 font-semibold text-gray-700 mb-1">
          <div>Expense Name</div>
          <div className="text-right">Amount ({settings.currency})</div>
          <div>Frequency</div>
          <div className="text-right">Growth %/yr</div>
          <div>Category</div>
          <div></div>
        </div>
        {/* rows */}
        {expensesList.map((e,i)=>(
          <div key={i} className="grid grid-cols-6 gap-2 items-center mb-1">
            <input
              className="border p-2 rounded-md"
              placeholder="e.g. Rent"
              value={e.name}
              onChange={ev=>handleExpenseChange(i,'name',ev.target.value)}
            />
            <input
              className="border p-2 rounded-md text-right"
              type="number" min="0" placeholder="0"
              value={e.amount}
              onChange={ev=>handleExpenseChange(i,'amount',ev.target.value)}
            />
            <select
              className="border p-2 rounded-md"
              value={e.frequency}
              onChange={ev=>handleExpenseChange(i,'frequency',ev.target.value)}
            >
              <option>Monthly</option>
              <option>Annual</option>
              <option>OneTime</option>
            </select>
            <input
              className="border p-2 rounded-md text-right"
              type="number" min="0" step="0.1" placeholder="0"
              value={e.growth}
              onChange={ev=>handleExpenseChange(i,'growth',ev.target.value)}
            />
            <select
              className="border p-2 rounded-md"
              value={e.category}
              onChange={ev=>handleExpenseChange(i,'category',ev.target.value)}
            >
              <option>Fixed</option>
              <option>Discretionary</option>
              <option>Other</option>
            </select>
            <button
              onClick={()=>removeExpense(i)}
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

      {/* GOALS */}
      <section>
        <h2 className="text-2xl font-bold text-amber-700 mb-2">Goals</h2>
        <div className="grid grid-cols-4 gap-2 font-semibold text-gray-700 mb-1">
          <div>Goal Name</div>
          <div className="text-right">Amount ({settings.currency})</div>
          <div className="text-right">Target Year</div>
          <div></div>
        </div>
        {goalsList.map((g,i)=>(
          <div key={i} className="grid grid-cols-4 gap-2 items-center mb-1">
            <input
              className="border p-2 rounded-md"
              placeholder="e.g. Vacation"
              value={g.name}
              onChange={ev=>handleGoalChange(i,'name',ev.target.value)}
            />
            <input
              className="border p-2 rounded-md text-right"
              type="number" min="0" placeholder="0"
              value={g.amount}
              onChange={ev=>handleGoalChange(i,'amount',ev.target.value)}
            />
            <input
              className="border p-2 rounded-md text-right"
              type="number" min={currentYear}
              placeholder={String(currentYear)}
              value={g.targetYear}
              onChange={ev=>handleGoalChange(i,'targetYear',ev.target.value)}
            />
            <button
              onClick={()=>removeGoal(i)}
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

      {/* LIABILITIES */}
      <section>
        <h2 className="text-2xl font-bold text-amber-700 mb-2">Liabilities (Loans)</h2>
        <div className="grid grid-cols-8 gap-2 font-semibold text-gray-700 mb-1">
          <div>Loan Name</div>
          <div className="text-right">Principal</div>
          <div className="text-right">Interest %</div>
          <div className="text-right">Term yrs</div>
          <div>Payments/yr</div>
          <div className="text-right">Payment</div>
          <div className="text-right">PV</div>
          <div></div>
        </div>
        {liabilityDetails.map((l,i)=>(
          <div key={i} className="grid grid-cols-8 gap-2 items-center mb-1">
            <input
              className="border p-2 rounded-md"
              placeholder="e.g. Car Loan"
              value={l.name}
              onChange={ev=>handleLiabilityChange(i,'name',ev.target.value)}
            />
            <input
              className="border p-2 rounded-md text-right"
              type="number" min="0" placeholder="0"
              value={l.principal}
              onChange={ev=>handleLiabilityChange(i,'principal',ev.target.value)}
            />
            <input
              className="border p-2 rounded-md text-right"
              type="number" min="0" step="0.1" placeholder="0"
              value={l.interestRate}
              onChange={ev=>handleLiabilityChange(i,'interestRate',ev.target.value)}
            />
            <input
              className="border p-2 rounded-md text-right"
              type="number" min="1" placeholder="1"
              value={l.termYears}
              onChange={ev=>handleLiabilityChange(i,'termYears',ev.target.value)}
            />
            <select
              className="border p-2 rounded-md"
              value={l.paymentsPerYear}
              onChange={ev=>handleLiabilityChange(i,'paymentsPerYear',ev.target.value)}
            >
              <option value={12}>Monthly</option>
              <option value={4}>Quarterly</option>
              <option value={1}>Annually</option>
            </select>
            <div className="text-right">{l.payment.toFixed(2)}</div>
            <div className="text-right">{l.pv.toFixed(2)}</div>
            <button
              onClick={()=>removeLiability(i)}
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

      {/* VISUALS */}
      <div className="grid sm:grid-cols-2 gap-6 pt-6">
        {/* Pie */}
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="text-center font-medium mb-2">Expense Allocation</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {pieData.map((_,idx)=>
                  <Cell key={idx} fill={COLORS[idx%COLORS.length]}/>
                )}
              </Pie>
              <Tooltip formatter={v=>v.toLocaleString(settings.locale,{
                style:'currency', currency:settings.currency
              })}/>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar */}
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="text-center font-medium mb-2">Expenses Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <XAxis dataKey="year"/>
              <YAxis tickFormatter={v=>v.toLocaleString(settings.locale,{
                style:'currency', currency:settings.currency
              })}/>
              <Tooltip formatter={v=>v.toLocaleString(settings.locale,{
                style:'currency', currency:settings.currency
              })}/>
              <Legend wrapperStyle={{ fontSize:'12px' }}/>
              {expensesList.map((e,idx)=>(
                <Bar
                  key={idx}
                  dataKey={e.name||`Exp${idx+1}`}
                  stackId="a"
                  fill={COLORS[idx%COLORS.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SUMMARY & EXPORT */}
      <div className="text-right text-amber-700 font-semibold space-y-1 pt-6">
        <p>PV of Expenses: {pvExpenses.toLocaleString(settings.locale,{
          style:'currency', currency:settings.currency
        })}</p>
        <p>PV of Goals:    {pvGoals.toLocaleString(settings.locale,{
          style:'currency', currency:settings.currency
        })}</p>
        <p>PV of Liabilities: {totalLiabilitiesPV.toLocaleString(settings.locale,{
          style:'currency', currency:settings.currency
        })}</p>
        <p className="mt-2">Total Required PV: {totalRequired.toLocaleString(settings.locale,{
          style:'currency', currency:settings.currency
        })}</p>
        <button
          onClick={exportJSON}
          className="mt-2 border border-amber-600 px-4 py-2 rounded-md hover:bg-amber-50"
        >
          📁 Export to JSON
        </button>
      </div>
    </div>
  )
}
