import mitt from 'mitt'

const emitter = mitt()

let personaId = ''

function applyKey(key) {
  if (!personaId || key === 'currentPersonaId') return key
  return `${key}-${personaId}`
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', event => {
    if (event.storageArea === localStorage) {
      emitter.emit(event.key, event.newValue)
    }
  })
}

const storage = {
  setPersona(id) {
    personaId = id
  },
  get(key) {
    return localStorage.getItem(applyKey(key))
  },
  set(key, value) {
    const k = applyKey(key)
    localStorage.setItem(k, value)
    emitter.emit(k, value)
  },
  remove(key) {
    const k = applyKey(key)
    localStorage.removeItem(k)
    emitter.emit(k, null)
  },
  subscribe(key, cb) {
    const k = applyKey(key)
    emitter.on(k, cb)
    return () => emitter.off(k, cb)
  }
}

export default storage
