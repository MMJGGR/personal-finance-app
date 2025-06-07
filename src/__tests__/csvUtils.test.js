import { buildCSV } from '../utils/csvUtils'

test('buildCSV escapes commas and quotes', () => {
  const csv = buildCSV(
    ['Col,1', 'Col"2"'],
    [
      ['Value,1', 'He said "ok"']
    ]
  )
  expect(csv).toBe(
    '"Col,1","Col""2"""\n"Value,1","He said ""ok"""'
  )
})

