export * from 'libphonenumber-js'

import { type Document, deserialize } from 'bson'
import type { PhoneNumber } from 'libphonenumber-js'
import { type LRU, lru } from 'tiny-lru'
import type { CarrierLocale, GeocoderLocale } from './locales'

const DEFAULT_CACHE_SIZE = 100
let codeDataCache = lru<Document>(DEFAULT_CACHE_SIZE)

// Resource loader interface - platforms must implement this
export interface ResourceLoader {
  loadResource(path: string): Promise<Uint8Array | null>

  loadResourceSync?(path: string): Uint8Array | null
}

let resourceLoader: ResourceLoader | null = null

export function setResourceLoader(loader: ResourceLoader) {
  resourceLoader = loader
}

async function getCodeAsync(dataPath: string, nationalNumber: string) {
  if (!dataPath || !nationalNumber || !resourceLoader) {
    return null
  }

  try {
    let data = codeDataCache.get(dataPath)

    if (!data) {
      const bData = await resourceLoader.loadResource(dataPath)
      if (!bData) {
        return null
      }
      data = deserialize(Buffer.from(bData))
      codeDataCache.set(dataPath, data)
    }

    let prefix = nationalNumber
    while (prefix.length > 0) {
      const description = data[prefix]
      if (description) {
        return description as string
      }
      prefix = prefix.substring(0, prefix.length - 1)
    }
  } catch (err) {
    console.error(`Error loading data from ${dataPath}:`, err)
  }
  return null
}

function getCodeSync(dataPath: string, nationalNumber: string) {
  if (!dataPath || !nationalNumber || !resourceLoader || !resourceLoader.loadResourceSync) {
    return null
  }

  try {
    let data = codeDataCache.get(dataPath)

    if (!data) {
      const bData = resourceLoader.loadResourceSync(dataPath)
      if (!bData) {
        return null
      }
      data = deserialize(Buffer.from(bData))
      codeDataCache.set(dataPath, data)
    }

    let prefix = nationalNumber
    while (prefix.length > 0) {
      const description = data[prefix]
      if (description) {
        return description as string
      }
      prefix = prefix.substring(0, prefix.length - 1)
    }
  } catch (err) {
    console.error(`Error loading data from ${dataPath}:`, err)
  }
  return null
}

async function getLocalizedDataAsync(
  resourceType: 'geocodes' | 'carrier',
  phonenumber: PhoneNumber | undefined,
  locale: string,
  fallbackLocale = 'en'
) {
  if (!phonenumber) {
    return null
  }

  const nationalNumber = phonenumber.nationalNumber?.toString()
  const countryCallingCode = phonenumber.countryCallingCode?.toString()

  if (!nationalNumber || !countryCallingCode) {
    return null
  }

  let dataPath = `${resourceType}/${locale}/${countryCallingCode}.bson`

  const code = await getCodeAsync(dataPath, nationalNumber)
  if (code) {
    return code
  }

  if (locale !== fallbackLocale) {
    dataPath = `${resourceType}/${fallbackLocale}/${countryCallingCode}.bson`
    return getCodeAsync(dataPath, nationalNumber)
  }

  return null
}

function getLocalizedDataSync(
  resourceType: 'geocodes' | 'carrier',
  phonenumber: PhoneNumber | undefined,
  locale: string,
  fallbackLocale = 'en'
) {
  if (!phonenumber) {
    return null
  }

  const nationalNumber = phonenumber.nationalNumber?.toString()
  const countryCallingCode = phonenumber.countryCallingCode?.toString()

  if (!nationalNumber || !countryCallingCode) {
    return null
  }

  let dataPath = `${resourceType}/${locale}/${countryCallingCode}.bson`

  const code = getCodeSync(dataPath, nationalNumber)
  if (code) {
    return code
  }

  if (locale !== fallbackLocale) {
    dataPath = `${resourceType}/${fallbackLocale}/${countryCallingCode}.bson`
    return getCodeSync(dataPath, nationalNumber)
  }

  return null
}

// Async versions
export async function geocoderAsync(
  phonenumber: PhoneNumber | undefined,
  locale: GeocoderLocale = 'en'
) {
  return getLocalizedDataAsync('geocodes', phonenumber, locale, 'en')
}

export async function carrierAsync(
  phonenumber: PhoneNumber | undefined,
  locale: CarrierLocale = 'en'
) {
  return getLocalizedDataAsync('carrier', phonenumber, locale, 'en')
}

export async function timezonesAsync(phonenumber: PhoneNumber | undefined) {
  if (!phonenumber || !phonenumber.number) {
    return null
  }

  let nr = phonenumber.number.toString()
  if (!nr) {
    return null
  }

  nr = nr.replace(/^\+/, '')
  const dataPath = 'timezones.bson'
  const zones = await getCodeAsync(dataPath, nr)

  if (typeof zones === 'string' && zones.length > 0) {
    return zones.split('&').filter((zone) => zone.length > 0)
  }

  return null
}

// Sync versions (requires sync resource loader)
export function geocoder(phonenumber: PhoneNumber | undefined, locale: GeocoderLocale = 'en') {
  return getLocalizedDataSync('geocodes', phonenumber, locale, 'en')
}

export function carrier(phonenumber: PhoneNumber | undefined, locale: CarrierLocale = 'en') {
  return getLocalizedDataSync('carrier', phonenumber, locale, 'en')
}

export function timezones(phonenumber: PhoneNumber | undefined) {
  if (!phonenumber || !phonenumber.number) {
    return null
  }

  let nr = phonenumber.number.toString()
  if (!nr) {
    return null
  }

  nr = nr.replace(/^\+/, '')
  const dataPath = 'timezones.bson'
  const zones = getCodeSync(dataPath, nr)

  if (typeof zones === 'string' && zones.length > 0) {
    return zones.split('&').filter((zone) => zone.length > 0)
  }

  return null
}

export function clearCache() {
  codeDataCache.clear()
}

export function getCacheSize() {
  return codeDataCache.size
}

export function setCacheSize(size: number) {
  const oldCache = codeDataCache
  codeDataCache = lru<Document>(size)

  const entries = oldCache.entries()
  entries.reverse()
  for (const [key, value] of entries) {
    if (codeDataCache.size < size) {
      codeDataCache.set(key, value)
    } else {
      break
    }
  }
}
