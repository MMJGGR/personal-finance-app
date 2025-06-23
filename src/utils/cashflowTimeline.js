import { getStreamEndYear } from "./incomeProjection";
import { generateRecurringFlows, frequencyToPayments } from "./financeUtils";
export function generateIncomeTimeline(sources, assumptions, assetsList = [], years) {
  const currentYear = new Date().getFullYear();
  const timeline = Array.from({ length: years }, (_, i) => ({
    year: currentYear + i,
    gross: 0,
    net: 0,
    expenses: assumptions.annualExpenses || 0,
  }));

  sources.forEach(s => {
    if (!s.active) return;
    const linkedAsset = assetsList.find(a => a.id === s.linkedAssetId);
    const start = Math.max(currentYear, s.startYear ?? currentYear);
    const end = Math.min(
      getStreamEndYear(s, assumptions, linkedAsset),
      currentYear + years - 1
    );
    if (end < start) return;

    const flows = generateRecurringFlows({
      amount: Number(s.amount) || 0,
      paymentsPerYear:
        typeof s.paymentsPerYear === 'number'
          ? s.paymentsPerYear
          : typeof s.frequency === 'number'
            ? s.frequency
            : frequencyToPayments(s.frequency),
      growth: Number(s.growth) || 0,
      startYear: start,
      endYear: end,
    });

    flows.forEach(f => {
      const idx = f.year - currentYear;
      timeline[idx].gross += f.amount;
      timeline[idx].net += f.amount * (1 - (s.taxRate || 0) / 100);
    });
  });

  return timeline;
}

export function buildCashflowTimeline(
  minYear,
  maxYear,
  incomeFn,
  expensesList,
  goalsList,
  getLoansForYear = () => 0,
  inflationRate = 0
) {
  const timeline = [];
  let prevSurplus = 0;

  for (let y = minYear; y <= maxYear; y++) {
    const income = typeof incomeFn === 'function' ? incomeFn(y) : 0;
    let expenses = 0;
    let goals = 0;
    const loans = getLoansForYear(y);

    expensesList.forEach(e => {
      if (y >= e.startYear && y <= e.endYear) {
        const t = y - e.startYear;
        const freq =
          typeof e.paymentsPerYear === 'number'
            ? e.paymentsPerYear
            : frequencyToPayments(e.frequency) || 1;
        const growth = Number(e.growth ?? inflationRate) || 0;
        expenses += (Number(e.amount) || 0) * freq * Math.pow(1 + growth / 100, t);
      }
    });

    goalsList.forEach(g => {
      const year = g.targetYear ?? g.endYear ?? g.startYear;
      if (year === y) {
        goals += Number(g.amount) || 0;
      }
    });

    const net = income - expenses - goals - loans;
    const surplus = prevSurplus + net;
    timeline.push({ year: y, income, expenses, goals, loans, debtService: loans, net, surplus });
    prevSurplus = surplus;
  }

  return timeline;
}

export default { generateIncomeTimeline, buildCashflowTimeline };
