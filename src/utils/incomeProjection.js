export function getStreamEndYear(stream, assumptions = {}, linkedAsset) {
  if (stream.endYear != null) return stream.endYear
  if (linkedAsset?.saleYear) return linkedAsset.saleYear
  if (linkedAsset?.maturityYear) return linkedAsset.maturityYear
  switch (stream.type) {
    case 'Salary':
      return assumptions.retirementAge
    case 'Rental':
      return assumptions.deathAge
    case 'Bond':
      return linkedAsset?.maturityYear || assumptions.deathAge
    case 'Dividend':
      return assumptions.deathAge
    default:
      return assumptions.retirementAge
  }
}

export function projectIncomeStream(
  stream,
  assumptions = {},
  linkedAsset,
  currentYear = new Date().getFullYear()
) {
  const start = Math.max(currentYear, stream.startYear ?? currentYear)
  const end = getStreamEndYear(stream, assumptions, linkedAsset)

  const projection = []
  for (let y = start; y <= end; y++) {
    const t = y - start
    const grown =
      stream.amount * stream.frequency * Math.pow(1 + (stream.growth || 0) / 100, t)
    projection.push({ year: y, amount: grown })
  }

  return projection
}

export const getIncomeProjection = projectIncomeStream
