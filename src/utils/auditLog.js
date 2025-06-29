export function readAuditLog(storage) {
  try {
    const raw = storage.get('auditLog')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function appendAuditLog(storage, entry = {}, userId = 'anonymous') {
  const log = readAuditLog(storage)
  log.push({ ts: new Date().toISOString(), userId, ...entry })
  try {
    storage.set('auditLog', JSON.stringify(log))
  } catch (err) {
    console.error('Failed to write audit log', err)
  }
}
