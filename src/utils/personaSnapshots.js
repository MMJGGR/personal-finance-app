export function readPersonaSnapshots(storage) {
  try {
    const raw = storage.get('persona-snapshots')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addPersonaSnapshot(storage, persona) {
  const snaps = readPersonaSnapshots(storage)
  snaps.push({ ts: new Date().toISOString(), persona })
  try {
    storage.set('persona-snapshots', JSON.stringify(snaps))
  } catch (err) {
    console.error('Failed to save persona snapshot', err)
  }
}

export function clearPersonaSnapshots(storage) {
  try {
    storage.remove('persona-snapshots')
  } catch (err) {
    console.error('Failed to clear persona snapshots', err)
  }
}
