export const riskWeights = {
  age: 0.15,
  annualIncome: 0.20,
  netWorth: 0.20,
  investingExperience: 0.15,
  employmentStatus: 0.10,
  liquidityNeeds: 0.10,
  riskToleranceSurvey: 0.10,
};

export const riskThresholds = {
  conservative: { max: 30 },
  balanced: { min: 31, max: 70 },
  growth: { min: 71 },
};
