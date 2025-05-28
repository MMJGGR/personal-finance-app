import React, { useState } from 'react'
import { useEffect } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer
} from 'recharts'
import { useFinance } from './FinanceContext'

const COLORS = ['#fbbf24', '#f59e0b', '#fcd34d', '#fde68a', '#fef3c7', '#eab308', '#34d399', '#60a5fa']

const frequencyMap = {
  Monthly: 12,
  Annual: 1,
  OneTime: 0
}

export default function ExpensesGoalsTab() {
  const currentYear = new Date().getFullYear()
  const [expenses, setExpenses] = useState([
    { name: 'Rent', amount: 20000, frequency: 'Monthly', growth: 3, category: 'Fixed' },
    { name: 'Gym', amount: 3000, frequency: 'Monthly', growth: 2, category: 'Discretionary' }
  ])
  const [goals, setGoals] = useState([
    { name: 'Vacation', amount: 200000, targetYear: currentYear + 2 }
  ])

  const {
    discountRate, setDiscountRate,
    years, setYears,
    monthlyExpense, setMonthlyExpense,
    setExpensesPV
  } = useFinance()
  
  const averageMonthlyExpense = expenses.reduce((sum, exp) => {
    const freq = frequencyMap[exp.frequency]
    const annual = freq ? exp.amount * freq : exp.amount
    return sum + annual
  }, 0)/12
    useEffect(() => {
        setMonthlyExpense(averageMonthlyExpense)
    }, [averageMonthlyExpense, setMonthlyExpense])
  const clamp = (val, min = 0) => isNaN(val) || val < min ? min : val

  const handleExpenseChange = (index, field, value) => {
    const updated = [...expenses]
    if (field === 'name' || field === 'category' || field === 'frequency') {
      updated[index][field] = value
    } else {
      updated[index][field] = clamp(parseFloat(value))
    }
    setExpenses(updated)
  }

  const handleGoalChange = (index, field, value) => {
    const updated = [...goals]
    if (field === 'name') {
      updated[index][field] = value
    } else {
      updated[index][field] = clamp(parseFloat(value), field === 'targetYear' ? currentYear : 0)
    }
    setGoals(updated)
  }

  const addExpense = () => setExpenses([...expenses, { name: '', amount: 0, frequency: 'Monthly', growth: 0, category: 'Fixed' }])
  const addGoal = () => setGoals([...goals, { name: '', amount: 0, targetYear: currentYear }])

  const removeExpense = index => setExpenses(expenses.filter((_, i) => i !== index))
  const removeGoal = index => setGoals(goals.filter((_, i) => i !== index))

  const calculatePV = (amount, rate, year) => amount / Math.pow(1 + rate / 100, year)

  const barData = Array.from({ length: years }, (_, i) => {
    const year = currentYear + i
    const row = { year: `${year}` }
    expenses.forEach((exp, index) => {
      const freq = frequencyMap[exp.frequency]
      const grown = exp.amount * Math.pow(1 + exp.growth / 100, i)
      const total = freq ? grown * freq : i === 0 ? exp.amount : 0
      row[exp.name || `Expense ${index + 1}`] = total
    })
    return row
  })

  const pieData = expenses.reduce((acc, exp) => {
    const yearly = exp.frequency === 'Monthly' ? exp.amount * 12 : exp.amount
    const existing = acc.find(e => e.name === exp.category)
    if (existing) existing.value += yearly
    else acc.push({ name: exp.category, value: yearly })
    return acc
  }, [])

  const pvExpenses = barData.reduce((acc, row, i) => {
    const total = Object.entries(row)
      .filter(([key]) => key !== 'year')
      .reduce((sum, [, val]) => sum + val, 0)
    return acc + calculatePV(total, discountRate, i + 1)
  }, 0)

  const pvGoals = goals.reduce((acc, goal) => {
    const ytg = goal.targetYear - currentYear
    return acc + calculatePV(goal.amount, discountRate, ytg)
  }, 0)
  
  const totalRequired = pvExpenses + pvGoals
  useEffect(() => {
    setExpensesPV(pvExpenses)
    localStorage.setItem('expensesPV', pvExpenses)
    }, [pvExpenses, totalRequired, setExpensesPV])

  const exportJSON = () => {
    const data = {
      currentYear,
      assumptions: { discountRate, years },
      expenses,
      goals,
      pvExpenses,
      pvGoals,
      totalRequired
    }

    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'expenses-goals-data.json'
    a.click()
  }
    
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-xl font-bold text-amber-700">Expenses & Goals</h2>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Expenses</h3>
        {expenses.map((exp, i) => (
          <div key={i} className="grid grid-cols-6 gap-2 items-center">
            <input className="border p-2 rounded-md" placeholder="Name" value={exp.name} onChange={e => handleExpenseChange(i, 'name', e.target.value)} />
            <input className="border p-2 rounded-md" type="number" value={exp.amount} onChange={e => handleExpenseChange(i, 'amount', e.target.value)} />
            <select className="border p-2 rounded-md" value={exp.frequency} onChange={e => handleExpenseChange(i, 'frequency', e.target.value)}>
              <option>Monthly</option><option>Annual</option><option>OneTime</option>
            </select>
            <input className="border p-2 rounded-md" type="number" value={exp.growth} onChange={e => handleExpenseChange(i, 'growth', e.target.value)} />
            <input className="border p-2 rounded-md" placeholder="Category" value={exp.category} onChange={e => handleExpenseChange(i, 'category', e.target.value)} />
            <button onClick={() => removeExpense(i)} className="text-red-600 hover:text-red-800 text-sm">✖</button>
          </div>
        ))}
        <button className="bg-amber-600 hover:bg-amber-700 text-white p-2 rounded-md" onClick={addExpense}>Add Expense</button>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Goals</h3>
        {goals.map((goal, i) => (
          <div key={i} className="grid grid-cols-4 gap-2 items-center">
            <input className="border p-2 rounded-md" placeholder="Name" value={goal.name} onChange={e => handleGoalChange(i, 'name', e.target.value)} />
            <input className="border p-2 rounded-md" type="number" value={goal.amount} onChange={e => handleGoalChange(i, 'amount', e.target.value)} />
            <input className="border p-2 rounded-md" type="number" value={goal.targetYear} onChange={e => handleGoalChange(i, 'targetYear', e.target.value)} />
            <button onClick={() => removeGoal(i)} className="text-red-600 hover:text-red-800 text-sm">✖</button>
          </div>
        ))}
        <button className="bg-amber-600 hover:bg-amber-700 text-white p-2 rounded-md" onClick={addGoal}>Add Goal</button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-md p-4">
          <h4 className="font-medium text-center">Expense Allocation</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4">
          <h4 className="font-medium text-center">Expenses Over Time</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData} margin = {{ top: 20, right: 30, left: 0, bottom: 40 }}>
              <XAxis dataKey="year" tick = {{fontSize: 12}} />
              <YAxis tickFormatter={(value) => `KES ${value.toLocaleString()}`} />
              <Tooltip formatter={(value) => `KES ${value.toLocaleString()}`} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              {expenses.map((exp, i) => (
                <Bar key={exp.name || `Expense ${i + 1}`}
                dataKey={exp.name || `Expense ${i + 1}`}
                stackId="a"
                fill={COLORS[i % COLORS.length]}
                name = {exp.name.length > 12? exp.name.slice(0,10) + '...' : exp.name}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="text-right text-amber-700 font-semibold space-y-1">
        <p>Total PV of Expenses: {pvExpenses.toFixed(0)}</p>
        <p>Total PV of Goals: {pvGoals.toFixed(0)}</p>
        <p>Combined PV Requirement: {(pvExpenses + pvGoals).toFixed(0)}</p>
        <button onClick={exportJSON} className="mt-2 border border-amber-600 text-amber-700 px-4 py-2 rounded-md hover:bg-amber-100">📁 Export to JSON</button>
      </div>
    </div>
  )
}