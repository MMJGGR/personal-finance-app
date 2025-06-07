// src/utils/strategyUtils.js
// Utility to derive investment strategy based on risk score and horizon.

export function deriveStrategy(riskScore = 0, horizon = '') {
  let base
  if (riskScore <= 6) base = 'Conservative'
  else if (riskScore <= 12) base = 'Balanced'
  else base = 'Growth'

  if (horizon === '<3 years') return 'Conservative'
  if (horizon === '>7 years') return 'Growth'
  return base
}

export default deriveStrategy
