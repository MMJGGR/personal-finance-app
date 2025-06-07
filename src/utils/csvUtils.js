export function quoteCSV(value) {
  return `"${String(value).replace(/"/g, '""')}"`
}

export function buildCSV(columns = [], rows = []) {
  const header = columns.map(quoteCSV).join(',')
  const data = rows.map(row => row.map(quoteCSV).join(','))
  return [header, ...data].join('\n')
}

