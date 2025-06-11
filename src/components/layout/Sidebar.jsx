import React from 'react'

const sections = ['Income', 'Expenses & Goals', 'Balance Sheet', 'Profile', 'Insurance', 'Settings']

export default function Sidebar({ activeSection, onChange }) {
  return (
    <nav role="tablist" className="space-y-2 p-4 bg-white border-r min-w-[160px]">
      {sections.map(sec => (
        <button
          key={sec}
          role="tab"
          aria-selected={activeSection === sec}
          onClick={() => onChange(sec)}
          className={`block w-full text-left px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-amber-500 ${
            activeSection === sec ? 'bg-amber-50 text-amber-700 font-medium' : 'text-slate-700 hover:text-amber-700'
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
