export function formatCurrency(value, locale = 'en-US', currency = 'USD') {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) {
    const formatted = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value / 1_000_000)
    return `${formatted} M`
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2
  }).format(value)
}
