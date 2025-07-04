export function calculateAge(birthDateStr) {
  const birth = new Date(birthDateStr);
  const diffMs = Date.now() - birth.getTime();
  const ageDt = new Date(diffMs);
  return Math.abs(ageDt.getUTCFullYear() - 1970);
}

export function extractAge(profile = {}) {
  if (typeof profile.age === 'number' && !Number.isNaN(profile.age)) {
    return profile.age;
  }
  return calculateAge(profile.birthDate);
}

export function extractNetWorth(profile = {}) {
  if (typeof profile.netWorth === 'number') {
    return profile.netWorth;
  }
  const assets = Number(profile.totalAssets) || 0;
  const liabs = Number(profile.totalLiabilities) || 0;
  return assets - liabs;
}

export function yearToAge(year, profile = {}) {
  if (typeof year !== 'number' || Number.isNaN(year)) return null;
  const profAge = extractAge(profile);
  if (typeof profAge !== 'number' || Number.isNaN(profAge)) return null;
  const birthYear = new Date().getFullYear() - profAge;
  return year - birthYear;
}
