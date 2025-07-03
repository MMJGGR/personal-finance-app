export function readVersions(storage) {
  try {
    const raw = storage.get('profile-versions');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addVersion(storage, profile) {
  const versions = readVersions(storage);
  versions.push({ ts: new Date().toISOString(), profile });
  try {
    storage.set('profile-versions', JSON.stringify(versions));
  } catch (err) {
    console.error('Failed to write version history', err);
  }
}

export function clearVersions(storage) {
  try {
    storage.remove('profile-versions');
  } catch {}
}
