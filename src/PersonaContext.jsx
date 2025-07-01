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

  useEffect(() => {
    storage.setPersona(currentPersonaId)
  }, [currentPersonaId])

  const setCurrentPersonaId = (id) => {
    const persona = personasData.find(p => p.id === id) || personasData[0]
    _setCurrentPersonaId(id)
    setCurrentData(persona)
    localStorage.setItem('currentPersonaId', id)
    storage.setPersona(id)

    
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
