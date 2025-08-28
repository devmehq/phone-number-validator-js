# Serverless Phone Number Validator

This library now supports serverless environments without Node.js dependencies! We provide two approaches for serverless deployment:

1. **Lite Version** - Smallest bundle size (244KB minified), requires external resource loading
2. **Full Version** - All resources bundled (40MB), no external dependencies needed

## Features

- **Zero Node.js dependencies** - Works in any JavaScript runtime
- **Flexible resource loading** - Choose between bundled or external resources
- **Optimized builds** - From 244KB (lite) to 40MB (full)
- **Multiple formats** - ESM, CommonJS, and UMD builds available
- **Platform agnostic** - Works on AWS Lambda, Cloudflare Workers, Vercel Edge, Deno Deploy, and more

## Installation

```bash
npm install @devmehq/phone-number-validator-js
# or
yarn add @devmehq/phone-number-validator-js
```

## Building for Serverless

### Lite Version (Recommended for size-constrained environments)

```bash
# Build lite versions (244KB minified)
yarn build:serverless:lite
```

Creates in `lib/`:
- `serverless.lite.esm.js` - ES Module (555KB)
- `serverless.lite.esm.min.js` - ES Module minified (244KB)
- `serverless.lite.cjs.js` - CommonJS (556KB)
- `serverless.lite.umd.js` - UMD (568KB)
- `serverless.lite.umd.min.js` - UMD minified (244KB)

### Full Version (All resources bundled)

```bash
# Build full versions (40MB, includes all data)
yarn build:serverless
```

Creates in `lib/`:
- `serverless.esm.js` - ES Module with all resources
- `serverless.cjs.js` - CommonJS with all resources
- `serverless.umd.js` - UMD with all resources

## Usage

### Lite Version (With Resource Loader)

The lite version requires you to provide a resource loader for accessing phone number metadata:

```javascript
import { 
  setResourceLoader, 
  parsePhoneNumber, 
  geocoderAsync, 
  carrierAsync, 
  timezonesAsync 
} from '@devmehq/phone-number-validator-js/lib/serverless.lite.esm.min.js';

// Set up your resource loader (see examples below)
import { CloudflareKVLoader } from './resource-loaders.js';
const loader = new CloudflareKVLoader(env.PHONE_DATA);
setResourceLoader(loader);

// Parse and validate
const phoneNumber = parsePhoneNumber('+14155552671', 'US');

if (phoneNumber && phoneNumber.isValid()) {
  // Use async methods with lite version
  const [geo, car, tz] = await Promise.all([
    geocoderAsync(phoneNumber),
    carrierAsync(phoneNumber),
    timezonesAsync(phoneNumber)
  ]);
  
  console.log({
    international: phoneNumber.formatInternational(),
    geocoder: geo,
    carrier: car,
    timezones: tz
  });
}
```

### Full Version (Self-contained)

The full version includes all resources and works immediately:

```javascript
import { parsePhoneNumber, geocoder, carrier, timezones } from '@devmehq/phone-number-validator-js/lib/serverless.esm.js';

const phoneNumber = parsePhoneNumber('+14155552671', 'US');

if (phoneNumber && phoneNumber.isValid()) {
  console.log({
    international: phoneNumber.formatInternational(),
    national: phoneNumber.formatNational(),
    e164: phoneNumber.format('E.164'),
    country: phoneNumber.country,
    geocoder: geocoder(phoneNumber),
    carrier: carrier(phoneNumber),
    timezones: timezones(phoneNumber)
  });
}
```

## Platform-Specific Deployment

### AWS Lambda

Deploy as a Lambda function with Node.js 18+ runtime:

```javascript
// handler.js
import { parsePhoneNumber, geocoder, carrier, timezones } from './serverless.esm.js';

export const handler = async (event) => {
  const { phoneNumber, countryCode } = JSON.parse(event.body);
  const parsed = parsePhoneNumber(phoneNumber, countryCode);
  
  if (!parsed || !parsed.isValid()) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid phone number' })
    };
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      valid: true,
      country: parsed.country,
      geocoder: geocoder(parsed),
      carrier: carrier(parsed),
      timezones: timezones(parsed)
    })
  };
};
```

