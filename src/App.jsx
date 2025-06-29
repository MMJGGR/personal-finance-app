// src/App.jsx
import React, { Suspense, useState } from 'react'
import Spinner from './Spinner.jsx'
import Header from './components/layout/Header.jsx'
import Sidebar from './components/layout/Sidebar.jsx'
import { FinanceProvider } from './FinanceContext.jsx'
import { PersonaProvider, usePersona } from './PersonaContext.jsx'
import personas from './data/personas.json'

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

function AppInner() {
  const [activeTab, setActiveTab] = useState('Profile')
  const Active = components[activeTab]

  return (
    <div className="min-h-screen flex flex-col">
      <Header setActiveTab={setActiveTab} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} onSelect={setActiveTab} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <Suspense fallback={<Spinner />}>
            <Active />
          </Suspense>
        </main>
      </div>
      <footer className="text-center text-xs text-gray-600 bg-gray-100 py-2">
        Projections are for illustrative purposes only.
      </footer>
    </div>
  )
}

function AppWithFinance() {
  const { currentPersonaId: _currentPersonaId } = usePersona() // Destructure and rename to avoid unused variable warning
  return (
    <FinanceProvider>
      <AppInner />
    </FinanceProvider>
  )
}

export default function App() {
  return (
    <PersonaProvider personas={personas}>
      <AppWithFinance />
    </PersonaProvider>
  )
}
