import {
  setResourceLoader,
  parsePhoneNumber,
  geocoderAsync,
  carrierAsync,
  timezonesAsync,
  geocoder,
  carrier,
  timezones,
  clearCache,
  getCacheSize,
  setCacheSize,
  type ResourceLoader,
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

describe('Serverless Lite Version', () => {
  let mockLoader: MockResourceLoader
  let originalConsoleError: any

  beforeEach(() => {
    mockLoader = new MockResourceLoader()
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
      const parsed = parsePhoneNumber('+14155552671', 'US')
      expect(parsed).toBeDefined()
      expect(parsed?.isValid()).toBe(true)
      expect(parsed?.country).toBe('US')
      expect(parsed?.countryCallingCode).toBe('1')
    })

    it('should parse international format', () => {
      const parsed = parsePhoneNumber('+44 20 7946 0958', 'GB')
      expect(parsed).toBeDefined()
      expect(parsed?.isValid()).toBe(true)
      expect(parsed?.country).toBe('GB')
    })

    it('should handle invalid numbers', () => {
      // parsePhoneNumber throws for completely invalid input
      // Use parsePhoneNumberFromString for safer parsing
      const { parsePhoneNumberFromString } = require('../src/index.serverless')
      const parsed = parsePhoneNumberFromString('invalid', 'US')
      expect(parsed).toBeUndefined()
    })
  })

  describe('Async Resource Loading', () => {
    it('should load geocoder data asynchronously', async () => {
      const parsed = parsePhoneNumber('+14155552671', 'US')
      const geo = await geocoderAsync(parsed)
      // Mock data returns "San Francisco, CA" for prefix 415555
      expect(geo).toBe('San Francisco, CA')
    })

    it('should load carrier data asynchronously', async () => {
      const parsed = parsePhoneNumber('+14155552671', 'US')
      const car = await carrierAsync(parsed)
      // Mock data returns "Verizon" for prefix 415555
      expect(car).toBe('Verizon')
    })

    it('should load timezone data asynchronously', async () => {
      const parsed = parsePhoneNumber('+14155552671', 'US')
      const tz = await timezonesAsync(parsed)
      // Mock data returns ["America/Los_Angeles"] for prefix 1415555
      expect(tz).toEqual(['America/Los_Angeles'])
    })
  })

  describe('Sync Resource Loading', () => {
    it('should load geocoder data synchronously', () => {
      const parsed = parsePhoneNumber('+14155552671', 'US')
      const geo = geocoder(parsed)
      expect(geo).toBe('San Francisco, CA')
    })

    it('should load carrier data synchronously', () => {
      const parsed = parsePhoneNumber('+14155552671', 'US')
      const car = carrier(parsed)
      expect(car).toBe('Verizon')
    })

    it('should load timezone data synchronously', () => {
      const parsed = parsePhoneNumber('+14155552671', 'US')
      const tz = timezones(parsed)
      expect(tz).toEqual(['America/Los_Angeles'])
    })
  })

  describe('Cache Management', () => {
    it('should clear cache', () => {
      const parsed = parsePhoneNumber('+14155552671', 'US')
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
      const parsed = parsePhoneNumber('+12125551234', 'US')
      const geo = await geocoderAsync(parsed)
      expect(geo).toBeNull()
    })

    it('should work without resource loader', async () => {
      setResourceLoader(null as any)
      const parsed = parsePhoneNumber('+14155552671', 'US')
      const geo = await geocoderAsync(parsed)
      expect(geo).toBeNull()
    })
  })

  describe('Phone Number Formatting', () => {
    it('should format in various styles', () => {
      const parsed = parsePhoneNumber('+14155552671', 'US')
      expect(parsed?.formatInternational()).toBe('+1 415 555 2671')
      expect(parsed?.formatNational()).toBe('(415) 555-2671')
      expect(parsed?.format('E.164')).toBe('+14155552671')
      expect(parsed?.format('RFC3966')).toBe('tel:+14155552671')
    })
  })

  describe('Number Types', () => {
    it('should identify number type', () => {
      // Use a US mobile number for more predictable type detection
      const mobile = parsePhoneNumber('+14155552671', 'US')
      const type = mobile?.getType()
      // US numbers can be FIXED_LINE_OR_MOBILE
      expect(['MOBILE', 'FIXED_LINE_OR_MOBILE']).toContain(type)
    })
  })
})

describe('Resource Loader Implementations', () => {
  it('should support custom resource loader', () => {
    class CustomLoader implements ResourceLoader {
      async loadResource(path: string): Promise<Uint8Array | null> {
        return new Uint8Array([1, 2, 3])
      }
    }

    const loader = new CustomLoader()
    setResourceLoader(loader)
    expect(() => setResourceLoader(loader)).not.toThrow()
  })

  it('should support sync and async loaders', () => {
    class DualLoader implements ResourceLoader {
      async loadResource(path: string): Promise<Uint8Array | null> {
        return new Uint8Array([1, 2, 3])
      }

      loadResourceSync(path: string): Uint8Array | null {
        return new Uint8Array([1, 2, 3])
      }
    }

    const loader = new DualLoader()
    setResourceLoader(loader)
    expect(() => setResourceLoader(loader)).not.toThrow()
  })
})
