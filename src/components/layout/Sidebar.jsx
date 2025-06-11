import React from 'react'

const sections = [
  'Profile',
  'Preferences',
  'Income',
  'Expenses & Goals',
  'Investments',
  'Retirement',
  'Balance Sheet',
  'Strategy',
  'Insurance',
]

export default function Sidebar({ activeTab, onChange }) {
  return (
    <nav role="tablist" className="space-y-2 p-4 bg-white border-r w-64">
      {sections.map(sec => (
        <button
          key={sec}
          role="tab"
          aria-selected={activeTab === sec}
          onClick={() => onChange(sec)}
          className={`block w-full text-left px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-amber-500 ${
            activeTab === sec ? 'bg-amber-50 text-amber-700 font-medium' : 'text-slate-700 hover:text-amber-700 hover:bg-amber-50'
          }`}
          title={sec}
        >
          {sec}
        </button>
      ))}
    </nav>
  )
}

export { sections }
