// src/utils/strategyUtils.js
// Utility to derive investment strategy based on risk score and horizon.

import { riskThresholds } from '../config/riskConfig'

export function deriveStrategy(riskScore = 0, horizon = '') {
  let base
  if (riskScore <= riskThresholds.conservative.max) base = 'Conservative'
  else if (riskScore <= riskThresholds.balanced.max) base = 'Balanced'
  else base = 'Growth'

  if (horizon === '<3 years') return 'Conservative'
  if (horizon === '>7 years') return 'Growth'
  return base
}

export default deriveStrategy
