import { getStreamEndYear } from "./incomeProjection";
import { generateRecurringFlows, frequencyToPayments, calculateNSSF } from "./financeUtils";
import { calculatePAYE } from "./taxEngine";
export function generateIncomeTimeline(
  sources,
  assumptions,
  assetsList = [],
  years,
  startYear = new Date().getFullYear(),
  privatePensionContributions = []
) {
  const birthYear = assumptions.birthYear ?? new Date().getFullYear();
  const timeline = Array.from({ length: years }, (_, i) => ({
    year: startYear + i,
    gross: 0,
    net: 0,
    expenses: assumptions.annualExpenses || 0,
  }));

  sources.forEach(s => {
    if (!s.active) return;
    const linkedAsset = assetsList.find(a => a.id === s.linkedAssetId);
    let start = s.startYear;
    if (start == null && s.startAge != null) {
      start = birthYear + s.startAge;
    }
    start = Math.max(startYear, start ?? startYear);
    const end = Math.min(
      getStreamEndYear(s, assumptions, linkedAsset),
      startYear + years - 1
    );
    if (end < start) return;

    if (Array.isArray(s.vestSchedule) && s.vestSchedule.length) {
      s.vestSchedule.forEach(v => {
        if (!v) return;
        const y = v.year ?? start;
        if (y < startYear || y > startYear + years - 1) return;
        const shares = (s.totalGrant || 0) * ((v.pct || 0) / 100);
        const value = shares * (s.fairValuePerShare || 0);
        const idx = y - startYear;
        timeline[idx].gross += value;
        timeline[idx].net += s.taxed === false ? value : value * (1 - (s.taxRate || 0) / 100);
      });
      return;
    }

    if (s.type === 'Kenyan Salary') {
      for (let yr = start; yr <= end; yr++) {
        const idx = yr - startYear;
        const growthFactor = Math.pow(1 + (Number(s.growth) || 0) / 100, yr - start);
        const monthlyGross = (Number(s.grossSalary) || 0) * growthFactor;
        const { employeeContribution } = calculateNSSF(monthlyGross);
        const privateMonthly = privatePensionContributions.reduce(
          (sum, p) => sum + p.amount / (p.frequency / 12),
          0
        );
        const monthlyPAYE = calculatePAYE(
          monthlyGross - employeeContribution,
          employeeContribution + privateMonthly
        );
        const annualGross = monthlyGross * 12;
        const annualNet = (monthlyGross - employeeContribution - monthlyPAYE) * 12;
        timeline[idx].gross += annualGross;
        timeline[idx].net += annualNet;
      }
      return;
    }

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
      const idx = f.year - startYear;
      timeline[idx].gross += f.amount;
      timeline[idx].net += s.taxed === false ? f.amount : f.amount * (1 - (s.taxRate || 0) / 100);
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
      if (e.include === false) return;
      const end = e.endYear ?? maxYear;
      if (y >= e.startYear && y <= end) {
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
