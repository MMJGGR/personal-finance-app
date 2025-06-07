import { formatCurrency } from '../utils/formatters'

test('rounds values to two decimals', () => {
  expect(formatCurrency(1234.567, 'en-US', 'USD')).toBe('$1,234.57')
  expect(formatCurrency(-987.654, 'en-US', 'USD')).toBe('-$987.65')
})

test('formats millions with suffix', () => {
  expect(formatCurrency(1234567, 'en-US', 'USD')).toBe('1.23 M')
  expect(formatCurrency(-9876543, 'en-US', 'USD')).toBe('-9.88 M')
})
