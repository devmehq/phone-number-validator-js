export * from 'libphonenumber-js'
import type { PhoneNumber } from 'libphonenumber-js'
import type { CarrierLocale, GeocoderLocale } from './locales'
import { readFileSync } from 'node:fs'
import { deserialize, type Document } from 'bson'
import { join } from 'node:path'
import { lru, type LRU } from 'tiny-lru'

const DEFAULT_CACHE_SIZE = 100
let codeDataCache: LRU<Document> = lru<Document>(DEFAULT_CACHE_SIZE)

/**
 * Maps the dataPath and prefix to geocode, carrier, timezones or null if this info could not be extracted
 *
 * **Note:** Timezones are returned as single string joined with `&`
 *
 * @param dataPath Path of the metadata bson file to use
 * @param nationalNumber The national (significant) number without whitespaces e.g. `2133734253`
 */
function getCode(dataPath: string, nationalNumber: string): string | null {
  if (!dataPath || !nationalNumber) {
    return null
  }

  try {
    // Use tiny-lru cache
    let data = codeDataCache.get(dataPath)

    if (!data) {
      const bData = readFileSync(dataPath)
      data = deserialize(bData)
      codeDataCache.set(dataPath, data)
    }

    let prefix = nationalNumber
    // Find the longest match
    while (prefix.length > 0) {
      const description = data[prefix]
      if (description) {
        return description as string
      }
      // Remove a character from the end
      prefix = prefix.substring(0, prefix.length - 1)
    }
  } catch (err) {
    // Log error in development mode
    if (process.env.NODE_ENV !== 'production') {
      console.error(`Error loading data from ${dataPath}:`, err)
    }
  }
  return null
}

/**
 * Helper function to get localized data with fallback
 */
function getLocalizedData(
  resourceType: 'geocodes' | 'carrier',
  phonenumber: PhoneNumber | undefined,
  locale: string,
  fallbackLocale: string = 'en'
): string | null {
  if (!phonenumber) {
    return null
  }

  const nationalNumber = phonenumber.nationalNumber?.toString()
  const countryCallingCode = phonenumber.countryCallingCode?.toString()

  if (!nationalNumber || !countryCallingCode) {
    return null
  }

  // Try with requested locale
  let dataPath = join(
    __dirname,
    '../resources/',
    resourceType,
    locale,
    `${countryCallingCode}.bson`
  )

  const code = getCode(dataPath, nationalNumber)
  if (code) {
    return code
  }

  // Fallback to default locale if different
  if (locale !== fallbackLocale) {
    dataPath = join(
      __dirname,
      '../resources/',
      resourceType,
      fallbackLocale,
      `${countryCallingCode}.bson`
    )
    return getCode(dataPath, nationalNumber)
  }

  return null
}

/**
 * Provides geographical information related to the phone number
 *
 * @param phonenumber The phone number
 * @param locale The preferred locale to use (falls back to `en` if there are no localized carrier infos for the given locale)
 */
export function geocoder(
  phonenumber: PhoneNumber | undefined,
  locale: GeocoderLocale = 'en'
): string | null {
  return getLocalizedData('geocodes', phonenumber, locale, 'en')
}

/**
 * Maps the phone number to the original carrier
 *
 * **Note:** This method cannot provide data about the current carrier of the phone number,
 * only the original carrier who is assigned to the corresponding range.
 * @see https://github.com/google/libphonenumber#mapping-phone-numbers-to-original-carriers
 *
 * @param phonenumber The phone number
 * @param locale The preferred locale to use (falls back to `en` if there are no localized carrier infos for the given locale)
 */
export function carrier(
  phonenumber: PhoneNumber | undefined,
  locale: CarrierLocale = 'en'
): string | null {
  return getLocalizedData('carrier', phonenumber, locale, 'en')
}

/**
 * Provides all timezones related to the phone number
 * @param phonenumber The phone number
 */
export function timezones(phonenumber: PhoneNumber | undefined): string[] | null {
  if (!phonenumber || !phonenumber.number) {
    return null
  }

  let nr = phonenumber.number.toString()
  if (!nr) {
    return null
  }

  nr = nr.replace(/^\+/, '')
  const dataPath = join(__dirname, '../resources/timezones.bson')
  const zones = getCode(dataPath, nr)

  if (typeof zones === 'string' && zones.length > 0) {
    return zones.split('&').filter((zone) => zone.length > 0)
  }

  return null
}

/**
 * Clear the internal cache
 * Useful for memory management in long-running processes
 */
export function clearCache(): void {
  codeDataCache.clear()
}

/**
 * Get current cache size
 */
export function getCacheSize(): number {
  return codeDataCache.size
}

/**
 * Set cache max size
 * @param size New maximum cache size
 */
export function setCacheSize(size: number): void {
  // Create a new cache with the new size and transfer existing data
  const oldCache = codeDataCache
  codeDataCache = lru<Document>(size)

  // Transfer entries from old cache to new cache (most recent first)
  const entries = oldCache.entries()
  entries.reverse() // Start with most recent
  for (const [key, value] of entries) {
    if (codeDataCache.size < size) {
      codeDataCache.set(key, value)
    } else {
      break
    }
  }
}
