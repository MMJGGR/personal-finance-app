import { stripPII } from '../utils/compliance'
import { submitProfile } from '../utils/exportHelpers'

beforeEach(() => {
  global.fetch = jest.fn(() => Promise.resolve({ ok: true }))
})

afterEach(() => {
  jest.resetAllMocks()
})

test('stripPII removes personal identifiers', () => {
  const profile = {
    name: 'Jane',
    email: 'jane@test.com',
    phone: '123',
    residentialAddress: '1 Street',
    idNumber: 'AB123',
    city: 'Nairobi'
  }
  const result = stripPII(profile)
  expect(result.email).toBeUndefined()
  expect(result.phone).toBeUndefined()
  expect(result.residentialAddress).toBeUndefined()
  expect(result.idNumber).toBeUndefined()
  expect(result.city).toBeUndefined()
  expect(result.name).toBe('Jane')
})

test('submitProfile posts sanitized payload', async () => {
  const payload = { profile: { name: 'Jane', email: 'jane@test.com' } }
  const settings = { apiEndpoint: 'https://example.com' }
  await submitProfile(payload, settings)
  expect(fetch).toHaveBeenCalledTimes(1)
  const [, options] = fetch.mock.calls[0]
  expect(options.method).toBe('POST')
  const body = JSON.parse(options.body)
  expect(body.profile.email).toBeUndefined()
  expect(body.profile.name).toBe('Jane')
})
