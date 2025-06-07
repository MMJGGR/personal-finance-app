import mitt from 'mitt'

const emitter = mitt()

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
