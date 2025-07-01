export const riskScoreMap = {
  knowledge: { None: 1, Basic: 2, Moderate: 3, Advanced: 4 },
  response: { Sell: 1, Wait: 3, BuyMore: 5 },
  horizon: { '<3 years': 1, '3–7 years': 3, '>7 years': 5 },
  goal: { Preservation: 1, Income: 3, Growth: 5 },
  riskCapacity: {
    'Very Low': 1,
    'Low': 2,
    'Medium': 3,
    'High': 4,
    'Very High': 5,
  },
  riskWillingness: {
    'Very Low': 1,
    'Low': 2,
    'Medium': 3,
    'High': 4,
    'Very High': 5,
  },
}