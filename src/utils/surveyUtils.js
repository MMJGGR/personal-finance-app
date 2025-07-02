export function computeSurveyScore(answers = []) {
  const raw = answers.reduce((sum, v) => sum + Number(v || 0), 0);
  const Q = answers.length;
  const min = Q * 1;
  const max = Q * 5;
  return Math.max(0, Math.min(((raw - min) / (max - min)) * 100, 100));
}
