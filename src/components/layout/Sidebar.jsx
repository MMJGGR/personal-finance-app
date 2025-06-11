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

export default function Sidebar({ activeTab, onSelect }) {
  return (
    <aside className="w-72 bg-white border-r overflow-y-auto">
      <div className="p-6">
        <h2 className="text-lg font-medium text-amber-400 mb-4">Getting Started</h2>
        <nav className="space-y-2" role="tablist">
          {sections.map(tab => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => onSelect(tab)}
              className={`block w-full text-left px-4 py-2 rounded ${
                activeTab === tab
                  ? 'bg-amber-50 font-medium'
                  : 'hover:bg-amber-50 text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  )
}

export { sections }
