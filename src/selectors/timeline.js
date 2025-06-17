export default function buildTimeline(minYear, maxYear, incomeFn, expensesList, goalsList, getLoansForYear = () => 0) {
  const timeline = []
  for (let y = minYear; y <= maxYear; y++) {
    const income = typeof incomeFn === 'function' ? incomeFn(y) : 0
    let expenses = 0
    let goals = 0
    let loans = getLoansForYear(y)

    expensesList.forEach(e => {
      if (y >= e.startYear && y <= e.endYear) {
        const t = y - e.startYear
        const freq = e.paymentsPerYear || e.frequency || 1
        const growth = e.growth || 0
        expenses += (Number(e.amount) || 0) * freq * Math.pow(1 + growth / 100, t)
      }
    })

    goalsList.forEach(g => {
      if (y >= g.startYear && y <= g.endYear) {
        goals += Number(g.amount) || 0
      }
    })

    const net = income - expenses - goals - loans
    timeline.push({ year: y, income, expenses, goals, loans, net })
  }
  return timeline
}
