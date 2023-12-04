export * from 'libphonenumber-js'
import { PhoneNumber } from 'libphonenumber-js'
import { CarrierLocale, GeocoderLocale } from './locales'
import { readFileSync } from 'fs'
import { deserialize, Document } from 'bson'
import { join } from 'path'

const codeData: Record<string, Document> = {}

/**
 * Maps the dataPath and prefix to geocode, carrier, timezones or null if this info could not be extracted
 *
 * **Note:** Timezones are returned as single string joined with `&`
 *
 * @param dataPath Path of the metadata bson file to use
 * @param nationalNumber The national (significant) number without whitespaces e.g. `2133734253`
 */
function getCode(dataPath: string, nationalNumber: string) {
  try {
    if (!codeData[dataPath]) {
      const bData = readFileSync(dataPath)
      codeData[dataPath] = deserialize(bData)
    }
    const data = codeData[dataPath]
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
    // console.log('Could not parse bson', err)
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
) {
  const nationalNumber = phonenumber?.nationalNumber.toString()
  const countryCallingCode = phonenumber?.countryCallingCode.toString()
  if (!nationalNumber || !countryCallingCode) {
    return null
  }
  let dataPath = join(
    __dirname,
    '../resources/geocodes/',
    locale,
    `${countryCallingCode}.bson`
  )
  // const code = await getCode(dataPath, prefix)
  const code = getCode(dataPath, nationalNumber)
  if (code) {
    return code
  }
  if (locale !== 'en') {
    // Try fallback to english
    dataPath = join(
      __dirname,
      '../resources/geocodes/',
      'en',
      `${countryCallingCode}.bson`
    )
    // return await getCode(dataPath, prefix)
    return getCode(dataPath, nationalNumber)
  }
  return null
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
) {
  if (!phonenumber) {
    return null
  }
  const nationalNumber = phonenumber?.nationalNumber.toString()
  const countryCallingCode = phonenumber?.countryCallingCode.toString()
  if (!nationalNumber || !countryCallingCode) {
    return null
  }
  let dataPath = join(
    __dirname,
    '../resources/carrier/',
    locale,
    `${countryCallingCode}.bson`
  )
  // const code = await getCode(dataPath, prefix)
  const code = getCode(dataPath, nationalNumber)
  if (code) {
    return code
  }
  if (locale !== 'en') {
    // Try fallback to english
    dataPath = join(
      __dirname,
      '../resources/carrier/',
      'en',
      `${countryCallingCode}.bson`
    )
    // return await getCode(dataPath, prefix)
    return getCode(dataPath, nationalNumber)
  }
  return null
}

/**
 * Provides all timezones related to the phone number
 * @param phonenumber The phone number
 */
export function timezones(phonenumber: PhoneNumber | undefined) {
  let nr = phonenumber?.number.toString()
  if (!nr) {
    return null
  }
  nr = nr.replace(/^\+/, '')
  let dataPath = join(__dirname, '../resources/timezones.bson')
  const zones = getCode(dataPath, nr)
  if (typeof zones === 'string') {
    return zones.split('&')
  }
  return null
}
