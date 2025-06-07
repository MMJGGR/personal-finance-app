// src/App.jsx
import React, { Suspense, useState } from 'react'
import Spinner from './Spinner.jsx'

const IncomeTab = React.lazy(() => import('./IncomeTab.jsx'))
const ExpensesGoalsTab = React.lazy(() => import('./ExpensesGoalsTab.jsx'))
const BalanceSheetTab = React.lazy(() => import('./BalanceSheetTab.jsx'))
const ProfileTab = React.lazy(() => import('./ProfileTab.jsx'))
const SettingsTab = React.lazy(() => import('./SettingsTab.jsx'))
const InsuranceTab = React.lazy(() => import('./InsuranceTab.jsx'))


const tabs = ['Income', 'Expenses & Goals', 'Balance Sheet', 'Profile', 'Insurance', 'Settings']
const components = {
  Income: IncomeTab,
  'Expenses & Goals': ExpensesGoalsTab,
  'Balance Sheet': BalanceSheetTab,
  Profile: ProfileTab,
  Insurance: InsuranceTab,
  Settings: SettingsTab,
}

export default function App() {
  const [activeTab, setActiveTab] = useState('Income')
  const Active = components[activeTab]

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Personal Finance Planner</h1>

      <nav
        role="tablist"
        className="flex space-x-4 border-b pb-2 mb-4 overflow-x-auto"
      >
        {tabs.map(tab => (
          <button
            role="tab"
            aria-selected={activeTab === tab}
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 rounded-t focus:outline-none focus:ring-2 focus:ring-amber-500 ${
              activeTab === tab
                ? 'bg-white shadow text-amber-700'
                : 'text-slate-500 hover:text-amber-700'
            }`}
            title={tab}
          >
            {tab}
          </button>
        ))}
      </nav>

      <div className="bg-white p-4 rounded shadow min-h-[300px]">
        <Suspense fallback={<Spinner />}>
          <Active />
        </Suspense>
      </div>
    </div>
  )
}
