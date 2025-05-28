// src/App.jsx
import React, { useState } from 'react'
import { useFinance } from './FinanceContext.jsx'
import IncomeTab from './IncomeTab'
import ExpensesGoalsTab from './ExpensesGoalsTab'
import BalanceSheetTab from './BalanceSheetTab'
import ProfileTab from './ProfileTab'
import SettingsTab from './SettingsTab'


const tabs = ['Income', 'Expenses & Goals', 'Balance Sheet', 'Profile','Settings']
const components = {
  Income: IncomeTab,
  'Expenses & Goals': ExpensesGoalsTab,
  'Balance Sheet': BalanceSheetTab,
  Profile: ProfileTab,
  Settings: SettingsTab,
}

export default function App() {
  const [activeTab, setActiveTab] = useState('Income')
  const Active = components[activeTab]

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Personal Finance Planner</h1>

      <div className="flex space-x-4 border-b pb-2 mb-4 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 rounded-t ${
              activeTab === tab
                ? 'bg-white shadow text-amber-700'
                : 'text-slate-500 hover:text-amber-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white p-4 rounded shadow min-h-[300px]">
        <Active />
      </div>
    </div>
  )
}
