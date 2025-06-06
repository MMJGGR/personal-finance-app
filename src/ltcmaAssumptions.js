// src/ltcmaAssumptions.js
// Long Term Capital Market Assumptions
// Example expected return and volatility inputs for various asset classes.

/**
 * Expected return and volatility values used to pre-fill asset class inputs.
 * Values are expressed in percent (e.g. 7 for 7% expected return).
 */
const LTCMA = {
  'US Equity': { expectedReturn: 7, volatility: 15 },
  'Global Equity': { expectedReturn: 6.5, volatility: 14 },
  'Emerging Markets': { expectedReturn: 8, volatility: 20 },
  'US Bonds': { expectedReturn: 3, volatility: 5 },
  'Global Bonds': { expectedReturn: 3.5, volatility: 6 },
  'Real Estate': { expectedReturn: 6, volatility: 12 },
  'Commodities': { expectedReturn: 4, volatility: 18 },
  Cash: { expectedReturn: 2, volatility: 1 },
}

export default LTCMA
