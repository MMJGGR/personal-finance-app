import { addEvent, updateEvent, removeEvent, readEvents, clearEvents } from '../utils/eventTimeline'
import storage from '../utils/storage'

describe('event timeline utils', () => {
  beforeEach(() => {
    localStorage.clear()
    clearEvents(storage)
  })

  test('crud operations', () => {
    addEvent(storage, { id: '1', date: '2025-01-01', label: 'Start' })
    let events = readEvents(storage)
    expect(events).toHaveLength(1)
    updateEvent(storage, '1', { label: 'Updated' })
    events = readEvents(storage)
    expect(events[0].label).toBe('Updated')
    removeEvent(storage, '1')
    events = readEvents(storage)
    expect(events).toHaveLength(0)
  })
})
