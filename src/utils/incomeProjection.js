export function getIncomeProjection(stream, assumptions = {}, linkedAsset) {
  const now = new Date().getFullYear()
  const start = Math.max(now, stream.startYear ?? now)

  let end
  if (stream.endYear != null) {
    end = stream.endYear
  } else if (linkedAsset) {
    if (linkedAsset.saleYear) {
      end = linkedAsset.saleYear
    } else if (linkedAsset.maturityYear) {
      end = linkedAsset.maturityYear
    } else if (stream.type === 'Rental') {
      end = assumptions.deathAge
    } else if (stream.type === 'Salary') {
      end = assumptions.retirementAge
    } else {
      end = assumptions.deathAge
    }
  } else {
    end = stream.type === 'Salary'
      ? assumptions.retirementAge
      : assumptions.deathAge
  }

  const projection = []
  for (let y = start; y <= end; y++) {
    const t = y - start
    const grown = stream.amount * stream.frequency * Math.pow(1 + (stream.growth || 0) / 100, t)
    projection.push({ year: y, amount: grown })
  }
  return projection
}