Deploy with AWS SAM:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  PhoneValidatorFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: .
      Handler: handler.handler
      Runtime: nodejs18.x
      MemorySize: 256
      Timeout: 10
```

### Cloudflare Workers

```javascript
// worker.js
import { parsePhoneNumber, geocoder, carrier, timezones } from './serverless.esm.js';

export default {
  async fetch(request) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }
    
    const { phoneNumber, countryCode } = await request.json();
    const parsed = parsePhoneNumber(phoneNumber, countryCode);
    
    if (!parsed || !parsed.isValid()) {
      return Response.json({ error: 'Invalid phone number' }, { status: 400 });
    }
    
    return Response.json({
      valid: true,
      country: parsed.country,
      geocoder: geocoder(parsed),
      carrier: carrier(parsed),
      timezones: timezones(parsed)
    });
  }
};
```

Deploy with Wrangler:

```toml
# wrangler.toml
name = "phone-validator"
main = "worker.js"
compatibility_date = "2023-05-18"

[build]
command = "yarn build:serverless"
```

```bash
wrangler deploy
```

### Vercel Edge Functions

```javascript
// api/validate.js
import { parsePhoneNumber, geocoder, carrier, timezones } from '../lib/serverless.esm.js';

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const { phoneNumber, countryCode } = await request.json();
  const parsed = parsePhoneNumber(phoneNumber, countryCode);
  
  if (!parsed || !parsed.isValid()) {
    return Response.json({ error: 'Invalid phone number' }, { status: 400 });
  }
  
  return Response.json({
    valid: true,
    country: parsed.country,
    geocoder: geocoder(parsed),
    carrier: carrier(parsed),
    timezones: timezones(parsed)
  });
}
```

Deploy with Vercel CLI:

```bash
vercel deploy
```

### Deno Deploy

```typescript
// main.ts
import { parsePhoneNumber, geocoder, carrier, timezones } from './serverless.esm.js';

async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  const { phoneNumber, countryCode } = await request.json();
  const parsed = parsePhoneNumber(phoneNumber, countryCode);
  
  if (!parsed || !parsed.isValid()) {
    return Response.json({ error: 'Invalid phone number' }, { status: 400 });
  }
  
  return Response.json({
    valid: true,
    country: parsed.country,
    geocoder: geocoder(parsed),
    carrier: carrier(parsed),
    timezones: timezones(parsed)
  });
}

Deno.serve(handler);
```

Deploy with deployctl:

```bash
deployctl deploy --project=phone-validator main.ts
```

### Netlify Edge Functions

```javascript
// netlify/edge-functions/validate.js
import { parsePhoneNumber, geocoder, carrier, timezones } from '../../lib/serverless.esm.js';

export default async (request, context) => {
  const { phoneNumber, countryCode } = await request.json();
  const parsed = parsePhoneNumber(phoneNumber, countryCode);
  
  if (!parsed || !parsed.isValid()) {
    return Response.json({ error: 'Invalid phone number' }, { status: 400 });
  }
  
  return Response.json({
    valid: true,
    country: parsed.country,
    geocoder: geocoder(parsed),
    carrier: carrier(parsed),
    timezones: timezones(parsed)
  });
};

