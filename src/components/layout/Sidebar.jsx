import React from 'react'
import { usePersona } from '../../PersonaContext'

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
  const { currentPersonaId, setCurrentPersonaId, personas, addPersona, deletePersona } = usePersona()
  const singlePersona = personas.length === 1
  const currentPersona = personas.find(p => p.id === currentPersonaId) || personas[0]
  return (
    <aside className="w-72 bg-white border-r overflow-y-auto">
      <div className="p-6">
        {singlePersona ? (
          <div className="mb-4" aria-label="Persona">
            <div className="text-sm font-medium">{currentPersona.profile.name}</div>
            <button
              onClick={() => addPersona()}
              className="mt-2 border border-amber-600 px-2 py-1 rounded text-sm hover:bg-amber-50"
              aria-label="Add Persona"
            >
              Add Persona
            </button>
          </div>
        ) : (
          <>
            <label className="block mb-2 text-sm" htmlFor="persona-select">Persona</label>
            <select
              id="persona-select"
              className="mb-2 w-full border rounded px-2 py-1"
              value={currentPersonaId}
              onChange={e => setCurrentPersonaId(e.target.value)}
            >
              {personas.map(p => (
                <option key={p.id} value={p.id}>{p.profile.name}</option>
              ))}
            </select>
            <div className="mb-4 flex space-x-2">
              <button
                onClick={() => addPersona()}
                className="border border-amber-600 px-2 py-1 rounded text-sm hover:bg-amber-50"
                aria-label="Add Persona"
              >
                Add Persona
              </button>
              <button
                onClick={() => deletePersona(currentPersonaId)}
                className="border border-amber-600 px-2 py-1 rounded text-sm hover:bg-amber-50"
                aria-label="Remove Persona"
              >
                Remove Persona
              </button>
            </div>
          </>
        )}
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
