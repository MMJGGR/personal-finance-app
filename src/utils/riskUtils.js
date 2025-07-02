import { riskWeights, riskThresholds } from '../config/riskConfig';

function calculateAge(birthDate) {
  if (!birthDate) return 0;
  const dob = new Date(birthDate);
  const diff = Date.now() - dob.getTime();
  const ageDt = new Date(diff);
  return Math.abs(ageDt.getUTCFullYear() - 1970);
}

function extractAge(profile) {
  if (typeof profile.age === 'number' && !Number.isNaN(profile.age)) {
    return profile.age;
  }
  return calculateAge(profile.birthDate);
}

function normalizeAgeValue(age) {
  return Math.max(0, Math.min((age / 100) * 100, 100));
}

function normalizeIncome(annualIncome) {
  return Math.max(0, Math.min((annualIncome / 1_000_000) * 100, 100));
}

function normalizeNetWorth(netWorth) {
  return Math.max(0, Math.min((netWorth / 5_000_000) * 100, 100));
}

function extractNetWorth(profile) {
  if (typeof profile.netWorth === 'number' && !Number.isNaN(profile.netWorth)) {
    return profile.netWorth;
  }
  if (
    typeof profile.liquidNetWorth === 'number' &&
    !Number.isNaN(profile.liquidNetWorth)
  ) {
    return profile.liquidNetWorth;
  }
  return 0;
}

function normalizeExperience(years) {
  return Math.max(0, Math.min((years / 30) * 100, 100));
}

function normalizeEmployment(status) {
  const mapping = { Retired: 0, Student: 20, 'Self-Employed': 50, Employed: 100 };
  return mapping[status] ?? 50;
}

function normalizeLiquidity(needs) {
  return Math.max(0, Math.min((needs / 12) * 100, 100));
}

function normalizeSurveyScore(rawScore) {
  return Math.max(0, Math.min(((rawScore - 10) / 40) * 100, 100));
}

export function calculateRiskScore(profile = {}) {
  const age = extractAge(profile);
  const netWorth = extractNetWorth(profile);
  const scores = {
    age: normalizeAgeValue(age) * riskWeights.age,
    annualIncome: normalizeIncome(profile.annualIncome) * riskWeights.annualIncome,
    netWorth: normalizeNetWorth(netWorth) * riskWeights.netWorth,
    investingExperience: normalizeExperience(profile.yearsInvesting) * riskWeights.investingExperience,
    employmentStatus: normalizeEmployment(profile.employmentStatus) * riskWeights.employmentStatus,
    liquidityNeeds: normalizeLiquidity(profile.emergencyFundMonths) * riskWeights.liquidityNeeds,
    riskToleranceSurvey: normalizeSurveyScore(profile.surveyScore) * riskWeights.riskToleranceSurvey,
  };
  const total = Object.values(scores).reduce((sum, val) => sum + val, 0);
  return Math.round(Math.max(0, Math.min(total, 100)));
}

export function deriveCategory(score) {
  if (score <= riskThresholds.conservative.max) return 'conservative';
  if (score <= riskThresholds.balanced.max) return 'balanced';
  return 'growth';
}
