# Phone Number information lookup, validation,  carrier name, geo and timezone infos

[![NPM version](https://badgen.net/npm/v/@devmehq/phone-number-validator-js)](https://npm.im/@devmehq/phone-number-validator-js)
[![Build Status](https://github.com/devmehq/phone-number-validator-js/workflows/CI/badge.svg)](https://github.com/devmehq/phone-number-validator-js/actions)
[![Downloads](https://img.shields.io/npm/dm/@devmehq/phone-number-validator-js.svg)](https://www.npmjs.com/package/phone-number-validator-js)
[![UNPKG](https://img.shields.io/badge/UNPKG-OK-179BD7.svg)](https://unpkg.com/browse/@devmehq/phone-number-validator-js@latest/)

### Verify phone number, validate format, checking carrier name, geo and timezone infos.

> This library includes phone number lookup and validation, and the geocoding, carrier mapping and timezone mapping functionalities that are available in some of googles [libphonenumber](https://github.com/google/libphonenumber) libraries.
> 
> To reduce the amount of data that needs to be loaded to geocode / carrier map a phone-number for each mapping only the relevant number prefixes are loaded from a binary json file (BSON).
 When the prefix could not be found in the provided locale the library tries to fall back to `en` as locale.
> 
> The library supports Node.js only at the moment.


## Features
✅ Check phone number validity

✅ Check phone number format

✅ Check phone number carrier name

✅ Check phone number geolocation (city)

✅ Check phone number timezone

✅ Check phone number country code

✅ High-performance LRU caching with configurable size

✅ Comprehensive error handling and input validation

✅ TypeScript support with strict type safety


## Use cases
- Increase delivery rate of SMS campaigns by removing invalid phone numbers
- Increase SMS open rate and your marketing IPs reputation
- Protect your website from spam, bots and fake phone numbers
- Protect your product signup form from fake phone numbers
- Protect your website forms from fake phone numbers
- Protect your self from fraud orders and accounts using fake phone numbers
- Integrate phone number verification into your website forms
- Integrate phone number verification into your backoffice administration and order processing
- Integrate phone number verification into your mobile apps

## API / Cloud Hosted Service
We offer this `phone verification and validation and more advanced features` in our Scalable Cloud API Service Offering - You could try it here [Phone Number Verification](https://dev.me/products/phone)

---

## installation and usage instructions

## Installation

```sh
npm install @devmehq/phone-number-validator-js
```

or

```sh
yarn add @devmehq/phone-number-validator-js
```

## Usage

### Core Methods

- `geocoder(phonenumber: PhoneNumber, locale?: GeocoderLocale = 'en'): string | null` - Resolved to the geocode or null if no geocode could be found (e.g. for mobile numbers)
- `carrier(phonenumber: PhoneNumber, locale?: CarrierLocale = 'en'): string | null` - Resolves to the carrier or null if non could be found (e.g. for fixed line numbers)
- `timezones(phonenumber: PhoneNumber): Array<string> | null` - Resolved to an array of timezones or null if non where found.

### Cache Management Methods

- `clearCache(): void` - Clear all cached data
- `getCacheSize(): number` - Get current cache size
- `setCacheSize(size: number): void` - Set maximum cache size (default: 100)

## Examples

### Basic Usage

```js
import { geocoder, carrier, timezones, parsePhoneNumberFromString } from '@devmehq/phone-number-validator-js'

const fixedLineNumber = parsePhoneNumberFromString('+41431234567')
const locationEN = geocoder(fixedLineNumber) // Zurich
const locationDE = geocoder(fixedLineNumber, 'de') // Zürich
const locationIT = geocoder(fixedLineNumber, 'it') // Zurigo

const mobileNumber = parsePhoneNumberFromString('+8619912345678')
const carrierEN = carrier(mobileNumber) // China Telecom
const carrierZH = carrier(mobileNumber, 'zh') // 中国电信

const fixedLineNumber2 = parsePhoneNumberFromString('+49301234567')
const tzones = timezones(fixedLineNumber2) // ['Europe/Berlin']
```

### Cache Management

```js
import { 
  clearCache, 
  getCacheSize, 
  setCacheSize,
  geocoder,
  parsePhoneNumberFromString 
} from '@devmehq/phone-number-validator-js'

// Adjust cache size based on your needs
setCacheSize(50) // Limit to 50 entries

// Monitor cache usage
console.log(`Cache size: ${getCacheSize()}`)

// Perform lookups
const phoneNumber = parsePhoneNumberFromString('+41431234567')
const location = geocoder(phoneNumber)

// Clear cache when needed
if (getCacheSize() > 40) {
  clearCache()
}

// For long-running processes, you might want to clear cache periodically
setInterval(() => {
  clearCache()
}, 3600000) // Clear every hour
```

### Error Handling

```js
import { geocoder, parsePhoneNumberFromString } from '@devmehq/phone-number-validator-js'

// Invalid phone numbers return null
const invalid = parsePhoneNumberFromString('invalid')
const result = geocoder(invalid) // null

// Undefined/null inputs are handled gracefully
const result2 = geocoder(undefined) // null
const result3 = geocoder(null) // null
```

### TypeScript Usage

```typescript
import { 
  geocoder, 
  carrier, 
  timezones,
  parsePhoneNumberFromString,
  PhoneNumber,
  GeocoderLocale,
  CarrierLocale
} from '@devmehq/phone-number-validator-js'

// Type-safe locale usage
const phoneNumber: PhoneNumber | undefined = parsePhoneNumberFromString('+41431234567')
const locale: GeocoderLocale = 'de'

const location: string | null = geocoder(phoneNumber, locale)
const carrierInfo: string | null = carrier(phoneNumber)
const tzs: string[] | null = timezones(phoneNumber)

// Cache management with types
import { setCacheSize, getCacheSize, clearCache } from '@devmehq/phone-number-validator-js'

const size: number = getCacheSize()
setCacheSize(50)
clearCache()
```


## Performance

The library uses [tiny-lru](https://www.npmjs.com/package/tiny-lru) for high-performance caching:

- **O(1) complexity** for cache operations (get, set, delete)
- **LRU eviction** when cache reaches the size limit
- **Configurable cache size** to balance memory usage and performance
- **<1ms lookups** after initial data load

## Testing

```bash
yarn test
```

Run tests in production mode (suppresses debug logs):

```bash
NODE_ENV=production yarn test
```

## Contributing
Please feel free to open an issue or create a pull request and fix bugs or add features, All contributions are welcome. Thank you!

## Support
For issues, questions, or commercial licensing:

🐛 [Open an Issue](https://github.com/devmehq/phone-number-validator-js/issues)
📧 [Email Support](mailto:support@dev.me)
📄 [Commercial License](https://dev.me/license/phone-number-validator)
🌐 [Visit Dev.me](https://dev.me)

## LICENSE
Business Source License 1.1 - see [LICENSE](LICENSE.md) file for details.

The BSL allows use only for non-production purposes. Here's when you need a commercial license:

| Use Case | Is a commercial license required? |
|----------|-----------|
| Exploring phone-number-validator-js for your own research, hobbies, and testing purposes | **No** |
| Using phone-number-validator-js to build a proof-of-concept application | **No** |
| Using phone-number-validator-js to build revenue-generating applications | **Yes** |
| Using phone-number-validator-js to build software that is provided as a service (SaaS) | **Yes** |
| Forking phone-number-validator-js for any production purposes | **Yes** |

To purchase a license for uses not authorized by BSL, please visit [https://dev.me/license/phone-number-validator](https://dev.me/license/phone-number-validator) or contact us at [sales@dev.me](mailto:sales@dev.me?subject=Interested%20in%20phone-number-validator-js%20commercial%20license).
