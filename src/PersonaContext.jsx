import React, { createContext, useContext, useState, useEffect } from 'react'
import personasData from './data/personas.json'
import storage from './utils/storage'

const PersonaContext = createContext()

function loadStoredPersonas() {
  const out = []
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('persona-')) {
      try {
        const parsed = JSON.parse(localStorage.getItem(key))
        if (parsed && parsed.id) out.push(parsed)
      } catch { /* ignore malformed */ }
    }
  }
  return out
}

export function PersonaProvider({ children }) {
  const initialPersonas = [...personasData, ...loadStoredPersonas()]

  const [personas, setPersonas] = useState(initialPersonas)
  const [currentPersonaId, _setCurrentPersonaId] = useState(() => {
    return localStorage.getItem('currentPersonaId') || initialPersonas[0].id
  })
  const [currentData, setCurrentData] = useState(() => {
    const id = localStorage.getItem('currentPersonaId') || initialPersonas[0].id
    return initialPersonas.find(p => p.id === id) || initialPersonas[0]
  })

  // ensure storage module is scoped to current persona before first render
  storage.setPersona(currentPersonaId)

  useEffect(() => {
    storage.setPersona(currentPersonaId)
  }, [currentPersonaId])

  const setCurrentPersonaId = (id) => {
    const persona = personas.find(p => p.id === id) || personas[0]
    _setCurrentPersonaId(id)
    setCurrentData(persona)
    localStorage.setItem('currentPersonaId', id)
    storage.setPersona(id)

    const maybeInit = (key, value) => {
      if (value && !storage.get(key)) {
        storage.set(key, JSON.stringify(value))
      }
    }

    maybeInit('profile', persona.profile)
    maybeInit('incomeSources', persona.incomeSources)
    maybeInit('expensesList', persona.expensesList)
    maybeInit('goalsList', persona.goalsList)
    maybeInit('assetsList', persona.assetsList)
    maybeInit('liabilitiesList', persona.liabilitiesList)
    maybeInit('settings', persona.settings)
    if ('includeMediumPV' in persona) maybeInit('includeMediumPV', persona.includeMediumPV)
    if ('includeLowPV' in persona) maybeInit('includeLowPV', persona.includeLowPV)
    if ('includeGoalsPV' in persona) maybeInit('includeGoalsPV', persona.includeGoalsPV)
    if ('includeLiabilitiesNPV' in persona) maybeInit('includeLiabilitiesNPV', persona.includeLiabilitiesNPV)
  }

  const addPersona = (name = 'New Persona') => {
    const id = `p-${Date.now()}`
    const persona = { id, profile: { name } }
    storage.set(`persona-${id}`, JSON.stringify(persona))
    setPersonas(prev => [...prev, persona])
    setCurrentPersonaId(id)
  }

  const deletePersona = (id) => {
    const updated = personas.filter(p => p.id !== id)
    if (updated.length === 0) return
    storage.remove(`persona-${id}`)
    Object.keys(localStorage).forEach(k => {
      if (k.endsWith(`-${id}`)) localStorage.removeItem(k)
    })
    setPersonas(updated)
    if (currentPersonaId === id) {
      setCurrentPersonaId(updated[0].id)
    }
  }

  return (
    <PersonaContext.Provider value={{ currentPersonaId, setCurrentPersonaId, currentData, personas, addPersona, deletePersona }}>
      {children}
    </PersonaContext.Provider>
  )
}

export const usePersona = () => {
  const ctx = useContext(PersonaContext)
  if (!ctx) {
    const def = personasData[0]
    return {
      currentPersonaId: def.id,
      setCurrentPersonaId: () => {},
      currentData: def,
      personas: personasData,
      addPersona: () => {},
      deletePersona: () => {}
    }
  }
  return ctx
}
