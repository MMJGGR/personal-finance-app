import React, { createContext, useContext, useState, useEffect } from 'react'
import personasData from './data/personas.json'
import storage from './utils/storage'
import { defaultProfile } from './FinanceContext.jsx'

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
  if (out.length) return out
  const raw = localStorage.getItem('personas')
  if (raw) {
    try {
      return JSON.parse(raw)
    } catch { /* ignore */ }
  }
  return personasData
}

export function PersonaProvider({ children }) {
  const initialPersonas = loadStoredPersonas()

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

  useEffect(() => {
    localStorage.setItem('personas', JSON.stringify(personas))
  }, [personas])

  const setCurrentPersonaId = (id) => {
    const persona = personas.find(p => p.id === id) || personas[0]
    _setCurrentPersonaId(id)
    setCurrentData(persona)
    localStorage.setItem('currentPersonaId', id)
    storage.setPersona(id)
  }

  const persistPersona = (id, data) => {
    storage.setPersona(id)
    if (data.profile) storage.set('profile', JSON.stringify(data.profile))
    if (data.incomeSources) storage.set('incomeSources', JSON.stringify(data.incomeSources))
    if (data.expensesList) storage.set('expensesList', JSON.stringify(data.expensesList))
    if (data.goalsList) storage.set('goalsList', JSON.stringify(data.goalsList))
    if (data.assetsList) storage.set('assetsList', JSON.stringify(data.assetsList))
    if (data.liabilitiesList) storage.set('liabilitiesList', JSON.stringify(data.liabilitiesList))
    if (data.investmentContributions) storage.set('investmentContributions', JSON.stringify(data.investmentContributions))
    if (data.pensionStreams) storage.set('pensionStreams', JSON.stringify(data.pensionStreams))
    if (data.privatePensionContributions) storage.set('privatePensionContributions', JSON.stringify(data.privatePensionContributions))
    if (data.settings) storage.set('settings', JSON.stringify(data.settings))
    if ('includeMediumPV' in data) storage.set('includeMediumPV', JSON.stringify(data.includeMediumPV))
    if ('includeLowPV' in data) storage.set('includeLowPV', JSON.stringify(data.includeLowPV))
    if ('includeGoalsPV' in data) storage.set('includeGoalsPV', JSON.stringify(data.includeGoalsPV))
    if ('includeLiabilitiesNPV' in data) storage.set('includeLiabilitiesNPV', JSON.stringify(data.includeLiabilitiesNPV))
    storage.set('profileComplete', 'false')
    storage.setPersona(currentPersonaId)
  }

  const addPersona = (data = {}) => {
    const id = `p-${Date.now()}`
    const persona = {
      id,
      profile: { ...defaultProfile, ...(data.profile || {}) },
      incomeSources: data.incomeSources || [],
      expensesList: data.expensesList || [],
      goalsList: data.goalsList || [],
      assetsList: data.assetsList || [],
      liabilitiesList: data.liabilitiesList || [],
      investmentContributions: data.investmentContributions || [],
      pensionStreams: data.pensionStreams || [],
      privatePensionContributions: data.privatePensionContributions || [],
      settings: data.settings || {}
    }
    persona.profile.name = [
      persona.profile.firstName,
      persona.profile.lastName
    ].filter(Boolean).join(' ')
    const next = [...personas, persona]
    setPersonas(next)
    localStorage.setItem(`persona-${id}`, JSON.stringify(persona))
    persistPersona(id, persona)
    setCurrentPersonaId(id)
  }

  const updatePersona = (id, updates) => {
    setPersonas(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...updates } : p)
      const updatedPersona = next.find(p => p.id === id)
      if (updatedPersona) {
        localStorage.setItem(`persona-${id}`, JSON.stringify(updatedPersona))
      }
      persistPersona(id, updates)
      return next
    })
  }

  const removePersona = (id) => {
    const updated = personas.filter(p => p.id !== id)
    if (updated.length === 0) return
    localStorage.removeItem(`persona-${id}`)
    Object.keys(localStorage).forEach(k => {
      if (k.endsWith(`-${id}`)) localStorage.removeItem(k)
    })
    setPersonas(updated)
    if (currentPersonaId === id) {
      setCurrentPersonaId(updated[0].id)
    }
  }

  return (
    <PersonaContext.Provider value={{ currentPersonaId, setCurrentPersonaId, currentData, personas, addPersona, updatePersona, removePersona }}>
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
      updatePersona: () => {},
      removePersona: () => {}
    }
  }
  return ctx
}
