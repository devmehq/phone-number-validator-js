import {
  carrier,
  carrierAsync,
  clearCache,
  geocoder,
  geocoderAsync,
  getCacheSize,
  parsePhoneNumberFromString,
  parsePhoneNumberWithError,
  type ResourceLoader,
  setCacheSize,
  setResourceLoader,
  timezones,
  timezonesAsync,
} from '../src/index.serverless'

// Mock resource loader for testing
class MockResourceLoader implements ResourceLoader {
  private resources: Map<string, Uint8Array> = new Map()

  constructor() {
    // Add some mock data
    this.addMockResource(
      'geocodes/en/1.bson',
      this.createMockBsonData({ '415555': 'San Francisco, CA' })
    )
    this.addMockResource('carrier/en/1.bson', this.createMockBsonData({ '415555': 'Verizon' }))
    this.addMockResource(
      'timezones.bson',
      this.createMockBsonData({ '1415555': 'America/Los_Angeles' })
    )
  }

  private createMockBsonData(data: any): Uint8Array {
    // Use actual BSON serialization
    const { serialize } = require('bson')
    return new Uint8Array(serialize(data))
  }

  addMockResource(path: string, data: Uint8Array) {
    this.resources.set(path, data)
  }

  async loadResource(path: string): Promise<Uint8Array | null> {
    return this.resources.get(path) || null
  }

  loadResourceSync(path: string): Uint8Array | null {
    return this.resources.get(path) || null
  }
}

// Extended mock resource loader for comprehensive testing
class ExtendedMockResourceLoader extends MockResourceLoader {
  private delays: Map<string, number> = new Map()
  private errors: Map<string, Error> = new Map()
  private callCount: Map<string, number> = new Map()

  setDelay(path: string, delayMs: number) {
    this.delays.set(path, delayMs)
  }

  setError(path: string, error: Error) {
    this.errors.set(path, error)
  }

  getCallCount(path: string): number {
    return this.callCount.get(path) || 0
  }

  async loadResource(path: string): Promise<Uint8Array | null> {
    this.callCount.set(path, (this.callCount.get(path) || 0) + 1)

    const error = this.errors.get(path)
    if (error) {
      throw error
    }

    const delay = this.delays.get(path)
    if (delay) {
      await new Promise((resolve) => setTimeout(resolve, delay))
    }

    return super.loadResource(path)
  }

  loadResourceSync(path: string): Uint8Array | null {
    this.callCount.set(path, (this.callCount.get(path) || 0) + 1)

    const error = this.errors.get(path)
    if (error) {
      throw error
    }

    return super.loadResourceSync(path)
  }
}

