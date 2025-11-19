# Phone Number information lookup, validation,  carrier name, geo and timezone infos

[![NPM version](https://badgen.net/npm/v/@devmehq/phone-number-validator-js)](https://npm.im/@devmehq/phone-number-validator-js)
[![Build Status](https://github.com/devmehq/phone-number-validator-js/workflows/CI/badge.svg)](https://github.com/devmehq/phone-number-validator-js/actions)
[![Downloads](https://img.shields.io/npm/dm/@devmehq/phone-number-validator-js.svg)](https://www.npmjs.com/package/@devmehq/phone-number-validator-js)
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

✅ Serverless architecture support (AWS Lambda, Cloudflare Workers, Vercel Edge, Deno)


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
We offer this `phone verification and validation and more advanced features` in our Scalable Cloud API Service Offering - You could try it here [Phone Number Verification](https://phone-check.app/products/phone)

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

## Serverless Support

The library provides a lightweight serverless version that's optimized for edge environments like AWS Lambda, Cloudflare Workers, Vercel Edge Functions, and Deno Deploy.

### Features
- **244KB bundle size** (minified) - fits well under most size limits
- **No Node.js dependencies** - runs in any JavaScript environment
- **Resource loader pattern** - load data from your preferred storage (S3, R2, KV, etc.)
- **Same API** - drop-in replacement for the standard version

### Installation for Serverless

```js
// Use the serverless entry point
import { 
  setResourceLoader,
  parsePhoneNumber,
  geocoder,
  carrier,
  timezones
} from '@devmehq/phone-number-validator-js/serverless'
```

### Serverless Examples

#### AWS Lambda
```js
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { setResourceLoader, geocoder, parsePhoneNumber } from '@devmehq/phone-number-validator-js/serverless'

const s3 = new S3Client()

// Set up resource loader
setResourceLoader({
  async loadResource(path) {
    try {
      const command = new GetObjectCommand({
        Bucket: process.env.RESOURCES_BUCKET,
        Key: `phone-validator/${path}`
      })
      const response = await s3.send(command)
      return new Uint8Array(await response.Body.transformToByteArray())
    } catch {
      return null
    }
  }
})

// Lambda handler
export async function handler(event) {
  const phoneNumber = parsePhoneNumber(event.phone, event.country)
  const location = await geocoder(phoneNumber)
  
  return {
    statusCode: 200,
    body: JSON.stringify({ location })
  }
}
```

#### Cloudflare Workers
```js
import { setResourceLoader, carrier, parsePhoneNumber } from '@devmehq/phone-number-validator-js/serverless'

// Use R2 storage for resources
setResourceLoader({
  async loadResource(path) {
    const object = await env.RESOURCES_BUCKET.get(`phone-validator/${path}`)
    if (!object) return null
    const buffer = await object.arrayBuffer()
    return new Uint8Array(buffer)
  }
})

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const phone = url.searchParams.get('phone')
    
    const phoneNumber = parsePhoneNumber(phone)
    const carrierInfo = await carrier(phoneNumber)
    
    return Response.json({ carrier: carrierInfo })
  }
}
```

#### Vercel Edge Functions
```js
import { setResourceLoader, timezones, parsePhoneNumber } from '@devmehq/phone-number-validator-js/serverless'

// Use Vercel Blob storage
setResourceLoader({
  async loadResource(path) {
    const response = await fetch(`${process.env.BLOB_URL}/phone-validator/${path}`)
    if (!response.ok) return null
    const buffer = await response.arrayBuffer()
    return new Uint8Array(buffer)
  }
})

export const config = { runtime: 'edge' }

export default async function handler(req) {
  const { phone } = await req.json()
  const phoneNumber = parsePhoneNumber(phone)
  const tzs = await timezones(phoneNumber)
  
  return Response.json({ timezones: tzs })
}
```

### Resource Files

The serverless version requires resource files to be deployed separately. Download them from the npm package:

```bash
# Extract resource files from the npm package
npm pack @devmehq/phone-number-validator-js
tar -xf devmehq-phone-number-validator-js-*.tgz
cp -r package/resources/* your-storage-location/
```

Then upload to your preferred storage (S3, R2, Blob storage, etc.) and configure the resource loader accordingly.

### Performance Tips

1. **Use caching**: The library includes built-in LRU caching
2. **Deploy resources to the same region** as your functions for lower latency
3. **Consider using CDN** for resource files if serving globally
4. **Use sync loader** when possible for better performance:

```js
// Sync loader for environments that support it
setResourceLoader({
  loadResourceSync(path) {
    // Synchronous loading implementation
    return loadFromCacheSync(path)
  },
  async loadResource(path) {
    // Async fallback
    return loadFromCacheAsync(path)
  }
})
```

For detailed serverless deployment guides, see [SERVERLESS.md](./SERVERLESS.md).


## Performance

The library uses [tiny-lru](https://www.npmjs.com/package/tiny-lru) for high-performance caching:

- **O(1) complexity** for cache operations (get, set, delete)
- **LRU eviction** when cache reaches the size limit
- **Configurable cache size** to balance memory usage and performance
- **<1ms lookups** after initial data load

## Building

Build the library for both standard and serverless environments:

```bash
yarn build
```

This command:
- Creates optimized bundles for CommonJS and ES modules
- Generates TypeScript declaration files
- Builds both standard and serverless versions

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
📧 [Email Support](mailto:support@phone-check.app)
📄 [Commercial License](https://phone-check.app/license/phone-number-validator)
🌐 [Visit phone-check.app](https://phone-check.app)

## LICENSE
Business Source License 1.1 - see [LICENSE](LICENSE.md) file for details.

### 📝 When Do You Need a Commercial License?

The BSL allows use only for non-production purposes. Here's a comprehensive guide to help you understand when you need a commercial license:

| Use Case | Commercial License Required? | Details |
|----------|-----------|---------|
| **Personal & Learning** | | |
| 🔬 Exploring phone-number-validator-js for research or learning | ✅ **No** | Use freely for educational purposes |
| 🎨 Personal hobby projects (non-commercial) | ✅ **No** | Build personal tools and experiments |
| 🧪 Testing and evaluation in development environment | ✅ **No** | Test all features before purchasing |
| **Development & Prototyping** | | |
| 💡 Building proof-of-concept applications | ✅ **No** | Create demos and prototypes |
| 🛠️ Internal tools (not customer-facing) | ✅ **No** | Use for internal development tools |
| 📚 Open source projects (non-commercial) | ✅ **No** | Contribute to the community |
| **Commercial & Production Use** | | |
| 💰 Revenue-generating applications | ❌ **Yes** | Any app that generates income |
| ☁️ Software as a Service (SaaS) products | ❌ **Yes** | Cloud-based service offerings |
| 📦 Distributed commercial software | ❌ **Yes** | Software sold to customers |
| 🏢 Enterprise production systems | ❌ **Yes** | Business-critical applications |
| 🔄 Forking for commercial purposes | ❌ **Yes** | Creating derivative commercial products |
| 🏭 Production use in any form | ❌ **Yes** | Live systems serving real users |
| **Specific Scenarios** | | |
| 🎓 Student projects and coursework | ✅ **No** | Academic use is encouraged |
| 🏗️ CI/CD pipelines (for commercial products) | ❌ **Yes** | Part of commercial development |
| 📱 Phone validation in production APIs | ❌ **Yes** | Production service usage |
| 🛒 E-commerce checkout validation | ❌ **Yes** | Revenue-related validation |
| 📱 Mobile apps (free with ads or paid) | ❌ **Yes** | Monetized applications |

### 💡 Quick Decision Guide

Ask yourself these questions:
1. **Will real users interact with this in production?** → You need a license
2. **Will this help generate revenue?** → You need a license  
3. **Is this for learning or testing only?** → No license needed
4. **Is this an internal prototype or POC?** → No license needed

### 🎯 Why Choose Our Commercial License?

✨ **Unlimited Usage** - Use in all your production applications  
🚀 **Priority Support** - Direct support from our engineering team  
🔄 **Regular Updates** - Get the latest features and improvements  
🛡️ **Legal Protection** - Full commercial rights and warranty  
🏢 **Enterprise Ready** - Suitable for large-scale deployments

### 📄 Get Your Commercial License

Ready to use phone-number-validator-js in production?

🛍️ **[Purchase a License](https://phone-check.app/license/phone-number-validator)** - Simple pricing, instant activation  
📧 **[Contact Sales](mailto:sales@phone-check.app?subject=Interested%20in%20phone-number-validator-js%20commercial%20license)** - For enterprise or custom needs
