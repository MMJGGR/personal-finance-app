// src/App.jsx
import React, { Suspense, useState } from 'react'
import Spinner from './Spinner.jsx'
import Header from './components/layout/Header.jsx'
import Sidebar from './components/layout/Sidebar.jsx'

const IncomeTab = React.lazy(() => import('./components/Income/IncomeTab.jsx'))
const ExpensesGoalsTab = React.lazy(() => import('./components/ExpensesGoals/ExpensesGoalsTab.jsx'))
const BalanceSheetTab = React.lazy(() => import('./components/BalanceSheet/BalanceSheetTab.jsx'))
const ProfileTab = React.lazy(() => import('./components/Profile/ProfileTab.jsx'))
const PreferencesTab = React.lazy(() => import('./tabs/PreferencesTab.jsx'))
const InsuranceTab = React.lazy(() => import('./components/Insurance/InsuranceTab.jsx'))
const InvestmentsTab = React.lazy(() => import('./components/Investments/InvestmentsTab.jsx'))
const RetirementTab = React.lazy(() => import('./components/Retirement/RetirementTab.jsx'))
const StrategyTab = React.lazy(() => import('./tabs/StrategyTab.jsx'))


const components = {
  Profile: ProfileTab,
  Preferences: PreferencesTab,
  Income: IncomeTab,
  'Expenses & Goals': ExpensesGoalsTab,
  Investments: InvestmentsTab,
  Retirement: RetirementTab,
  'Balance Sheet': BalanceSheetTab,
  Strategy: StrategyTab,
  Insurance: InsuranceTab,
}

export default function App() {
  const [activeTab, setActiveTab] = useState('Profile')
  const Active = components[activeTab]

  return (
    <div className="min-h-screen flex">
      <Sidebar activeTab={activeTab} onChange={setActiveTab} />
      <div className="flex-1">
        <Header setActiveTab={setActiveTab} />
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white p-4 rounded shadow min-h-[300px]">
            <Suspense fallback={<Spinner />}>
              <Active />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
