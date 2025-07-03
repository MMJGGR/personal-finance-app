import React, { useState } from 'react'
import {
  readPersonaSnapshots,
  addPersonaSnapshot,
  clearPersonaSnapshots
} from '../utils/personaSnapshots'
import storage from '../utils/storage'
import { useFinance } from '../FinanceContext'
import { Card, CardHeader, CardBody } from './common/Card.jsx'

export default function SnapshotCarousel() {
  const {
    profile,
    incomeSources,
    expensesList,
    goalsList,
    assetsList,
    liabilitiesList,
    settings,
    includeMediumPV,
    includeLowPV,
    includeGoalsPV,
    includeLiabilitiesNPV,
    revertPersona
  } = useFinance()
  const [snaps, setSnaps] = useState(() => readPersonaSnapshots(storage))
  const [index, setIndex] = useState(snaps.length - 1)
  const prev = () => setIndex(i => Math.max(0, i - 1))
  const next = () => setIndex(i => Math.min(snaps.length - 1, i + 1))
  const saveSnap = () => {
    const persona = {
      profile,
      incomeSources,
      expensesList,
      goalsList,
      assetsList,
      liabilitiesList,
      settings,
      includeMediumPV,
      includeLowPV,
      includeGoalsPV,
      includeLiabilitiesNPV
    }
    addPersonaSnapshot(storage, persona)
    const updated = readPersonaSnapshots(storage)
    setSnaps(updated)
    setIndex(updated.length - 1)
  }
  const clearAll = () => {
    clearPersonaSnapshots(storage)
    setSnaps([])
    setIndex(-1)
  }
  if (snaps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-amber-800">Persona Snapshots</h3>
        </CardHeader>
        <CardBody>
          <button onClick={saveSnap} className="px-2 py-1 bg-amber-600 text-white rounded">Save Snapshot</button>
        </CardBody>
      </Card>
    )
  }
  const snap = snaps[index]
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-amber-800">Persona Snapshots</h3>
      </CardHeader>
      <CardBody>
        <div className="flex items-center gap-2 mb-2 text-sm">
          <button onClick={prev} disabled={index===0} className="px-2 py-1 border rounded">Prev</button>
          <span>{index + 1} / {snaps.length}</span>
          <button onClick={next} disabled={index===snaps.length-1} className="px-2 py-1 border rounded">Next</button>
          <button onClick={() => revertPersona(snap.persona)} className="ml-auto px-2 py-1 bg-amber-600 text-white rounded">Revert</button>
          <button onClick={saveSnap} className="px-2 py-1 border rounded">Save</button>
          <button onClick={clearAll} className="px-2 py-1 border rounded">Clear</button>
        </div>
        <pre className="text-xs bg-gray-50 p-2 overflow-auto">{JSON.stringify(snap.persona, null, 2)}</pre>
      </CardBody>
    </Card>
  )
}
