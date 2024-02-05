import { carrier } from '../src'
import parsePhoneNumber from 'libphonenumber-js'

describe('Phone Number Lookup', () => {
  it('should return carrier', async () => {
    const phoneNumber = parsePhoneNumber('+14158586273')
    const res = carrier(phoneNumber)
    expect(res).toEqual(null)
  })
})
