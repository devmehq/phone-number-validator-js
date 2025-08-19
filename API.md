# API Documentation

## Table of Contents
- [Core Functions](#core-functions)
  - [geocoder](#geocoder)
  - [carrier](#carrier)
  - [timezones](#timezones)
- [Cache Management](#cache-management)
  - [clearCache](#clearcache)
  - [getCacheSize](#getcachesize)
  - [setCacheSize](#setcachesize)
- [Type Definitions](#type-definitions)
- [Locales](#locales)

## Core Functions

### geocoder

Provides geographical information related to a phone number.

```typescript
geocoder(
  phonenumber: PhoneNumber | undefined,
  locale?: GeocoderLocale
): string | null
```

#### Parameters
- `phonenumber` - A parsed phone number object from `libphonenumber-js`
- `locale` - Optional locale for localized location names (default: `'en'`)

#### Returns
- Location name as string if found
- `null` if no location data available or invalid input

#### Example
```javascript
import { geocoder, parsePhoneNumberFromString } from '@devmehq/phone-number-validator-js'

const phoneNumber = parsePhoneNumberFromString('+41431234567')
const locationEN = geocoder(phoneNumber) // "Zurich"
const locationDE = geocoder(phoneNumber, 'de') // "Zürich"
```

---

### carrier

Maps a phone number to its original carrier.

**Note:** This method returns the original carrier assigned to the number range, not the current carrier if the number has been ported.

```typescript
carrier(
  phonenumber: PhoneNumber | undefined,
  locale?: CarrierLocale
): string | null
```

#### Parameters
- `phonenumber` - A parsed phone number object from `libphonenumber-js`
- `locale` - Optional locale for localized carrier names (default: `'en'`)

#### Returns
- Carrier name as string if found
- `null` if no carrier data available (e.g., landline numbers) or invalid input

#### Example
```javascript
import { carrier, parsePhoneNumberFromString } from '@devmehq/phone-number-validator-js'

const phoneNumber = parsePhoneNumberFromString('+8619912345678')
const carrierEN = carrier(phoneNumber) // "China Telecom"
const carrierZH = carrier(phoneNumber, 'zh') // "中国电信"
```

---

### timezones

Provides all timezones associated with a phone number.

```typescript
timezones(
  phonenumber: PhoneNumber | undefined
): string[] | null
```

#### Parameters
- `phonenumber` - A parsed phone number object from `libphonenumber-js`

#### Returns
- Array of timezone identifiers (e.g., `['America/New_York']`)
- `null` if no timezone data available or invalid input

#### Example
```javascript
import { timezones, parsePhoneNumberFromString } from '@devmehq/phone-number-validator-js'

const phoneNumber = parsePhoneNumberFromString('+12124567890')
const tzs = timezones(phoneNumber) // ['America/New_York']
```

## Cache Management

The library uses an LRU (Least Recently Used) cache to optimize performance. The cache automatically evicts the least recently used entries when it reaches its size limit.

### clearCache

Clears all cached data. Useful for memory management in long-running processes.

```typescript
clearCache(): void
```

#### Example
```javascript
import { clearCache } from '@devmehq/phone-number-validator-js'

// Clear all cached data
clearCache()
```

---

### getCacheSize

Returns the current number of items in the cache.

```typescript
getCacheSize(): number
```

#### Returns
- Number of cached entries

#### Example
```javascript
import { getCacheSize } from '@devmehq/phone-number-validator-js'

const size = getCacheSize()
console.log(`Current cache size: ${size}`)
```

---

### setCacheSize

Sets the maximum cache size. When the cache reaches this limit, the least recently used entries are evicted.

```typescript
setCacheSize(size: number): void
```

#### Parameters
- `size` - Maximum number of entries to cache

#### Example
```javascript
import { setCacheSize } from '@devmehq/phone-number-validator-js'

// Limit cache to 50 entries
setCacheSize(50)

// Increase cache for better performance (uses more memory)
setCacheSize(200)

// Reduce cache for lower memory usage
setCacheSize(10)
```

## Type Definitions

### PhoneNumber

The `PhoneNumber` type is exported from `libphonenumber-js`. It represents a parsed phone number with various properties:

```typescript
interface PhoneNumber {
  country?: string
  countryCallingCode: string
  nationalNumber: string
  number: string
  // ... other properties
}
```

### GeocoderLocale

Supported locales for geocoding:

```typescript
type GeocoderLocale = 'ar' | 'be' | 'bg' | 'bs' | 'de' | 'el' | 'en' | 
  'es' | 'fa' | 'fi' | 'fr' | 'hr' | 'hu' | 'hy' | 'id' | 'it' | 'iw' | 
  'ja' | 'ko' | 'nl' | 'pl' | 'pt' | 'ro' | 'ru' | 'sq' | 'sr' | 'sv' | 
  'th' | 'tr' | 'uk' | 'vi' | 'zh' | 'zh_Hant'
```

### CarrierLocale

Supported locales for carrier information:

```typescript
type CarrierLocale = 'ar' | 'be' | 'en' | 'fa' | 'ko' | 'ru' | 'uk' | 
  'zh' | 'zh_Hant'
```

## Locales

### Locale Fallback

When a requested locale is not available for a specific phone number, the library automatically falls back to English (`'en'`).

### Available Locales by Region

#### Geocoding Locales
- **Arabic** (`ar`): Middle East regions
- **Chinese Simplified** (`zh`): Mainland China
- **Chinese Traditional** (`zh_Hant`): Hong Kong, Taiwan
- **English** (`en`): Default, worldwide coverage
- **German** (`de`): Germany, Austria, Switzerland
- **Spanish** (`es`): Spain, Latin America
- **French** (`fr`): France, French-speaking regions
- And many more...

#### Carrier Locales
- **Arabic** (`ar`): Middle East carriers
- **Chinese** (`zh`): Chinese carriers
- **English** (`en`): Default, worldwide carriers
- **Korean** (`ko`): Korean carriers
- **Russian** (`ru`): Russian carriers

## Performance Considerations

### Caching Strategy

The library uses [tiny-lru](https://www.npmjs.com/package/tiny-lru) for optimal performance:

1. **First Lookup**: Loads data from disk (slower, ~10-50ms)
2. **Subsequent Lookups**: Retrieves from cache (<1ms)
3. **Cache Eviction**: Automatic LRU eviction when limit reached

### Memory Management

For long-running applications:

```javascript
import { setCacheSize, clearCache, getCacheSize } from '@devmehq/phone-number-validator-js'

// Option 1: Limit cache size
setCacheSize(50) // Balance between performance and memory

// Option 2: Periodic cache clearing
setInterval(() => {
  if (getCacheSize() > 80) {
    clearCache()
  }
}, 3600000) // Check every hour

// Option 3: Dynamic adjustment based on memory
const checkMemory = () => {
  const usage = process.memoryUsage()
  if (usage.heapUsed > 100 * 1024 * 1024) { // 100MB
    setCacheSize(10) // Reduce cache
  } else {
    setCacheSize(100) // Normal cache
  }
}
```

## Error Handling

All functions handle invalid inputs gracefully:

```javascript
import { geocoder, carrier, timezones } from '@devmehq/phone-number-validator-js'

// All return null for invalid inputs
geocoder(undefined) // null
geocoder(null) // null
carrier(undefined) // null
timezones(undefined) // null

// Invalid phone numbers
const invalid = parsePhoneNumberFromString('invalid')
geocoder(invalid) // null
```

## Development vs Production

In development mode (`NODE_ENV !== 'production'`), the library logs errors to help with debugging:

```bash
# Development mode - shows error logs
yarn test

# Production mode - suppresses error logs
NODE_ENV=production yarn test
```

## Thread Safety

The library is thread-safe for read operations. However, cache management operations (`setCacheSize`, `clearCache`) should be synchronized in multi-threaded environments.