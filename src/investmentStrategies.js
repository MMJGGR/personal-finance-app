// src/investmentStrategies.js
// Example portfolio mixes by risk profile.

export const InvestmentStrategies = {
  Conservative: {
    'US Equity': 20,
    'Global Equity': 15,
    'Emerging Markets': 5,
    'US Bonds': 45,
    'Global Bonds': 10,
    Cash: 5
  },
  Balanced: {
    'US Equity': 35,
    'Global Equity': 20,
    'Emerging Markets': 10,
    'US Bonds': 25,
    'Global Bonds': 5,
    Cash: 5
  },
  Growth: {
    'US Equity': 50,
    'Global Equity': 25,
    'Emerging Markets': 15,
    'US Bonds': 5,
    'Global Bonds': 5,
    Cash: 0
  }
}

/**
 * Retrieve portfolio weights for a given strategy name.
 *
 * @param {string} name - Strategy key (Conservative/Balanced/Growth).
 * @returns {Object|null} Allocation weights or null if unknown.
 */
export function getStrategyWeights(name) {
  return InvestmentStrategies[name] || null
}

export default InvestmentStrategies
