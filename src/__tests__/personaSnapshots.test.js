import { addPersonaSnapshot, readPersonaSnapshots, clearPersonaSnapshots } from '../utils/personaSnapshots'
import storage from '../utils/storage'

describe('persona snapshots', () => {
  beforeEach(() => {
    localStorage.clear()
    clearPersonaSnapshots(storage)
  })

  test('addPersonaSnapshot stores snapshot', () => {
    const persona = { profile: { firstName: 'Jane' }, incomeSources: [] }
    addPersonaSnapshot(storage, persona)
    const snaps = readPersonaSnapshots(storage)
    expect(snaps).toHaveLength(1)
    expect(snaps[0].persona.profile.firstName).toBe('Jane')
  })
})
