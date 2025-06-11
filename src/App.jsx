// src/App.jsx
import React, { Suspense, useState } from 'react'
import Spinner from './Spinner.jsx'
import Header from './components/layout/Header.jsx'
import Sidebar from './components/layout/Sidebar.jsx'

const IncomeTab = React.lazy(() => import('./components/Income/IncomeTab.jsx'))
const ExpensesGoalsTab = React.lazy(() => import('./components/ExpensesGoals/ExpensesGoalsTab.jsx'))
const BalanceSheetTab = React.lazy(() => import('./components/BalanceSheet/BalanceSheetTab.jsx'))
const ProfileTab = React.lazy(() => import('./components/Profile/ProfileTab.jsx'))
const SettingsTab = React.lazy(() => import('./components/Settings/SettingsTab.jsx'))
const InsuranceTab = React.lazy(() => import('./components/Insurance/InsuranceTab.jsx'))


const components = {
  Income: IncomeTab,
  'Expenses & Goals': ExpensesGoalsTab,
  'Balance Sheet': BalanceSheetTab,
  Profile: ProfileTab,
  Insurance: InsuranceTab,
  Settings: SettingsTab,
}

export default function App() {
  const [activeSection, setActiveSection] = useState('Income')
  const Active = components[activeSection]

  return (
    <div className="min-h-screen flex">
      <Sidebar activeSection={activeSection} onChange={setActiveSection} />
      <div className="flex-1">
        <Header />
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