export const config = { path: "/api/validate" };
```

## API Reference

All functions from the main library are available in the serverless build:

### Core Functions
- `parsePhoneNumber(text, defaultCountry?)` - Parse a phone number
- `parsePhoneNumberFromString(text, defaultCountry?)` - Parse with error handling
- `isValidNumber(phoneNumber)` - Check if valid
- `isPossibleNumber(phoneNumber)` - Check if possibly valid
- `getNumberType(phoneNumber)` - Get number type (MOBILE, FIXED_LINE, etc.)

### Additional Metadata Functions
- `geocoder(phoneNumber, locale?)` - Get geographical location
- `carrier(phoneNumber, locale?)` - Get carrier information
- `timezones(phoneNumber)` - Get timezone information

### Cache Management
- `clearCache()` - Clear internal cache
- `getCacheSize()` - Get current cache size
- `setCacheSize(size)` - Set maximum cache size

## Resource Loaders (Lite Version)

The lite version requires a resource loader to fetch phone number metadata. See `examples/serverless/resource-loaders.js` for implementations:

### Available Loaders

- **CloudflareKVLoader** - Uses Cloudflare KV storage
- **S3ResourceLoader** - Loads from AWS S3
- **RemoteFetchLoader** - Fetches from CDN/HTTP endpoints
- **DenoKVLoader** - Uses Deno KV storage
- **BundledResourceLoader** - Pre-loaded resources in memory
- **CDNResourceLoader** - Optimized CDN fetching with edge caching
- **RedisResourceLoader** - Uses Redis for resource storage
- **MultiTierLoader** - Combines multiple loaders with fallback

### Creating a Custom Loader

```javascript
class CustomResourceLoader {
  async loadResource(path) {
    // Return Uint8Array of the BSON file or null if not found
    const data = await fetchFromYourSource(path);
    return data ? new Uint8Array(data) : null;
  }
  
  // Optional: sync version for synchronous functions
  loadResourceSync(path) {
    const data = fetchFromYourSourceSync(path);
    return data ? new Uint8Array(data) : null;
  }
}
```

## Performance Considerations

### Bundle Sizes
#### Lite Version (Recommended)
- ESM minified: **244KB**
- UMD minified: **244KB**
- ESM unminified: 555KB
- CommonJS: 556KB

#### Full Version
- All formats: ~40MB (includes all phone metadata)

### Memory Usage
- Initial load: ~2MB
- Runtime with cache: ~3-5MB depending on usage

### Cold Start Times
- AWS Lambda: ~200-400ms
- Cloudflare Workers: ~50-100ms
- Vercel Edge: ~100-200ms
- Deno Deploy: ~50-150ms

## Optimization Tips

1. **Use appropriate cache size**: Default is 100 entries. Adjust based on your usage patterns.

```javascript
import { setCacheSize } from './serverless.esm.js';
setCacheSize(50); // Reduce memory usage
```

2. **Reuse parsed numbers**: Parse once and reuse the PhoneNumber object.

```javascript
const parsed = parsePhoneNumber(input);
// Use parsed multiple times
const geo = geocoder(parsed);
const car = carrier(parsed);
const tz = timezones(parsed);
```

3. **Enable response caching**: Add cache headers to your responses.

```javascript
return new Response(JSON.stringify(result), {
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=3600'
  }
});
```

## Migration from Node.js Version

The serverless API is identical to the Node.js version. Simply change your import:

```javascript
// Before (Node.js only)
import { parsePhoneNumber } from '@devmehq/phone-number-validator-js';

// After (Serverless)
import { parsePhoneNumber } from '@devmehq/phone-number-validator-js/lib/serverless.esm.js';
```

## Troubleshooting

### Module not found errors
Ensure you've built the serverless version:
```bash
yarn build:serverless
```

### Large bundle size warnings
The library includes comprehensive phone metadata. Use tree-shaking and compression:
```javascript
// Only import what you need
import { parsePhoneNumber } from './serverless.esm.js';
```

### Memory issues
Reduce cache size for memory-constrained environments:
```javascript
import { setCacheSize } from './serverless.esm.js';
setCacheSize(20);
```

## Examples

Complete working examples for each platform are available in the `examples/serverless/` directory:

- `aws-lambda.js` - AWS Lambda implementation
- `cloudflare-worker.js` - Cloudflare Workers implementation
- `vercel-edge.js` - Vercel Edge Functions implementation
- `deno-deploy.ts` - Deno Deploy implementation

## Support

For issues or questions about serverless deployment, please open an issue on [GitHub](https://github.com/devmehq/phone-number-validator-js/issues).

## License

BSL 1.1 - See LICENSE file for details.