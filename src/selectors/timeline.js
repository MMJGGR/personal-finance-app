import { frequencyToPayments } from '../utils/financeUtils'

export default function buildTimeline(
  minYear,
  maxYear,
  incomeFn,
  expensesList,
  goalsList,
  getLoansForYear = () => 0
) {
  const timeline = []
  let prevSurplus = 0

  for (let y = minYear; y <= maxYear; y++) {
    const income = typeof incomeFn === 'function' ? incomeFn(y) : 0
    let expenses = 0
    let goals = 0
    const loans = getLoansForYear(y)

    expensesList.forEach(e => {
      if (y >= e.startYear && y <= e.endYear) {
        const t = y - e.startYear
        const freq =
          typeof e.paymentsPerYear === 'number'
            ? e.paymentsPerYear
            : frequencyToPayments(e.frequency) || 1
        const growth = e.growth || 0
        expenses += (Number(e.amount) || 0) * freq * Math.pow(1 + growth / 100, t)
      }
    })

    goalsList.forEach(g => {
      const year = g.targetYear ?? g.endYear ?? g.startYear
      if (year === y) {
        goals += Number(g.amount) || 0
      }
    })

    const net = income - expenses - goals - loans
    const surplus = prevSurplus + net
    timeline.push({ year: y, income, expenses, goals, loans, debtService: loans, net, surplus })
    prevSurplus = surplus
  }

  return timeline
}
