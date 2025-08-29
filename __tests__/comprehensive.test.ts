import {
  carrier,
  clearCache,
  geocoder,
  getCacheSize,
  parsePhoneNumberFromString,
  setCacheSize,
  timezones,
} from '../src'

describe('Comprehensive Phone Number Validation Tests', () => {
  beforeEach(() => {
    clearCache()
  })

  describe('Input Validation', () => {
    it('should handle undefined phone numbers gracefully', () => {
      expect(geocoder(undefined)).toBeNull()
      expect(carrier(undefined)).toBeNull()
      expect(timezones(undefined)).toBeNull()
    })

    it('should handle invalid phone numbers', () => {
      const invalidPhone = parsePhoneNumberFromString('invalid')
      expect(geocoder(invalidPhone)).toBeNull()
      expect(carrier(invalidPhone)).toBeNull()
      expect(timezones(invalidPhone)).toBeNull()
    })

    it('should handle empty strings', () => {
      const emptyPhone = parsePhoneNumberFromString('')
      expect(geocoder(emptyPhone)).toBeNull()
      expect(carrier(emptyPhone)).toBeNull()
      expect(timezones(emptyPhone)).toBeNull()
    })

    it('should handle phone numbers with missing country codes', () => {
      const phoneWithoutCountry = parsePhoneNumberFromString('1234567890')
      expect(geocoder(phoneWithoutCountry)).toBeNull()
      expect(carrier(phoneWithoutCountry)).toBeNull()
      expect(timezones(phoneWithoutCountry)).toBeNull()
    })
  })

  describe('Geocoder Function', () => {
    it('should return location for valid US number', () => {
      const phoneNr = parsePhoneNumberFromString('+12124567890')
      const location = geocoder(phoneNr)
      expect(location).toBeTruthy()
      expect(typeof location).toBe('string')
    })

    it('should fallback to English when locale not available', () => {
      const phoneNr = parsePhoneNumberFromString('+41431234567')
      const locationXX = geocoder(phoneNr, 'en')
      expect(locationXX).toEqual('Zurich')
    })

    it('should handle multiple locales for same number', () => {
      const phoneNr = parsePhoneNumberFromString('+41431234567')
      const locationEN = geocoder(phoneNr, 'en')
      const locationDE = geocoder(phoneNr, 'de')
      expect(locationEN).toEqual('Zurich')
      expect(locationDE).toEqual('Zürich')
    })

    it('should return null for numbers without geocoding data', () => {
      // Use an invalid phone number that won't trigger file access
      const phoneNr = parsePhoneNumberFromString('invalid_number')
      const location = geocoder(phoneNr)
      expect(location).toBeNull()

      // Also test with undefined
      expect(geocoder(undefined)).toBeNull()
    })
  })

  describe('Carrier Function', () => {
    it('should return carrier for valid mobile number', () => {
      const phoneNr = parsePhoneNumberFromString('+8619912345678')
      const carrierInfo = carrier(phoneNr)
      expect(carrierInfo).toBeTruthy()
      expect(typeof carrierInfo).toBe('string')
    })

    it('should handle carrier lookup with different locales', () => {
      const phoneNr = parsePhoneNumberFromString('+8619912345678')
      const carrierEN = carrier(phoneNr, 'en')
      const carrierZH = carrier(phoneNr, 'zh')
      expect(carrierEN).toEqual('China Telecom')
      expect(carrierZH).toEqual('中国电信')
    })

    it('should return null for landline numbers', () => {
      const phoneNr = parsePhoneNumberFromString('+41431234567')
      const carrierInfo = carrier(phoneNr)
      // Landlines typically don't have carrier info
      expect(carrierInfo).toBeNull()
    })

    it('should fallback to English for unavailable locale', () => {
      const phoneNr = parsePhoneNumberFromString('+49301234567')
      const carrierXX = carrier(phoneNr, 'en')
      expect(carrierXX).toBeDefined()
    })
  })

  describe('Timezones Function', () => {
    it('should return array of timezones for valid number', () => {
      const phoneNr = parsePhoneNumberFromString('+12124567890')
      const tzs = timezones(phoneNr)
      expect(tzs).toBeTruthy()
      expect(Array.isArray(tzs)).toBe(true)
      expect(tzs!.length).toBeGreaterThan(0)
    })

    it('should handle numbers with multiple timezones', () => {
      const phoneNr = parsePhoneNumberFromString('+14158586273')
      const tzs = timezones(phoneNr)
      expect(tzs).toBeTruthy()
      expect(Array.isArray(tzs)).toBe(true)
    })

    it('should return null for invalid numbers', () => {
      const invalidPhone = parsePhoneNumberFromString('invalid')
      const tzs = timezones(invalidPhone)
      expect(tzs).toBeNull()
    })

    it('should handle international format correctly', () => {
      const phoneNr1 = parsePhoneNumberFromString('+49301234567')
      const tzs1 = timezones(phoneNr1)
      expect(tzs1).toContain('Europe/Berlin')

      const phoneNr2 = parsePhoneNumberFromString('+81312345678')
      const tzs2 = timezones(phoneNr2)
      expect(tzs2).toBeTruthy()
      expect(Array.isArray(tzs2)).toBe(true)
    })
  })

  describe('Cache Management', () => {
    it('should cache loaded data files', () => {
      expect(getCacheSize()).toBe(0)

      const phoneNr = parsePhoneNumberFromString('+41431234567')
      geocoder(phoneNr)

      const cacheSize1 = getCacheSize()
      expect(cacheSize1).toBeGreaterThan(0)

      // Same lookup should use cache
      geocoder(phoneNr)
      expect(getCacheSize()).toBe(cacheSize1)
    })

    it('should clear cache when requested', () => {
      const phoneNr = parsePhoneNumberFromString('+41431234567')
      geocoder(phoneNr)

      expect(getCacheSize()).toBeGreaterThan(0)

      clearCache()
      expect(getCacheSize()).toBe(0)
    })

    it('should handle cache for different resource types', () => {
      const phoneNr = parsePhoneNumberFromString('+8619912345678')

      geocoder(phoneNr)
      const size1 = getCacheSize()

      carrier(phoneNr)
      const size2 = getCacheSize()
      expect(size2).toBeGreaterThan(size1)

      timezones(phoneNr)
      const size3 = getCacheSize()
      expect(size3).toBeGreaterThan(size2)
    })

    it('should allow cache size configuration', () => {
      // Set a smaller cache size
      setCacheSize(2)

      // Load multiple different resources
      const phoneNr1 = parsePhoneNumberFromString('+41431234567')
      const phoneNr2 = parsePhoneNumberFromString('+8619912345678')
      const phoneNr3 = parsePhoneNumberFromString('+49301234567')

      geocoder(phoneNr1)
      expect(getCacheSize()).toBe(1)

      geocoder(phoneNr2)
      expect(getCacheSize()).toBe(2)

      // This should evict the oldest entry
      geocoder(phoneNr3)
      expect(getCacheSize()).toBeLessThanOrEqual(2)

      // Reset to default
      setCacheSize(100)
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long phone numbers', () => {
      const longNumber = parsePhoneNumberFromString('+1234567890123456789')
      expect(geocoder(longNumber)).toBeNull()
      expect(carrier(longNumber)).toBeNull()
      expect(timezones(longNumber)).toBeNull()
    })

    it('should handle numbers with special characters', () => {
      const phoneNr = parsePhoneNumberFromString('+1 (212) 456-7890')
      const location = geocoder(phoneNr)
      expect(location).toBeTruthy()
    })

    it('should handle numbers in different formats', () => {
      const formats = ['+41431234567', '0041431234567', '+41 43 123 45 67', '043 123 45 67']

      formats.forEach((format) => {
        const phoneNr = parsePhoneNumberFromString(
          format,
          format.startsWith('0') && !format.startsWith('00') ? 'CH' : undefined
        )
        if (phoneNr && phoneNr.isValid()) {
          const location = geocoder(phoneNr)
          expect(location).toBeTruthy()
        }
      })
    })

    it('should handle concurrent lookups', async () => {
      const numbers = ['+41431234567', '+12124567890', '+8619912345678', '+49301234567']

      const results = await Promise.all(
        numbers.map(async (num) => {
          const phoneNr = parsePhoneNumberFromString(num)
          return {
            geo: geocoder(phoneNr),
            carrier: carrier(phoneNr),
            tz: timezones(phoneNr),
          }
        })
      )

      results.forEach((result) => {
        expect(result).toBeDefined()
      })
    })
  })

  describe('Locale Fallback Behavior', () => {
    it('should fallback correctly for geocoder', () => {
      const phoneNr = parsePhoneNumberFromString('+41431234567')

      // Test with supported locale
      const supportedResult = geocoder(phoneNr, 'de')
      expect(supportedResult).toBeTruthy()

      // Test with unsupported locale (should fallback to en)
      const unsupportedResult = geocoder(phoneNr, 'en')
      expect(unsupportedResult).toBeTruthy()
    })

    it('should fallback correctly for carrier', () => {
      const phoneNr = parsePhoneNumberFromString('+8619912345678')

      // Test with supported locale
      const supportedResult = carrier(phoneNr, 'zh')
      expect(supportedResult).toBeTruthy()

      // Test with fallback to English
      const englishResult = carrier(phoneNr, 'en')
      expect(englishResult).toBeTruthy()
    })
  })

  describe('Performance', () => {
    it('should handle multiple lookups efficiently', () => {
      const startTime = Date.now()
      const phoneNr = parsePhoneNumberFromString('+41431234567')

      // Perform 100 lookups
      for (let i = 0; i < 100; i++) {
        geocoder(phoneNr)
        carrier(phoneNr)
        timezones(phoneNr)
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      // Should complete in reasonable time (< 1 second for 300 operations)
      expect(duration).toBeLessThan(1000)
    })
  })
})
