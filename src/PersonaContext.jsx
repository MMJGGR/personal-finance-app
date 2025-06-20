import React, { createContext, useContext, useState } from 'react'
import personasData from './data/personas.json'
import storage from './utils/storage'

const PersonaContext = createContext()

export function PersonaProvider({ children }) {
  const [currentPersonaId, _setCurrentPersonaId] = useState(() => {
    return storage.get('currentPersonaId') || personasData[0].id
  })
  const [currentData, setCurrentData] = useState(() => {
    const id = storage.get('currentPersonaId') || personasData[0].id
    return personasData.find(p => p.id === id) || personasData[0]
  })

  const setCurrentPersonaId = (id) => {
    const persona = personasData.find(p => p.id === id) || personasData[0]
    _setCurrentPersonaId(id)
    setCurrentData(persona)
    storage.set('currentPersonaId', id)

    Object.keys(localStorage).forEach(k => {
      if (k !== 'currentPersonaId') localStorage.removeItem(k)
    })

    if (persona.profile) storage.set('profile', JSON.stringify(persona.profile))
    if (persona.incomeSources) storage.set('incomeSources', JSON.stringify(persona.incomeSources))
    if (persona.expensesList) storage.set('expensesList', JSON.stringify(persona.expensesList))
    if (persona.goalsList) storage.set('goalsList', JSON.stringify(persona.goalsList))
    if (persona.assetsList) storage.set('assetsList', JSON.stringify(persona.assetsList))
    if (persona.liabilitiesList) storage.set('liabilitiesList', JSON.stringify(persona.liabilitiesList))
    if (persona.settings) storage.set('settings', JSON.stringify(persona.settings))
    if ('includeMediumPV' in persona) storage.set('includeMediumPV', JSON.stringify(persona.includeMediumPV))
    if ('includeLowPV' in persona) storage.set('includeLowPV', JSON.stringify(persona.includeLowPV))
    if ('includeGoalsPV' in persona) storage.set('includeGoalsPV', JSON.stringify(persona.includeGoalsPV))
    if ('includeLiabilitiesNPV' in persona) storage.set('includeLiabilitiesNPV', JSON.stringify(persona.includeLiabilitiesNPV))
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