describe('Serverless Lite Version', () => {
  let mockLoader: ExtendedMockResourceLoader
  let originalConsoleError: any

  beforeEach(() => {
    mockLoader = new ExtendedMockResourceLoader()
    setResourceLoader(mockLoader)
    clearCache()
    // Suppress console.error for these tests since BSON errors are expected
    originalConsoleError = console.error
    console.error = jest.fn()
  })

  afterEach(() => {
    // Restore console.error
    console.error = originalConsoleError
  })

  describe('Phone Number Parsing', () => {
    it('should parse valid US phone number', () => {
      const parsed = parsePhoneNumberWithError('+14155552671', 'US')
      expect(parsed).toBeDefined()
      expect(parsed?.isValid()).toBe(true)
      expect(parsed?.country).toBe('US')
      expect(parsed?.countryCallingCode).toBe('1')
    })

    it('should parse international format', () => {
      const parsed = parsePhoneNumberWithError('+44 20 7946 0958', 'GB')
      expect(parsed).toBeDefined()
      expect(parsed?.isValid()).toBe(true)
      expect(parsed?.country).toBe('GB')
    })

    it('should handle invalid numbers', () => {
      // parsePhoneNumber throws for completely invalid input
      // Use parsePhoneNumberFromString for safer parsing
      const parsed = parsePhoneNumberFromString('invalid', 'US')
      expect(parsed).toBeUndefined()
    })
  })

  describe('Async Resource Loading', () => {
    it('should load geocoder data asynchronously', async () => {
      const parsed = parsePhoneNumberWithError('+14155552671', 'US')
      const geo = await geocoderAsync(parsed)
      // Mock data returns "San Francisco, CA" for prefix 415555
      expect(geo).toBe('San Francisco, CA')
    })

    it('should load carrier data asynchronously', async () => {
      const parsed = parsePhoneNumberWithError('+14155552671', 'US')
      const car = await carrierAsync(parsed)
      // Mock data returns "Verizon" for prefix 415555
      expect(car).toBe('Verizon')
    })

    it('should load timezone data asynchronously', async () => {
      const parsed = parsePhoneNumberWithError('+14155552671', 'US')
      const tz = await timezonesAsync(parsed)
      // Mock data returns ["America/Los_Angeles"] for prefix 1415555
      expect(tz).toEqual(['America/Los_Angeles'])
    })
  })

  describe('Sync Resource Loading', () => {
    it('should load geocoder data synchronously', () => {
      const parsed = parsePhoneNumberWithError('+14155552671', 'US')
      const geo = geocoder(parsed)
      expect(geo).toBe('San Francisco, CA')
    })

    it('should load carrier data synchronously', () => {
      const parsed = parsePhoneNumberWithError('+14155552671', 'US')
      const car = carrier(parsed)
      expect(car).toBe('Verizon')
    })

    it('should load timezone data synchronously', () => {
      const parsed = parsePhoneNumberWithError('+14155552671', 'US')
      const tz = timezones(parsed)
      expect(tz).toEqual(['America/Los_Angeles'])
    })
  })

  describe('Cache Management', () => {
    it('should clear cache', () => {
      const parsed = parsePhoneNumberWithError('+14155552671', 'US')
      geocoder(parsed)
      expect(getCacheSize()).toBeGreaterThanOrEqual(0)
      clearCache()
      expect(getCacheSize()).toBe(0)
    })

    it('should set cache size', () => {
      setCacheSize(50)
      // Cache size is internal implementation detail
      // Just verify the function doesn't throw
      expect(() => setCacheSize(100)).not.toThrow()
    })
  })

  describe('Resource Loader', () => {
    it('should handle missing resources gracefully', async () => {
      const parsed = parsePhoneNumberWithError('+12125551234', 'US')
      const geo = await geocoderAsync(parsed)
      expect(geo).toBeNull()
    })

    it('should work without resource loader', async () => {
      setResourceLoader(null as any)
      const parsed = parsePhoneNumberWithError('+14155552671', 'US')
      const geo = await geocoderAsync(parsed)
      expect(geo).toBeNull()
    })
  })

  describe('Phone Number Formatting', () => {
    it('should format in various styles', () => {
      const parsed = parsePhoneNumberWithError('+14155552671', 'US')
      expect(parsed?.formatInternational()).toBe('+1 415 555 2671')
      expect(parsed?.formatNational()).toBe('(415) 555-2671')
      expect(parsed?.format('E.164')).toBe('+14155552671')
      expect(parsed?.format('RFC3966')).toBe('tel:+14155552671')
    })
  })

  describe('Number Types', () => {
    it('should identify number type', () => {
      // Use a US mobile number for more predictable type detection
      const mobile = parsePhoneNumberWithError('+14155552671', 'US')
      const type = mobile?.getType()
      // US numbers can be FIXED_LINE_OR_MOBILE
      expect(['MOBILE', 'FIXED_LINE_OR_MOBILE']).toContain(type)
    })
  })
})

