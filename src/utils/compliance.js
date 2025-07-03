export function stripPII(profile = {}) {
  if (!profile || typeof profile !== 'object') return {};
  // Destructure known PII fields and discard them
  const {
    email,
    phone,
    residentialAddress,
    address,
    city,
    country,
    taxCountry,
    taxResidence,
    taxJurisdiction,
    taxId,
    idNumber,
    ...rest
  } = profile;
  return rest;
}
