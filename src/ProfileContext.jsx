// src/ProfileContext.jsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import storage from './utils/storage'
import { usePersona } from './PersonaContext'
import { riskScoreMap } from './riskScoreConfig'

const defaultProfile = {
  name: '',
  email: '',
  phone: '',
  age: 30,
  maritalStatus: '',
  numDependents: 0,
  residentialAddress: '',
  nationality: '',
  education: '',
  location: '',
  citizenship: '',
  taxJurisdiction: '',
  idNumber: '',
  taxResidence: '',
  employmentStatus: '',
  annualIncome: 0,
  liquidNetWorth: 0,
  sourceOfFunds: '',
  behaviouralProfile: {},
  financialChallenge: '',
  investmentKnowledge: '',
  lossResponse: '',
  investmentHorizon: '',
  investmentGoal: '',
  riskCapacity: '',
  riskWillingness: '',
  lifeExpectancy: 85,
}

function safeParse(str, fallback) {
  try {
    return JSON.parse(str)
  } catch {
    return fallback
  }
}

const ProfileContext = createContext()

export function ProfileProvider({ children }) {
  const { currentData } = usePersona()

  const [profile, setProfile] = useState(() => {
    const s = storage.get('profile')
    return s ? safeParse(s, defaultProfile) : defaultProfile
  })

  const [riskScore, setRiskScore] = useState(0)

  const calculateRiskScore = useCallback((p) => {
    const map = riskScoreMap
    let s = 0
    s += map.knowledge[p.investmentKnowledge] || 0
    s += map.response[p.lossResponse] || 0
    s += map.horizon[p.investmentHorizon] || 0
    s += map.goal[p.investmentGoal] || 0
    s += map.riskCapacity[p.riskCapacity] || 0
    s += map.riskWillingness[p.riskWillingness] || 0
    return s
  }, [])

  const updateProfile = useCallback((updated) => {
    setProfile(updated)
    storage.set('profile', JSON.stringify(updated))
    const score = calculateRiskScore(updated)
    setRiskScore(score)
    storage.set('riskScore', score)
  }, [calculateRiskScore])

  const clearProfile = useCallback(() => {
    updateProfile(defaultProfile)
  }, [updateProfile])

  const resetProfile = useCallback(() => {
    if (currentData?.profile) {
      updateProfile(currentData.profile)
    }
  }, [currentData, updateProfile])

  // Auto-load persisted state on mount
  useEffect(() => {
    const sProf = storage.get('profile')
    let loadedProfile = null
    if (sProf) {
      const p = safeParse(sProf, null)
      if (p) {
        loadedProfile = p
        setProfile(p)
      }
    }

    const rs = storage.get('riskScore')
    if (rs) {
      setRiskScore(+rs)
    } else if (loadedProfile) {
      setRiskScore(calculateRiskScore(loadedProfile))
    }
  }, [calculateRiskScore])

  // Load default persona data if no saved profile
  useEffect(() => {
    if (storage.get('profile')) return
    const seed = currentData
    if (!seed) return
    if (seed.profile) updateProfile(seed.profile)
  }, [currentData, updateProfile])

  return (
    <ProfileContext.Provider value={{
      profile,
      updateProfile,
      clearProfile,
      resetProfile,
      riskScore,
    }}>
      {children}
    </ProfileContext.Provider>
  )
}

export const useProfile = () => useContext(ProfileContext)
