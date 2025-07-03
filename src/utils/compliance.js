export function stripPII(profile = {}) {
  if (!profile || typeof profile !== 'object') return {};
  // Destructure known PII fields and discard them
  const {
    email: _email,
    phone: _phone,
    residentialAddress: _residentialAddress,
    address: _address,
    city: _city,
    country: _country,
    taxCountry: _taxCountry,
    taxResidence: _taxResidence,
    taxJurisdiction: _taxJurisdiction,
    taxId: _taxId,
    idNumber: _idNumber,
    ...rest
  } = profile;
  return rest;
}
