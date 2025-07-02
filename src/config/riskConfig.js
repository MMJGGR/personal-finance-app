export const riskWeights = {
  age: 0.10,
  annualIncome: 0.15,
  netWorth: 0.15,
  investingExperience: 0.10,
  employmentStatus: 0.05,
  liquidityNeeds: 0.05,
  riskToleranceSurvey: 0.10,
  investmentKnowledge: 0.10,
  lossResponse: 0.05,
  investmentHorizon: 0.10,
  investmentGoal: 0.05,
};

export const riskThresholds = {
  conservative: { max: 30 },
  balanced: { min: 31, max: 70 },
  growth: { min: 71 },
};
