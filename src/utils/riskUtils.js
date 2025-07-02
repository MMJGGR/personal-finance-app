import { riskWeights, riskThresholds } from '../config/riskConfig.js';
import {
  employmentStatusScores,
  investmentKnowledgeScores,
  lossResponseScores,
  investmentHorizonScores,
  investmentGoalScores,
} from '../config/riskScoreConfig.js';
import { riskSurveyQuestions } from '../config/riskSurvey.js';

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
  return Math.max(0, Math.min(age, 100));
}

function normalizeIncome(annualIncome) {
  const n = Number(annualIncome) || 0;
  return Math.max(0, Math.min((n / 1_000_000) * 100, 100));
}

function normalizeNetWorth(netWorth) {
  const n = Number(netWorth) || 0;
  return Math.max(0, Math.min((n / 5_000_000) * 100, 100));
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
  const n = Number(years) || 0;
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
  const n = Number(needs) || 0;
  return Math.max(0, Math.min((n / 12) * 100, 100));
}

export function computeSurveyScore(responses = []) {
  if (!Array.isArray(responses)) return 0;
  return riskSurveyQuestions.reduce((sum, q, idx) => {
    const val = Number(responses[idx]) || 0;
    const score = q.reverse ? 6 - val : val;
    return sum + score;
  }, 0);
}

function normalizeSurveyScore(rawScore) {
  const n = Number(rawScore) || 0;
  return Math.max(0, Math.min(((n - 10) / 40) * 100, 100));
}

export function calculateRiskScore(profile = {}) {
  if (!profile.employmentStatus) return 0;
  const age = Number(extractAge(profile));
  const annualIncome = Number(profile.annualIncome);
  const netWorth = Number(extractNetWorth(profile));
  const yearsInvesting = Number(profile.yearsInvesting);
  const emergencyFundMonths = Number(profile.emergencyFundMonths);
  const surveyScore = Number(profile.surveyScore);
  const knowledge = normalizeKnowledge(profile.investmentKnowledge);
  const loss = normalizeLossResponse(profile.lossResponse);
  const horizon = normalizeHorizon(profile.investmentHorizon);
  const goal = normalizeGoal(profile.investmentGoal);

  if ([age, annualIncome, netWorth, yearsInvesting, emergencyFundMonths, surveyScore].some(v => Number.isNaN(v))) {
    return 0;
  }

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
