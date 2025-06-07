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

  test('multiple subscribers receive updates', () => {
    const first = []
    const second = []
    const unsub1 = storage.subscribe('c', v => first.push(v))
    const unsub2 = storage.subscribe('c', v => second.push(v))
    storage.set('c', '1')
    unsub1()
    storage.set('c', '2')
    storage.remove('c')
    unsub2()
    expect(first).toEqual(['1'])
    expect(second).toEqual(['1', '2', null])
  })

  test('updates in another tab trigger callbacks', () => {
    const events = []
    storage.subscribe('d', v => events.push(v))
    localStorage.setItem('d', 'z')
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'd',
      newValue: 'z',
      oldValue: null,
      storageArea: localStorage
    }))
    expect(events).toEqual(['z'])
  })

  test('removals in another tab trigger callbacks', () => {
    const events = []
    storage.subscribe('e', v => events.push(v))
    localStorage.removeItem('e')
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'e',
      newValue: null,
      oldValue: 'old',
      storageArea: localStorage
    }))
    expect(events).toEqual([null])
  })
})
