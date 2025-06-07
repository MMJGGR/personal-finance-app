import storage from '../utils/storage'

describe('storage helpers', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('get/set/remove', () => {
    expect(storage.get('a')).toBeNull()
    storage.set('a', '1')
    expect(storage.get('a')).toBe('1')
    storage.remove('a')
    expect(storage.get('a')).toBeNull()
  })

  test('subscribe notifies on set/remove', () => {
    const events = []
    const unsubscribe = storage.subscribe('b', v => events.push(v))
    storage.set('b', 'x')
    storage.remove('b')
    unsubscribe()
    storage.set('b', 'y')
    expect(events).toEqual(['x', null])
  })
})
