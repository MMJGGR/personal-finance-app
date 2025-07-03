import React from 'react'
import { usePersona } from '../../PersonaContext.jsx'

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
  'Timeline',
]

export default function Sidebar({ activeTab, onSelect }) {
  const { currentPersonaId, setCurrentPersonaId, personas, addPersona, removePersona } = usePersona()
  return (
    <aside className="w-72 bg-white border-r overflow-y-auto">
      <div className="p-6">
        <div className="mb-4" aria-label="Persona">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Personas</span>
            <button
              onClick={() => addPersona()}
              className="border border-amber-600 px-2 py-1 rounded text-sm hover:bg-amber-50"
              aria-label="Add Persona"
            >
              Add Persona
            </button>
          </div>
          <ul className="space-y-1">
            {personas.map(p => (
              <li key={p.id} className="flex justify-between items-center">
                <button
                  onClick={() => setCurrentPersonaId(p.id)}
                  className={`text-sm px-2 py-1 rounded hover:bg-amber-50 ${
                    currentPersonaId === p.id ? 'font-medium' : ''
                  }`}
                >
                  {p.profile.name}
                </button>
                {personas.length > 1 && (
                  <button
                    onClick={() => removePersona(p.id)}
                    className="text-xs text-red-600"
                    aria-label="Delete Persona"
                  >
                    Delete
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
        <h2 className="text-lg font-medium text-amber-600 mb-4">Getting Started</h2>
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
