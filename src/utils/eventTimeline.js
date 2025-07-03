export function readEvents(storage) {
  try {
    const raw = storage.get('timeline');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveEvents(storage, events) {
  try {
    storage.set('timeline', JSON.stringify(events));
  } catch (err) {
    console.error('Failed to save timeline', err);
  }
}

export function addEvent(storage, event) {
  const events = readEvents(storage);
  events.push(event);
  saveEvents(storage, events);
  return events;
}

export function updateEvent(storage, id, updates) {
  const events = readEvents(storage).map(e =>
    e.id === id ? { ...e, ...updates } : e
  );
  saveEvents(storage, events);
  return events;
}

export function removeEvent(storage, id) {
  const events = readEvents(storage).filter(e => e.id !== id);
  saveEvents(storage, events);
  return events;
}

export function clearEvents(storage) {
  try {
    storage.remove('timeline');
  } catch {}
}
