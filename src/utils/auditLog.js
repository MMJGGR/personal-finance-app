export function readAuditLog(storage) {
  try {
    const raw = storage.get('profile-audit')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function appendAuditLog(storage, entry = {}) {
  const log = readAuditLog(storage)
  log.push({ ts: new Date().toISOString(), ...entry })
  try {
    storage.set('profile-audit', JSON.stringify(log))
  } catch (err) {
    console.error('Failed to write audit log', err)
  }
}

let buffer = []
export function record(
  storage,
  field,
  oldValue,
  newValue,
  userId = 'anon',
  timestamp = new Date().toISOString()
) {
  buffer.push({ ts: timestamp, userId, field, oldValue, newValue })
}

export function flush(storage) {
  if (buffer.length === 0) return
  const log = readAuditLog(storage)
  const combined = log.concat(buffer)
  buffer = []
  try {
    storage.set('profile-audit', JSON.stringify(combined))
  } catch (err) {
    console.error('Failed to flush audit log', err)
  }
}
