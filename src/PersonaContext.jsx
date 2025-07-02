import React, { createContext, useContext, useState, useEffect } from 'react'
import personasData from './data/personas.json'
import storage from './utils/storage'

const PersonaContext = createContext()

export function PersonaProvider({ children }) {
  const [currentPersonaId, _setCurrentPersonaId] = useState(() => {
    return localStorage.getItem('currentPersonaId') || personasData[0].id
  })
  const [currentData, setCurrentData] = useState(() => {
    const id = localStorage.getItem('currentPersonaId') || personasData[0].id
    return personasData.find(p => p.id === id) || personasData[0]
  })

  // ensure storage module is scoped to current persona before first render
  storage.setPersona(currentPersonaId)

  useEffect(() => {
    storage.setPersona(currentPersonaId)
  }, [currentPersonaId])

  const setCurrentPersonaId = (id) => {
    const persona = personasData.find(p => p.id === id) || personasData[0]
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

  return (
    <PersonaContext.Provider value={{ currentPersonaId, setCurrentPersonaId, currentData, personas: personasData }}>
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
      personas: personasData
    }
  }
  return ctx
}
