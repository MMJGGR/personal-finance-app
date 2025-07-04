import { riskWeights, riskThresholds } from '../config/riskConfig.js';
import {
  employmentStatusScores,
  investmentKnowledgeScores,
  lossResponseScores,
  investmentHorizonScores,
  investmentGoalScores,
} from '../config/riskScoreConfig.js';
import { extractAge, extractNetWorth } from './ageUtils.js';
import { computeSurveyScore } from './surveyUtils.js';
export { computeSurveyScore } from "./surveyUtils.js";

function normalizeAgeValue(age) {
  return Math.max(0, Math.min(age, 100));
}

function parseNumber(val) {
  const n = Number(String(val).replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function normalizeIncome(annualIncome) {
  const n = parseNumber(annualIncome);
  return Math.max(0, Math.min((n / 1_000_000) * 100, 100));
}

function normalizeNetWorth(netWorth) {
  const n = parseNumber(netWorth);
  return Math.max(0, Math.min((n / 5_000_000) * 100, 100));
}

function normalizeExperience(years) {
  const n = parseNumber(years);
  return Math.max(0, Math.min((n / 30) * 100, 100));
}

function normalizeEmployment(status) {
  return employmentStatusScores[status] ?? 50;
}

function normalizeKnowledge(level) {
  return investmentKnowledgeScores[level] ?? 50;
}

function normalizeLossResponse(response) {
  return lossResponseScores[response] ?? 50;
}

function normalizeHorizon(horizon) {
  return investmentHorizonScores[horizon] ?? 50;
}

function normalizeGoal(goal) {
  return investmentGoalScores[goal] ?? 50;
}


function normalizeLiquidity(needs) {
  const n = parseNumber(needs);
  return Math.max(0, Math.min((n / 12) * 100, 100));
}

function normalizeSurveyScore(rawScore) {
  const n = Number(rawScore) || 0;
  return Math.max(0, Math.min(n, 100));
}

export function calculateRiskScore(profile = {}) {
  if (!profile.employmentStatus) return 0;
  const age = parseNumber(extractAge(profile));
  const annualIncome = parseNumber(profile.annualIncome);
  const netWorth = parseNumber(extractNetWorth(profile));
  const yearsInvesting = parseNumber(profile.yearsInvesting);
  const emergencyFundMonths = parseNumber(profile.emergencyFundMonths);
  const surveyAnswers = Array.isArray(profile.riskSurveyAnswers)
    ? profile.riskSurveyAnswers.filter(v => v !== undefined)
    : [];
  const surveyScore = computeSurveyScore(surveyAnswers);
  const knowledge = normalizeKnowledge(profile.investmentKnowledge);
  const loss = normalizeLossResponse(profile.lossResponse);
  const horizon = normalizeHorizon(profile.investmentHorizon);
  const goal = normalizeGoal(profile.investmentGoal);

  const scores = {
    age: normalizeAgeValue(age) * riskWeights.age,
    annualIncome: normalizeIncome(annualIncome) * riskWeights.annualIncome,
    netWorth: normalizeNetWorth(netWorth) * riskWeights.netWorth,
    investingExperience: normalizeExperience(yearsInvesting) * riskWeights.investingExperience,
    employmentStatus: normalizeEmployment(profile.employmentStatus) * riskWeights.employmentStatus,
    liquidityNeeds: normalizeLiquidity(emergencyFundMonths) * riskWeights.liquidityNeeds,
    riskToleranceSurvey: normalizeSurveyScore(surveyScore) * riskWeights.riskToleranceSurvey,
    investmentKnowledge: knowledge * riskWeights.investmentKnowledge,
    lossResponse: loss * riskWeights.lossResponse,
    investmentHorizon: horizon * riskWeights.investmentHorizon,
    investmentGoal: goal * riskWeights.investmentGoal,
  };
  const total = Object.values(scores).reduce((sum, val) => sum + val, 0);
  return Math.round(Math.max(0, Math.min(total, 100)));
}

export function deriveCategory(score) {
  if (score <= riskThresholds.conservative.max) return 'conservative';
  if (score <= riskThresholds.balanced.max) return 'balanced';
  return 'growth';
}
