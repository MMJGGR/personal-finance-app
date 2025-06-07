import mitt from 'mitt'

const emitter = mitt()

if (typeof window !== 'undefined') {
  window.addEventListener('storage', event => {
    if (event.storageArea === localStorage) {
      emitter.emit(event.key, event.newValue)
    }
  })
}

const storage = {
  get(key) {
    return localStorage.getItem(key)
  },
  set(key, value) {
    localStorage.setItem(key, value)
    emitter.emit(key, value)
  },
  remove(key) {
    localStorage.removeItem(key)
    emitter.emit(key, null)
  },
  subscribe(key, cb) {
    emitter.on(key, cb)
    return () => emitter.off(key, cb)
  }
}

export default storage