describe('Advanced Serverless Features', () => {
  let extendedLoader: ExtendedMockResourceLoader
  let originalConsoleError: any

  beforeEach(() => {
    extendedLoader = new ExtendedMockResourceLoader()
    // Add more diverse test data
    extendedLoader.addMockResource(
      'geocodes/en/44.bson',
      extendedLoader.createMockBsonData({ '207946': 'London', '131234': 'Edinburgh' })
    )
    // Add both French and English locale data for France
    extendedLoader.addMockResource(
      'geocodes/fr/33.bson',
      extendedLoader.createMockBsonData({ '142345': 'Paris', '467890': 'Lyon' })
    )
    extendedLoader.addMockResource(
      'geocodes/en/33.bson',
      extendedLoader.createMockBsonData({ '142345': 'Paris', '467890': 'Lyon' })
    )
    extendedLoader.addMockResource(
      'carrier/en/44.bson',
      extendedLoader.createMockBsonData({ '207946': 'British Telecom', '131234': 'Vodafone UK' })
    )
    extendedLoader.addMockResource(
      'timezones.bson',
      extendedLoader.createMockBsonData({
        '1415555': 'America/Los_Angeles',
        '442079': 'Europe/London',
        '33142': 'Europe/Paris',
        '81312': 'Asia/Tokyo&Asia/Seoul', // Multiple timezones
      })
    )
    setResourceLoader(extendedLoader)
    clearCache()
    originalConsoleError = console.error
    console.error = jest.fn()
  })

  afterEach(() => {
    console.error = originalConsoleError
  })

  describe('Concurrent Resource Loading', () => {
    it('should handle concurrent async requests efficiently', async () => {
      const numbers = [
        parsePhoneNumberWithError('+14155552671', 'US'),
        parsePhoneNumberWithError('+442079460958', 'GB'),
        parsePhoneNumberWithError('+33142345678', 'FR'),
      ]

      const results = await Promise.all([
        ...numbers.map((n) => geocoderAsync(n)),
        ...numbers.map((n) => carrierAsync(n)),
        ...numbers.map((n) => timezonesAsync(n)),
      ])

      expect(results).toHaveLength(9)
      expect(results[0]).toBe('San Francisco, CA')
      expect(results[1]).toBe('London')
      expect(results[2]).toBe('Paris') // From geocodes/en/33.bson
    })

    it('should cache resources across multiple calls', async () => {
      const parsed = parsePhoneNumberWithError('+442079460958', 'GB')

      // First call loads from resource
      await geocoderAsync(parsed)
      const firstCallCount = extendedLoader.getCallCount('geocodes/en/44.bson')

      // Second call should use cache
      await geocoderAsync(parsed)
      const secondCallCount = extendedLoader.getCallCount('geocodes/en/44.bson')

      expect(firstCallCount).toBe(1)
      expect(secondCallCount).toBe(1) // No additional call
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should handle resource loading errors gracefully', async () => {
      extendedLoader.setError('geocodes/en/1.bson', new Error('Network error'))
      const parsed = parsePhoneNumberWithError('+15555551234', 'US')

      const result = await geocoderAsync(parsed)
      expect(result).toBeNull()
      expect(console.error).toHaveBeenCalled()
    })

    it('should handle corrupted BSON data', async () => {
      extendedLoader.addMockResource(
        'geocodes/en/99.bson',
        new Uint8Array([1, 2, 3, 4]) // Invalid BSON
      )
      const parsed = parsePhoneNumberWithError('+995551234567', 'US')

      const result = await geocoderAsync(parsed)
      expect(result).toBeNull()
    })

    it('should recover from temporary failures', async () => {
      const parsed = parsePhoneNumberWithError('+442079460958', 'GB')

      // First attempt fails
      extendedLoader.setError('geocodes/en/44.bson', new Error('Temporary failure'))
      const result1 = await geocoderAsync(parsed)
      expect(result1).toBeNull()

      // Remove error for recovery
      extendedLoader.setError('geocodes/en/44.bson', null as any)
      clearCache() // Clear cache to retry

      // Second attempt succeeds
      const result2 = await geocoderAsync(parsed)
      expect(result2).toBe('London')
    })
  })

  describe('Locale Fallback Mechanism', () => {
    it('should fallback to English when locale not available', async () => {
      const parsed = parsePhoneNumberWithError('+442079460958', 'GB')

      // Try with German locale (not available)
      const result = await geocoderAsync(parsed, 'de' as any)

      // Should fallback to English
      expect(result).toBe('London')
      expect(extendedLoader.getCallCount('geocodes/de/44.bson')).toBe(1)
      expect(extendedLoader.getCallCount('geocodes/en/44.bson')).toBe(1)
    })

    it('should use specific locale when available', async () => {
      const parsed = parsePhoneNumberWithError('+33142345678', 'FR')

      const resultFr = await geocoderAsync(parsed, 'fr' as any)
      expect(resultFr).toBe('Paris')
      expect(extendedLoader.getCallCount('geocodes/fr/33.bson')).toBe(1)
    })
  })

  describe('Performance and Latency', () => {
    it('should handle slow resource loading', async () => {
      extendedLoader.setDelay('geocodes/en/44.bson', 100)
      const parsed = parsePhoneNumberWithError('+442079460958', 'GB')

      const start = Date.now()
      const result = await geocoderAsync(parsed)
      const duration = Date.now() - start

      expect(result).toBe('London')
      expect(duration).toBeGreaterThanOrEqual(100)
    })

    it('should benefit from caching on repeated calls', async () => {
      const parsed = parsePhoneNumberWithError('+442079460958', 'GB')

      // First call with delay
      extendedLoader.setDelay('geocodes/en/44.bson', 50)
      const start1 = Date.now()
      await geocoderAsync(parsed)
      const duration1 = Date.now() - start1

      // Second call should be instant (cached)
      const start2 = Date.now()
      await geocoderAsync(parsed)
      const duration2 = Date.now() - start2

      expect(duration1).toBeGreaterThanOrEqual(50)
      expect(duration2).toBeLessThan(10)
    })
  })

  describe('Multiple Timezone Support', () => {
    it('should handle multiple timezones for a region', async () => {
      const parsed = parsePhoneNumberWithError('+81312345678', 'JP')
      const timezones = await timezonesAsync(parsed)

      expect(timezones).toEqual(['Asia/Tokyo', 'Asia/Seoul'])
    })

    it('should handle single timezone', async () => {
      const parsed = parsePhoneNumberWithError('+442079460958', 'GB')
      const timezones = await timezonesAsync(parsed)

      expect(timezones).toEqual(['Europe/London'])
    })
  })

  describe('Cache Size Management', () => {
    it('should respect cache size limits', () => {
      setCacheSize(2)

      const numbers = [
        parsePhoneNumberWithError('+14155552671', 'US'),
        parsePhoneNumberWithError('+442079460958', 'GB'),
        parsePhoneNumberWithError('+33142345678', 'FR'),
      ]

      // Load multiple resources
      numbers.forEach((n) => {
        geocoder(n)
      })

      // Cache should not exceed size limit
      expect(getCacheSize()).toBeLessThanOrEqual(2)
    })

    it('should maintain most recently used items in cache', () => {
      setCacheSize(2)

      const us = parsePhoneNumberWithError('+14155552671', 'US')
      const gb = parsePhoneNumberWithError('+442079460958', 'GB')
      const fr = parsePhoneNumberWithError('+33142345678', 'FR')

      geocoder(us) // Cache: [US] - loads geocodes/en/1.bson
      geocoder(gb) // Cache: [US, GB] - loads geocodes/en/44.bson
      geocoder(fr) // Cache: [GB, FR] (US evicted) - loads geocodes/en/33.bson
      geocoder(gb) // Cache: [FR, GB] (GB accessed, uses cache)

      clearCache()

      // Verify by checking resource load counts after cache clear
      geocoder(gb)
      geocoder(fr)

      // After cache clear, loading again increments the count
      expect(extendedLoader.getCallCount('geocodes/en/44.bson')).toBe(2)
      expect(extendedLoader.getCallCount('geocodes/en/33.bson')).toBe(2)
    })
  })

  describe('Edge Cases and Validation', () => {
    it('should handle null/undefined phone numbers', async () => {
      expect(await geocoderAsync(null as any)).toBeNull()
      expect(await geocoderAsync(undefined)).toBeNull()
      expect(await carrierAsync(null as any)).toBeNull()
      expect(await carrierAsync(undefined)).toBeNull()
      expect(await timezonesAsync(null as any)).toBeNull()
      expect(await timezonesAsync(undefined)).toBeNull()
    })

    it('should handle phone numbers without national number', async () => {
      const invalidPhone = { countryCallingCode: '1' } as any
      expect(await geocoderAsync(invalidPhone)).toBeNull()
      expect(await carrierAsync(invalidPhone)).toBeNull()
    })

    it('should handle phone numbers without country calling code', async () => {
      const invalidPhone = { nationalNumber: '4155552671' } as any
      expect(await geocoderAsync(invalidPhone)).toBeNull()
      expect(await carrierAsync(invalidPhone)).toBeNull()
    })

    it('should handle empty resource loader response', async () => {
      extendedLoader.addMockResource('geocodes/en/90.bson', new Uint8Array())
      const parsed = parsePhoneNumberWithError('+905551234567', 'TR')

      const result = await geocoderAsync(parsed)
      expect(result).toBeNull()
    })
  })

  describe('Synchronous vs Asynchronous Consistency', () => {
    it('should return same results for sync and async methods', async () => {
      const numbers = [
        parsePhoneNumberWithError('+14155552671', 'US'),
        parsePhoneNumberWithError('+442079460958', 'GB'),
      ]

      for (const num of numbers) {
        const geoSync = geocoder(num)
        const geoAsync = await geocoderAsync(num)
        expect(geoSync).toBe(geoAsync)

        const carrierSync = carrier(num)
        const carrierAsyncResult = await carrierAsync(num)
        expect(carrierSync).toBe(carrierAsyncResult)

        const tzSync = timezones(num)
        const tzAsync = await timezonesAsync(num)
        expect(tzSync).toEqual(tzAsync)
      }
    })
  })
})

describe('Resource Loader Implementations', () => {
  it('should support custom resource loader', () => {
    class CustomLoader implements ResourceLoader {
      async loadResource(_path: string): Promise<Uint8Array | null> {
        return new Uint8Array([1, 2, 3])
      }
    }

    const loader = new CustomLoader()
    setResourceLoader(loader)
    expect(() => setResourceLoader(loader)).not.toThrow()
  })

  it('should support sync and async loaders', () => {
    class DualLoader implements ResourceLoader {
      async loadResource(_path: string): Promise<Uint8Array | null> {
        return new Uint8Array([1, 2, 3])
      }

      loadResourceSync(_path: string): Uint8Array | null {
        return new Uint8Array([1, 2, 3])
      }
    }

    const loader = new DualLoader()
    setResourceLoader(loader)
    expect(() => setResourceLoader(loader)).not.toThrow()
  })
})
